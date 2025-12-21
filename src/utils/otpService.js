import bcrypt from "bcrypt";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOtp = async (otp) => {
  const saltRounds = 10;
  return bcrypt.hash(otp, saltRounds);
};

const verifyOtp = async (plainOtp, hashedOtp) => {
  return bcrypt.compare(plainOtp, hashedOtp);
};

const storeOtp = async (user) => {
  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  user.otp = hashedOtp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  return otp;
};

const cleanupExpiredOTPs = async () => {
  try {
    // left intentionally blank (same as TS version)
  } catch (err) {
    console.error("Error cleaning up expired OTPs:", err);
  }
};

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
