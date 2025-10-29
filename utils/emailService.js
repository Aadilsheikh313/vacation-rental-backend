
const sendEmail = ({ to, subject, text }) => {
  console.log(`📧 Mock email sent to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
};

export default sendEmail;

