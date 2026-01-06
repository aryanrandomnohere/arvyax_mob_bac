import { Router } from "express";
import jwt from "jsonwebtoken";
import RegisterUser from "../models/UserModel.js";
import { JWT_SECRET, TEST_EMAIL, TEST_OTP } from "../config/constants.js";
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
import { buildProfilePayload } from "../controllers/profileController.js";

const router = Router();

const isNonProd = ["development", "test"].includes(process.env.NODE_ENV);
const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const shouldUseTestOtpForEmail = (email) => {
  if (!isNonProd) return false;
  if (!TEST_EMAIL || !TEST_OTP) return false;
  return normalizeEmail(email) === normalizeEmail(TEST_EMAIL);
};

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

      const otp = shouldUseTestOtpForEmail(email)
        ? String(TEST_OTP)
        : generateOtp();
      const hashedOtp = await hashOtp(otp);

      pendingRegistrations.set(email, {
        username,
        email,
        otp: hashedOtp,
        otpExpires: Date.now() + 10 * 60 * 1000,
      });

      if (!shouldUseTestOtpForEmail(email)) {
        await sendOtpEmail(email, otp);
      }

      return res.json({
        message: "OTP sent. Please verify to complete registration.",
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

      const otp = shouldUseTestOtpForEmail(email)
        ? String(TEST_OTP)
        : generateOtp();
      const hashedOtp = await hashOtp(otp);

      user.otp = hashedOtp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      if (!shouldUseTestOtpForEmail(email)) {
        await sendOtpEmail(email, otp);
      }

      return res.json({ message: "OTP sent to email" });
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
// Test tokens and user data for social login
const TEST_SOCIAL = {
  google: {
    idToken:
      "eyJhbGciOiJSUzI1NiIsImtpZCI6IjRiYTZlZmVmNWUxNzIxNDk5NzFhMmQzYWJiNWYzMzJlMGY3ODcxNjUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyNzI4MzMzNDE4MDktY2xsdXNxOHRocTJqbDlzczFjZzJtbHNkZjVmZTloZTMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyNzI4MzMzNDE4MDktY2xsdXNxOHRocTJqbDlzczFjZzJtbHNkZjVmZTloZTMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDcyNzI3MDM3ODczMzIyODIxMzQiLCJlbWFpbCI6InNocmVleWFzaHNqOEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6ImpFSkJxUENhcC1hTUwwZFMxQ3VzR3ciLCJub25jZSI6IjJNeUx5VTQ1N09LUWVuTzFob25pV3VHM2dKX1NlYTZmUnVOdW1aMWR1SEEiLCJuYW1lIjoiU2hyZWUgU2hyZWUiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2t0TE5HZFI5R3RPMnl2WTN4bHpaR1pCX1R0VzJldUU3cTRQZE1rN2NUN2dyaS1RPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlNocmVlIiwiZmFtaWx5X25hbWUiOiJTaHJlZSIsImlhdCI6MTc2NzYzODgzOCwiZXhwIjoxNzY3NjQyNDM4fQ.sMu7LZSnKE95TVD-S38kh_TFWRFpZaDyuR3y3J8AsvCRh_FtEv_GrGZXD1VKOdqUeffGnaPNOOSW5rmmnhm3_-SsQtS95hqadDrcHkNQPnd9KvbBEYUM65VW3",
    email: "shreeyashsj8@gmail.com",
    name: "Shree Shree",
    photoUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocKktLNGdR9GtO2yvY3xlzZGZB_TtW2euE7q4PdMk7cT7gri-Q=s1337",
  },
  apple: {
    idToken:
      "eyJraWQiOiJiRnd6bGVSOHRmIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiY29tLmFydnlheC5hcHAiLCJleHAiOjE3Njc3MjUyNTcsImlhdCI6MTc2NzYzODg1Nywic3ViIjoiMDAwMDM3LmE0MWEyNzgwOGNlNTRmMWI5N2U4ODVlNzEzMGYzOTQ0LjE4MzUiLCJjX2hhc2giOiJYRmRpbEJqeGpDbV8yMTJBWUhzcU9BIiwiZW1haWwiOiJqZWp1cmthcnNocmVleWFzaEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXV0aF90aW1lIjoxNzY3NjM4ODU3LCJub25jZV9zdXBwb3J0ZWQiOnRydWV9.BK6ciYNuSuIBvC9OINdB5rZx5ZrF8B4jmB3IAb6GW1nRLPWJI3u1QtjoYO7xx6dYqk-2p5WB6S75MRNnDLDsj11gqPgTMSni7IZMWKvdkFjlGgbU7iTAAgUt_u6S-I3gysF-F_d6nR_cIUkds1uTS6vsmdCkU23aGxYTI1Mi3N92Qmg3RkPcPm2DTry5qPBP43T9y_23tKXdVzs6Hyf1CHnriRE_73iY39AVmqJpZDH8LOEwMQe3o-agzNNFtmN4SIa7mko5grRT-X5Ve42ZbFZ9Smp5AOvvwcI5AZaBMsqSAith4osESThA4_YG_fXX38MnGIIiVISSz_dVLfVb9g",
    email: null,
    name: null,
    photoUrl: null,
  },
};

router.post(
  "/social-login",
  validateBody(socialLoginSchema),
  tryCatch(async (req, res) => {
    let {
      provider,
      idToken,
      accessToken,
      email: fallbackEmail,
      name: fallbackName,
      photoUrl: fallbackPhoto,
    } = req.body;

    // If no idToken provided, use test data for the provider
    if (
      (!provider || (!idToken && !accessToken)) &&
      process.env.NODE_ENV !== "production"
    ) {
      provider = provider || "google"; // default to google if not specified
      if (TEST_SOCIAL[provider]) {
        idToken = TEST_SOCIAL[provider].idToken;
        fallbackEmail = TEST_SOCIAL[provider].email;
        fallbackName = TEST_SOCIAL[provider].name;
        fallbackPhoto = TEST_SOCIAL[provider].photoUrl;
      }
    }

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
        isEmailVerified: Boolean(profile.emailVerified || !email),
      });
    }

    // Attach provider stable user id (token `sub`) and update user info.
    // NOTE: We do not store the idToken itself; we store the stable provider user id.
    if (provider === "google") user.googleId = profile.providerId;
    if (provider === "apple") user.appleId = profile.providerId;
    if (email && !user.email) user.email = email;
    if (name && (!user.username || user.username === "User"))
      user.username = name;
    // Always update photoUrl if provided (keeps profile picture current)
    if (photoUrl) user.photoUrl = photoUrl;

    // Mark verified if the provider asserts it.
    // If email is not present (possible with Apple on subsequent logins), don't override existing state.
    if (email) {
      user.isEmailVerified = Boolean(profile.emailVerified);
    }

    // Social login implies a successful login, so clear any pending OTP state.
    user.otp = undefined;
    user.otpExpires = undefined;

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

    const profilePayload = await buildProfilePayload(String(user._id));

    return res.json({
      message: isNewUser
        ? "User registered successfully"
        : "User logged in successfully",
      isNewUser,
      token,
      // Keep a minimal user object to avoid leaking OTP/other internals.
      user: {
        _id: user._id,
        username: user.username,
        email: user.email ?? null,
        photoUrl: user.photoUrl ?? null,
        onboardingCompleted: Boolean(user.onboardingCompleted),
      },
      profile: profilePayload,
      provider,
    });
  })
);

export default router;
