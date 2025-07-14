export const keys = {
  jwtSecret: process.env.JWT_SECRET_KEY,
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  mongoURI: process.env.MONGO_URL,
  
  cloudinary: {
    name: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_API_KEY,
    apiSecret: process.env.CLOUD_API_SECRET,
  },

  razorpay: {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  },
};
