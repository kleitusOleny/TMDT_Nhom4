import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dichVuId = parseInt(id, 10);

    if (isNaN(dichVuId)) {
      return NextResponse.json(
        { success: false, message: "ID dịch vụ không hợp lệ" },
        { status: 400 }
      );
    }

    const dichVu = await prisma.dichVu.findUnique({
      where: { id: dichVuId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            approvalStatus: true,
            rating: true,
            totalReviews: true,
            area: true,
          },
        },
      },
    });

    if (!dichVu) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dịch vụ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dichVu,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json(
      { success: false, message: "Không thể lấy thông tin dịch vụ", error: errMessage },
      { status: 500 }
    );
  }
}
