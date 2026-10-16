import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    const trimmedEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!trimmedEmail || !cleanOtp || !newPassword) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp đầy đủ Email, mã OTP và Mật khẩu mới." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Mật khẩu mới phải có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }

    // Kiểm tra tài khoản tồn tại
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng có email này." },
        { status: 404 }
      );
    }

    // Kiểm tra mã OTP trong VerificationToken
    const identifier = `FORGOT_PASSWORD:${trimmedEmail}`;
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: cleanOtp,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "Mã OTP không chính xác hoặc không tồn tại." },
        { status: 400 }
      );
    }

    // Kiểm tra hạn sử dụng
    if (new Date() > new Date(tokenRecord.expires)) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json(
        { message: "Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng yêu cầu mã mới." },
        { status: 400 }
      );
    }

    // Cập nhật mật khẩu mới và xóa mã OTP đã dùng
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi hệ thống khi đặt lại mật khẩu";
    console.error("reset-password error:", error);
    return NextResponse.json(
      { message: "Không thể đặt lại mật khẩu", error: msg },
      { status: 500 }
    );
  }
}
