export const welcomeEmailTemplate = (username) => {
  return `
<!DOCTYPE html>
<html lang="en">  
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Revoltron_X</title>
</head>
<body style="font-family: Arial, sans-serif; background: #edf7ed; padding: 20px;">

    <div style="background: #edf7ed; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; 
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); border: 1px solid #c5e1a5;">
        
        <div style="text-align: center;">
            <img src="https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/yoga_poses_images/0b677869-0ea0-4f01-80f9-745a27de9cb5.png" 
                 alt="Leaf Icon" 
                 style="width: 80px; height: 80px; margin-bottom: 10px; border-radius: 50%; object-fit: cover; border: 3px solid #2e7d32;">
        </div>

        <h2 style="color: #2e7d32; text-align: center; font-size: 24px;">Welcome to Revoltron_X 🌿</h2>

        <div style="background: #ffffff; border-radius: 10px; padding: 20px; text-align: center; 
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
            
            <p style="font-size: 18px; color: #333;">Hello <strong>${username}</strong>,</p>

            <p style="font-size: 16px; color: #388e3c;">
                Thank you for joining <strong>Revoltron_X</strong>. We are excited to have you onboard with our innovative smart yoga mat, <strong>ARVYA_X</strong>. 🌱🌿
            </p>

            <img src="https://cdn-icons-png.flaticon.com/128/3163/3163499.png" 
                 alt="Nature Yoga Icon" 
                 style="width: 60px; margin: 10px 0;">

            <p style="font-size: 16px; color: #555;">
                <strong>ARVYA_X</strong> blends <strong>technology with nature</strong>, offering a holistic approach to well-being and mindfulness.
            </p>

            <p style="font-size: 16px; color: #555;">Stay connected for exclusive content, updates, and a smarter wellness experience! 🌍✨</p>

            <p style="font-size: 16px; color: #555;">Need assistance? We’re here to support your journey. 🌿</p>

            <br>
            <p style="color: #2e7d32; font-size: 14px;">Best Regards,<br><strong>Revoltron_X Team</strong></p>

        </div>
    </div>

</body>
</html>
`;
};

export const otpEmailTemplate = (otp) => {
  return `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; background: #f4f4f4; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #4CAF50; text-align: center; font-size: 28px; margin-bottom: 20px;">Login OTP</h2>
    <div style="background: #ffffff; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
      <p style="font-size: 18px; color: #333;">Your OTP for login is:</p>
      <h3 style="color: #4CAF50; font-size: 36px; font-weight: bold; margin: 10px 0;">${otp}</h3>
      <p style="font-size: 16px; color: #555;">Valid for <strong style="color: #e74c3c;">10 minutes</strong>.</p>
    </div>
</div>
`;
};

export default {
  welcomeEmailTemplate,
  otpEmailTemplate,
};
