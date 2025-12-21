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
} from "../validation/authSchemas.js";

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
        expiresIn: "10h",
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
        expiresIn: "10h",
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
      const { gender, dob } = req.body;

      if (!gender || !dob)
        return res.status(400).json({ error: "Gender and DOB required" });

      const userId = req.user.id;
      const user = await RegisterUser.findById(userId);

      if (!user) return res.status(404).json({ error: "User not found" });

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

export default router;
