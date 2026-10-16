import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, password, fullName, dateOfBirth, otp } = body;

    // Số điện thoại, mật khẩu và email là bắt buộc
    if (!phone || !password || !email) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ Số điện thoại, Email và Mật khẩu" },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { message: "Vui lòng nhập mã OTP 6 chữ số được gửi tới email của bạn" },
        { status: 400 }
      );
    }

    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Kiểm tra xác thực mã OTP
    const identifier = `REGISTER:${trimmedEmail}`;
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: cleanOtp,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "Mã xác thực OTP không chính xác." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(tokenRecord.expires)) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json(
        { message: "Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng gửi lại mã mới." },
        { status: 400 }
      );
    }

    // 2. Kiểm tra số điện thoại đã tồn tại chưa
    const existingPhone = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: "Số điện thoại này đã được sử dụng" },
        { status: 409 }
      );
    }

    // 3. Kiểm tra email đã tồn tại chưa
    const existingEmail = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: "Email này đã được sử dụng" },
        { status: 409 }
      );
    }

    // Xử lý ngày tháng năm sinh
    let parsedDob: Date | null = null;
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        phone: trimmedPhone,
        email: trimmedEmail,
        emailVerified: new Date(),
        password: hashedPassword,
        fullName: fullName?.trim() || `User_${trimmedPhone.slice(-4)}`,
        dateOfBirth: parsedDob,
      },
    });

    // Xóa mã OTP sau khi đăng ký thành công
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    const { password: _password, ...userData } = newUser;
    void _password;

    return NextResponse.json(
      {
        success: true,
        message: "Xác thực email và tạo tài khoản thành công!",
        user: userData,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Register API Error:", error);
    return NextResponse.json(
      { message: "Không thể tạo tài khoản", error: errMessage },
      { status: 500 }
    );
  }
}
