import bcrypt from "bcrypt";
// const Registeruser = require("../models/User");

// Generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP before storing
const hashOtp = async (otp: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(otp, saltRounds);
};

// Verify OTP against stored hash
const verifyOtp = async (
  plainOtp: string,
  hashedOtp: string
): Promise<boolean> => {
  return await bcrypt.compare(plainOtp, hashedOtp);
};

// Save hashed OTP to user record
const storeOtp = async (user: any): Promise<string> => {
  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  user.otp = hashedOtp; // Store hashed OTP instead of plain text
  user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
  await user.save();

  return otp; // Return plain OTP to send via email/SMS
};

// Clean up expired OTPs
const cleanupExpiredOTPs = async () => {
  try {
    // const result = await Registeruser.updateMany(
    //   { otpExpires: { $lt: Date.now() }, otp: { $exists: true } },
    //   { $unset: { otp: "", otpExpires: "" } }
    // );
    // console.log(`Cleaned up expired OTPs for ${result.modifiedCount} users`);
  } catch (err) {
    console.error("Error cleaning up expired OTPs:", err);
  }
};

// Schedule cleanup to run every 10 minutes
const scheduleCleanup = () => {
  setInterval(cleanupExpiredOTPs, 10 * 60 * 1000);
};

export {
  generateOtp,
  hashOtp,
  verifyOtp,
  storeOtp,
  cleanupExpiredOTPs,
  scheduleCleanup,
};

// const cleanupExpiredOTPs = async () => {
//   try {
//     // Find all users with expired OTPs
//     const users = await Registeruser.find({
//       otpExpires: { $lt: Date.now() },
//       otp: { $exists: true }
//     });

//     // Clear expired OTPs but keep user data
//     for (const user of users) {
//       user.otp = undefined;
//       user.otpExpires = undefined;
//       await user.save();
//     }

//     console.log(`Cleaned up expired OTPs for ${users.length} users`);
//   } catch (err) {
//     console.error('Error cleaning up expired OTPs:', err);
//   }
// };
