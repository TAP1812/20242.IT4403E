import nodemailer from "nodemailer";

export const sendUserCreatedMail = async ({ to, name, title, role, password }) => {
  // Cấu hình transporter với Gmail hoặc SMTP provider khác
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Email gửi đi
      pass: process.env.MAIL_PASS, // App password hoặc mật khẩu email
    },
  });

  const mailOptions = {
    from: `Task Manager <${process.env.MAIL_USER}>`,
    to,
    subject: "Your Task Manager Account Information",
    html: `
      <h3>Welcome to Task Manager!</h3>
      <p><b>Full Name:</b> ${name}</p>
      <p><b>Title:</b> ${title}</p>
      <p><b>Role:</b> ${role}</p>
      <p><b>Login Email:</b> ${to}</p>
      <p><b>Initial Password:</b> <span style="font-family:monospace;">${password}</span></p>
      <p>Please change your password after first login for security.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
