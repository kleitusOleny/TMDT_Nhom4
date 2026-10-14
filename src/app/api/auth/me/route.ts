import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    let userId: number | null = null;

    // 1. Kiểm tra session cookie nội bộ cleanmate_session (từ đăng nhập thường)
    const sessionCookie = req.cookies.get("cleanmate_session")?.value;
    if (sessionCookie) {
      const parsedId = parseInt(sessionCookie, 10);
      if (!isNaN(parsedId)) {
        userId = parsedId;
      }
    }

    // 2. Nếu chưa có, kiểm tra NextAuth session (từ đăng nhập Google OAuth)
    if (!userId) {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user?.id) {
        const parsedId = parseInt(nextAuthSession.user.id, 10);
        if (!isNaN(parsedId)) {
          userId = parsedId;
        }
      } else if (nextAuthSession?.user?.email) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: nextAuthSession.user.email },
          select: { id: true },
        });
        if (userByEmail) {
          userId = userByEmail.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
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
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
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
