import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, fullName } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập Email / Số điện thoại và Mật khẩu" },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes("@");

    const email = isEmail ? trimmedIdentifier : null;
    const phone = !isEmail ? trimmedIdentifier : null;

    // Kiểm tra tài khoản đã tồn tại chưa
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email hoặc Số điện thoại này đã được sử dụng" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        fullName: fullName || (isEmail ? email?.split("@")[0] : `User_${phone?.slice(-4)}`),
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
