import axios from "axios";

export const sendSMS = async (phone, message) => {
  await axios.post("https://www.fast2sms.com/dev/bulkV2", {
    message,
    language: "english",
    route: "q",
    numbers: phone,
  }, { headers: { authorization: process.env.FAST2SMS_API_KEY } });
};
