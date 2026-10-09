import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập Email / Số điện thoại và Mật khẩu" },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    // Tìm kiếm người dùng theo Email HOẶC Số điện thoại
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedIdentifier },
          { phone: trimmedIdentifier },
        ],
      },
    });

    // Nếu không tìm thấy người dùng hoặc tài khoản này tạo bằng Google
    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Kiểm tra mật khẩu (hỗ trợ hash bcrypt và fallback plain text)
    let isPasswordValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Đăng nhập thành công, loại bỏ mật khẩu khi trả về
    const { password: _password, ...userData } = user;
    void _password;

    const response = NextResponse.json(
      {
        success: true,
        message: "Đăng nhập thành công! Đang chuyển hướng...",
        user: userData,
      },
      { status: 200 }
    );

    // Lưu cookie phiên đăng nhập
    response.cookies.set("cleanmate_session", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 ngày nếu tick ghi nhớ, mặc định 1 ngày
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("Login API Error:", error);
    return NextResponse.json(
      { 
        message: "Lỗi kết nối cơ sở dữ liệu. Vui lòng kiểm tra MySQL và chuỗi kết nối DATABASE_URL.",
        error: errMessage 
      },
      { status: 500 }
    );
  }
}