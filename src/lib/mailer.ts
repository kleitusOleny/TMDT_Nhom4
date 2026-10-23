import nodemailer from "nodemailer";

// Cấu hình transporter với Gmail hoặc SMTP tùy chọn
// Nếu người dùng cung cấp GMAIL_USER và GMAIL_APP_PASSWORD trong .env thì sẽ gửi email thật qua Gmail
// Nếu chưa có, hệ thống vẫn log ra console để dev/test tức thì
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER || "",
    pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || "",
  },
});

interface SendOtpOptions {
  toEmail: string;
  otp: string;
  type: "REGISTER" | "FORGOT_PASSWORD";
  fullName?: string;
}

export async function sendOtpEmail({ toEmail, otp, type, fullName }: SendOtpOptions): Promise<boolean> {
  const isRegister = type === "REGISTER";
  const subject = isRegister
    ? `[CleanMate] Mã xác nhận đăng ký tài khoản: ${otp}`
    : `[CleanMate] Mã xác nhận đặt lại mật khẩu: ${otp}`;

  const greeting = fullName ? `Xin chào <strong>${fullName}</strong>,` : "Xin chào Quý khách,";
  const actionDescription = isRegister
    ? "Bạn đang tạo tài khoản mới tại nền tảng dịch vụ vệ sinh <strong>CleanMate</strong>."
    : "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>CleanMate</strong> liên kết với email này.";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 16px; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 12px; text-transform: uppercase; font-weight: 700; color: #2563eb; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
        .warning { font-size: 13px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-text">✨ CleanMate</div>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Dịch vụ vệ sinh & Giúp việc chuyên nghiệp</p>
        </div>
        <div class="content">
          <div class="greeting">${greeting}</div>
          <div class="desc">${actionDescription}</div>
          <div class="otp-box">
            <div class="otp-label">MÃ XÁC THỰC OTP (HẾT HẠN TRONG 5 PHÚT)</div>
            <div class="otp-code">${otp}</div>
          </div>
          <p class="warning">
            ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ của CleanMate. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
          </p>
        </div>
        <div class="footer">
          © 2026 CleanMate Corporation • Hỗ trợ 24/7: 1900 6868 • cleanmate.vn
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n======================================================`);
  console.log(`[CleanMate EMAIL OTP] To: ${toEmail} | OTP: ${otp} | Type: ${type}`);
  console.log(`======================================================\n`);

  const senderEmail = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const senderPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!senderEmail || !senderPass) {
    console.error("[CleanMate Mailer] GMAIL_USER / EMAIL_USER hoặc Mật khẩu ứng dụng chưa được cấu hình trong .env.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"CleanMate Support" <${senderEmail}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (err) {
    console.error("[CleanMate Mailer] Lỗi gửi email qua SMTP:", err);
    return false;
  }
}
