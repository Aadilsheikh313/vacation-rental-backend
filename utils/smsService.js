const sendSMS = ({ to, message }) => {
  console.log(`📱 Mock SMS sent to ${to}`);
  console.log(`Message: ${message}`);
};

export default sendSMS;
