import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, password, fullName, dateOfBirth } = body;

    // Số điện thoại và mật khẩu là bắt buộc
    if (!phone || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập Số điện thoại và Mật khẩu" },
        { status: 400 }
      );
    }

    const trimmedPhone = String(phone).trim();
    const trimmedEmail = email && typeof email === "string" && email.trim().length > 0 ? email.trim() : null;

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingPhone = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: "Số điện thoại này đã được sử dụng" },
        { status: 409 }
      );
    }

    // Nếu có email thì kiểm tra email đã tồn tại chưa
    if (trimmedEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (existingEmail) {
        return NextResponse.json(
          { message: "Email này đã được sử dụng" },
          { status: 409 }
        );
      }
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
        password: hashedPassword,
        fullName: fullName?.trim() || `User_${trimmedPhone.slice(-4)}`,
        dateOfBirth: parsedDob,
      },
    });

    const { password: _, ...userData } = newUser;

    return NextResponse.json(
      {
        success: true,
        message: "Tạo tài khoản thành công!",
        user: userData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { message: "Không thể tạo tài khoản", error: error?.message },
      { status: 500 }
    );
  }
}
