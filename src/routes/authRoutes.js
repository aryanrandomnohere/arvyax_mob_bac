import { Router } from "express";
import jwt from "jsonwebtoken";
import RegisterUser from "../models/UserModel.js";
import { JWT_SECRET } from "../config/constants.js";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otpService.js";
import { sendOtpEmail, sendWelcomeEmail } from "../utils/emailService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import UserActivityDay from "../models/UserActivityDay.js";
import { tryCatch, validateBody } from "../utils/http.js";
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  onboardingSchema,
  socialLoginSchema,
} from "../validation/authSchemas.js";
import { verifySocialLogin } from "../utils/socialAuthService.js";

const router = Router();

// Temporary storage for signup OTP (not stored in DB yet)
const pendingRegistrations = new Map();

router.post(
  "/register",
  validateBody(registerSchema),
  tryCatch(async (req, res) => {
    try {
      const { username, email } = req.body;

      if (!email || !username) {
        return res
          .status(400)
          .json({ error: "Name and Email are required fields" });
      }

      const exists = await RegisterUser.findOne({ email });
      if (exists) {
        return res.status(400).json({ error: "User already exists" });
      }

      const otp = generateOtp();
      const hashedOtp = await hashOtp(otp);

      pendingRegistrations.set(email, {
        username,
        email,
        otp: hashedOtp,
        otpExpires: Date.now() + 10 * 60 * 1000,
      });

      await sendOtpEmail(email, otp);

      return res.json({
        message: "OTP sent. Please verify to complete registration.",
        otp,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  })
);

router.post(
  "/verify-otp",
  validateBody(verifyOtpSchema),
  tryCatch(async (req, res) => {
    try {
      const { email, otp } = req.body;

      const pending = pendingRegistrations.get(email);
      if (!pending) {
        return res.status(400).json({ error: "No registration found" });
      }

      if (pending.otpExpires < Date.now()) {
        pendingRegistrations.delete(email);
        return res.status(400).json({ error: "OTP expired" });
      }

      const valid = await verifyOtp(otp, pending.otp);
      if (!valid) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const newUser = new RegisterUser({
        username: pending.username,
        email: pending.email,
        isEmailVerified: true,
        onboardingCompleted: false,
      });

      await newUser.save();
      pendingRegistrations.delete(email);

      if (!newUser || !newUser.email || !newUser.username || !newUser._id) {
        return res.status(500).json({ error: "Error creating user" });
      }

      await sendWelcomeEmail(newUser.email, newUser.username);

      try {
        await UserActivityDay.markActive(String(newUser._id));
      } catch (err) {
        console.warn("ACTIVITY MARK ERROR (SIGNUP VERIFY):", err);
      }

      const token = jwt.sign({ user: { id: newUser._id } }, JWT_SECRET, {
        expiresIn: "1000h",
      });

      return res.json({
        message: "OTP verified successfully. Proceed with onboarding.",
        token,
        user: newUser,
      });
    } catch (err) {
      console.error("OTP VERIFY ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  })
);

router.post(
  "/login",
  validateBody(loginSchema),
  tryCatch(async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const user = await RegisterUser.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ error: "User not found. Please sign up." });
      }

      const otp = generateOtp();
      const hashedOtp = await hashOtp(otp);

      user.otp = hashedOtp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(email, otp);
      return res.json({ message: "OTP sent to email", otp });
    } catch (err) {
      console.error("LOGIN OTP ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  })
);

router.post(
  "/login/verify-otp",
  validateBody(verifyOtpSchema),
  tryCatch(async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await RegisterUser.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.otp || !user.otpExpires)
        return res.status(400).json({ error: "No OTP found" });

      if (user.otpExpires.getTime() < Date.now()) {
        delete user.otp;
        delete user.otpExpires;
        await user.save();
        return res.status(400).json({ error: "OTP expired" });
      }

      const valid = await verifyOtp(otp, user.otp);
      if (!valid) return res.status(400).json({ error: "Invalid OTP" });

      delete user.otp;
      delete user.otpExpires;
      await user.save();

      const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, {
        expiresIn: "1000h",
      });

      try {
        await UserActivityDay.markActive(String(user._id));
      } catch (err) {
        console.warn("ACTIVITY MARK ERROR (LOGIN VERIFY):", err);
      }

      return res.json({
        message: "Login successful",
        token,
        user,
      });
    } catch (err) {
      console.error("LOGIN VERIFY ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  })
);

router.post(
  "/onboarding",
  authMiddleware,
  validateBody(onboardingSchema),
  tryCatch(async (req, res) => {
    try {
      const { name, gender, dob } = req.body;

      if (!name || !gender || !dob) {
        return res.status(400).json({ error: "Name, Gender and DOB required" });
      }

      const userId = req.user.id;
      const user = await RegisterUser.findById(userId);

      if (!user) return res.status(404).json({ error: "User not found" });

      user.preferences.nickname = String(name).trim();
      user.preferences.gender = gender;
      user.preferences.dob = new Date(dob);
      user.onboardingCompleted = true;

      await user.save();

      return res.json({ message: "Onboarding completed", user });
    } catch (err) {
      console.error("ONBOARDING ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  })
);

router.get("/ping", authMiddleware, async (req, res) => {
  const now = new Date();
  const dateKey = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  return res.json({ active: true, dateKey });
});

// Unified Social Login endpoint
router.post(
  "/social-login",
  validateBody(socialLoginSchema),
  tryCatch(async (req, res) => {
    const {
      provider,
      idToken,
      accessToken,
      email: fallbackEmail,
      name: fallbackName,
      photoUrl: fallbackPhoto,
    } = req.body;

    // Verify provider token and get normalized profile
    const profile = await verifySocialLogin(provider, { idToken, accessToken });

    const email = profile.email || fallbackEmail || "";
    const name = profile.name || fallbackName || "User";
    const photoUrl = profile.photoUrl || fallbackPhoto || "";

    // Find or create user by provider ID or email
    const query = [];
    if (email) query.push({ email });
    if (provider === "google") query.push({ googleId: profile.providerId });
    if (provider === "apple") query.push({ appleId: profile.providerId });
    if (provider === "facebook") query.push({ facebookId: profile.providerId });
    if (provider === "github") query.push({ githubId: profile.providerId });

    let user = await RegisterUser.findOne(
      query.length ? { $or: query } : { _id: null }
    );
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new RegisterUser({
        username: name,
        email: email || undefined,
        photoUrl,
        isEmailVerified: true,
      });
    }

    // Attach provider ID and update user info
    if (provider === "google") user.googleId = profile.providerId;
    if (provider === "apple") user.appleId = profile.providerId;
    if (provider === "facebook") user.facebookId = profile.providerId;
    if (provider === "github") user.githubId = profile.providerId;
    if (email && !user.email) user.email = email;
    if (name && (!user.username || user.username === "User"))
      user.username = name;
    // Always update photoUrl if provided (keeps profile picture current)
    if (photoUrl) user.photoUrl = photoUrl;
    user.isEmailVerified = true;

    await user.save();

    try {
      await UserActivityDay.markActive(String(user._id));
    } catch (err) {
      console.warn("ACTIVITY MARK ERROR (SOCIAL LOGIN):", err);
    }

    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, {
      expiresIn: "1000h",
    });

    if (isNewUser && email && name) {
      try {
        await sendWelcomeEmail(email, name);
      } catch (e) {
        console.warn("WELCOME EMAIL ERROR (SOCIAL LOGIN):", e.message);
      }
    }

    return res.json({
      message: isNewUser
        ? "User registered successfully"
        : "User logged in successfully",
      isNewUser,
      token,
      user,
      provider,
    });
  })
);

export default router;
