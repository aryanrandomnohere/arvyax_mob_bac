import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import RegisterUser from "../models/UserModel.js";
import { JWT_SECRET } from "../config/constants.js";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otpService.js";
import { sendOtpEmail, sendWelcomeEmail } from "../utils/emailService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Temporary storage for signup OTP (not stored in DB yet)
const pendingRegistrations = new Map<
  string,
  {
    username: string;
    email: string;
    otp: string;
    otpExpires: number;
  }
>();

// -------------------------------------
//           SIGNUP (OTP SEND)
// -------------------------------------
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    if (!email || !username) {
      return res
        .status(400)
        .json({ error: "Name and Email are required fields" });
    }

    // Check if user already exists in DB
    const exists = await RegisterUser.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    // Save pending registration
    pendingRegistrations.set(email, {
      username,
      email,
      otp: hashedOtp,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP to email
    await sendOtpEmail(email, otp);

    return res.json({
      message: "OTP sent. Please verify to complete registration.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------
//           VERIFY OTP (SIGNUP)
// -------------------------------------
router.post("/verify-otp", async (req: Request, res: Response) => {
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

    // Create new user (NOT onboarding yet)
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

    // Send welcome email
    await sendWelcomeEmail(newUser.email, newUser.username);

    // Sign JWT
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
});

// -------------------------------------
//           LOGIN (SEND OTP)
// -------------------------------------
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await RegisterUser.findOne({ email });

    if (!user)
      return res.status(404).json({ error: "User not found. Please sign up." });

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    user.otp = hashedOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    return res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("LOGIN OTP ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------
//         LOGIN OTP VERIFY
// -------------------------------------
router.post("/login/verify-otp", async (req: Request, res: Response) => {
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

    // Clear OTP
    delete user.otp;
    delete user.otpExpires;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, {
      expiresIn: "10h",
    });

    return res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("LOGIN VERIFY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------
//       ONBOARDING ROUTE
// -------------------------------------
router.post(
  "/onboarding",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { gender, dob } = req.body;

      if (!gender || !dob)
        return res.status(400).json({ error: "Gender and DOB required" });

      const userId = req.user.id;
      const user = await RegisterUser.findById(userId);

      if (!user) return res.status(404).json({ error: "User not found" });

      user.preferences.gender = gender;
      user.preferences.dob = dob;
      user.onboardingCompleted = true;

      await user.save();

      return res.json({ message: "Onboarding completed", user });
    } catch (err) {
      console.error("ONBOARDING ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
