import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { sendOtpEmail } from "@/src/lib/mailer";

// Tạo mã OTP ngẫu nhiên 6 chữ số
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type = "REGISTER", fullName } = body;

    const trimmedEmail = String(email || "").trim().toLowerCase();

    if (!trimmedEmail) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp địa chỉ email." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { message: "Email không đúng định dạng." },
        { status: 400 }
      );
    }

    // 1. Nếu là ĐĂNG KÝ: kiểm tra xem email đã tồn tại trong DB chưa
    if (type === "REGISTER") {
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email này đã được sử dụng bởi một tài khoản khác." },
          { status: 409 }
        );
      }
    }

    // 2. Nếu là QUÊN MẬT KHẨU: kiểm tra xem tài khoản có tồn tại không
    if (type === "FORGOT_PASSWORD") {
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (!existingUser) {
        return NextResponse.json(
          { message: "Không tìm thấy tài khoản nào liên kết với email này." },
          { status: 404 }
        );
      }
    }

    // Xóa các mã OTP cũ đã hết hạn hoặc của identifier này
    const identifier = `${type}:${trimmedEmail}`;
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // Tạo mã OTP 6 số mới có hiệu lực 5 phút
    const otp = generateOtp();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: otp,
        expires,
      },
    });

    // Gửi email
    const sent = await sendOtpEmail({
      toEmail: trimmedEmail,
      otp,
      type: type === "FORGOT_PASSWORD" ? "FORGOT_PASSWORD" : "REGISTER",
      fullName,
    });

    return NextResponse.json({
      success: true,
      message: sent
        ? `Mã xác nhận 6 số đã được gửi đến email ${trimmedEmail}. Vui lòng kiểm tra hộp thư!`
        : `Mã OTP đã được tạo cho email ${trimmedEmail}. Vui lòng kiểm tra console hoặc hộp thư.`,
      expiresInMinutes: 5,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi hệ thống khi gửi mã xác nhận";
    console.error("send-otp error:", error);
    return NextResponse.json(
      { message: "Không thể gửi mã xác thực", error: msg },
      { status: 500 }
    );
  }
}
