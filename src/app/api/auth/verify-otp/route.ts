import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    const trimmedEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!trimmedEmail || !cleanOtp) {
      return NextResponse.json(
        { message: "Vui lòng nhập Email và mã OTP 6 số." },
        { status: 400 }
      );
    }

    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      return NextResponse.json(
        { message: "Mã xác thực OTP phải gồm 6 chữ số." },
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
        { message: "Mã OTP không chính xác. Vui lòng kiểm tra lại." },
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

    return NextResponse.json({
      success: true,
      message: "Xác thực mã OTP thành công! Vui lòng nhập mật khẩu mới.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi hệ thống khi xác thực mã OTP";
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { message: "Không thể xác thực mã OTP", error: msg },
      { status: 500 }
    );
  }
}
