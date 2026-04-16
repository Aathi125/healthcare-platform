const nodemailer = require("nodemailer");

const normalizeEnvValue = (value = "") => value.toString().trim();
const normalizeSmtpPassword = (value = "") => {
  const raw = value.toString();

  // Google app passwords are often pasted with spaces for readability.
  if ((process.env.SMTP_HOST || "").toLowerCase().includes("gmail")) {
    return raw.replace(/\s+/g, "");
  }

  return raw.trim();
};

const createTransporter = () => {
  const host = normalizeEnvValue(process.env.SMTP_HOST);
  const user = normalizeEnvValue(process.env.SMTP_USER);
  const pass = normalizeSmtpPassword(process.env.SMTP_PASS);

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user,
        pass
      }
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
};

const sendEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "to, subject and message are required" });
    }

    const transporter = createTransporter();
    const result = await transporter.sendMail({
      from:
        normalizeEnvValue(process.env.EMAIL_FROM) ||
        normalizeEnvValue(process.env.SMTP_FROM) ||
        normalizeEnvValue(process.env.SMTP_USER) ||
        "smart-healthcare@example.com",
      to,
      subject,
      text: message
    });

    return res.status(200).json({
      message: "Notification sent",
      resultId: result.messageId || "mock-message"
    });
  } catch (error) {
    console.error("Notification send failed:", {
      message: error.message,
      code: error.code,
      response: error.response
    });
    return res.status(500).json({ message: "Server error while sending notification" });
  }
};

module.exports = {
  sendEmail
};
