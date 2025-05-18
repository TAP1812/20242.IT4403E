import nodemailer from "nodemailer";

export const sendUserCreatedMail = async ({ to, name, title, role, password }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
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

export const sendTaskAssignedMail = async ({ to, name, title, date, stage, priority }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Task Manager <${process.env.MAIL_USER}>`,
    to,
    subject: `New Task Assigned: ${title}`,
    html: `
      <h3>New Task Assigned</h3>
      <p>Hi <b>${name}</b>,</p>
      <p>You have been assigned a new task with the following details:</p>
      <ul>
        <li><b>Title:</b> ${title}</li>
        <li><b>Date:</b> ${date ? new Date(date).toLocaleDateString() : "N/A"}</li>
        <li><b>Stage:</b> ${stage}</li>
        <li><b>Priority:</b> ${priority}</li>
      </ul>
      <p>Please check your Task Manager dashboard for more details.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendResetPasswordMail = async ({ to, name, resetLink }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Task Manager <${process.env.MAIL_USER}>`,
    to,
    subject: "Reset your Task Manager password",
    html: `
      <h3>Password Reset Request</h3>
      <p>Hi <b>${name}</b>,</p>
      <p>We received a request to reset your password. Click the link below to set a new password. This link will expire in 30 minutes.</p>
      <p><a href="${resetLink}" style="color:blue;">Reset your password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
