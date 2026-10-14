import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("cleanmate_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const userId = parseInt(sessionCookie, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Trường hợp Admin hệ thống mặc định (id = 1 hoặc cấu hình mặc định)
    if (userId === 1) {
      // Thử tìm trong DB trước, nếu không có thì trả về thông tin Admin hệ thống mặc định
      const dbUser = await prisma.user.findUnique({
        where: { id: 1 },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          image: true,
        },
      });

      if (dbUser) {
        return NextResponse.json({
          authenticated: true,
          user: dbUser,
        });
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: 1,
          fullName: "Quản Trị Viên CleanMate",
          phone: "0901234567",
          email: "admin@cleanmate.vn",
          role: "ADMIN",
          image: null,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json(
      { authenticated: false, error: errMessage },
      { status: 500 }
    );
  }
}
