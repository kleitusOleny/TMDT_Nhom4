import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

// 1. GET: Lấy danh sách voucher khuyến mãi khả dụng
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const orderTotalParam = searchParams.get("orderTotal");
    const orderTotal = orderTotalParam ? parseFloat(orderTotalParam) : 0;

    const now = new Date();

    const where: Record<string, unknown> = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (shopId) {
      where.OR = [
        { scope: "GLOBAL" },
        { shopId: parseInt(shopId, 10) },
      ];
    } else {
      where.scope = "GLOBAL";
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formatted = promotions.map((p) => {
      const minOrder = Number(p.minOrderValue);
      const isEligible = orderTotal <= 0 || orderTotal >= minOrder;

      return {
        id: p.id,
        code: p.code,
        title: p.title,
        description: p.description,
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        minOrderValue: minOrder,
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
        endDate: p.endDate.toISOString(),
        isEligible,
        scope: p.scope,
      };
    });

    return NextResponse.json({
      success: true,
      promotions: formatted,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi lấy danh sách khuyến mãi:", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// 2. POST: Áp dụng và kiểm tra tính hợp lệ của mã giảm giá (voucher code)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, orderTotal, shopId } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã giảm giá" },
        { status: 400 }
      );
    }

    const rawCode = code.trim().toUpperCase();
    const total = parseFloat(orderTotal) || 0;

    const promo = await prisma.promotion.findUnique({
      where: { code: rawCode },
      include: { shop: { select: { id: true, name: true } } },
    });

    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá không tồn tại hoặc đã hết hạn" },
        { status: 404 }
      );
    }

    if (!promo.isActive) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá này hiện đang tạm dừng áp dụng" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (promo.startDate > now) {
      return NextResponse.json(
        { success: false, message: "Chương trình khuyến mãi này chưa bắt đầu" },
        { status: 400 }
      );
    }

    if (promo.endDate < now) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá đã hết hạn sử dụng" },
        { status: 400 }
      );
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá đã hết lượt sử dụng" },
        { status: 400 }
      );
    }

    // Kiểm tra phạm vi áp dụng (gian hàng)
    if (promo.scope === "SHOP" && promo.shopId) {
      if (!shopId || parseInt(shopId, 10) !== promo.shopId) {
        return NextResponse.json(
          {
            success: false,
            message: `Mã này chỉ áp dụng riêng cho gian hàng [${promo.shop?.name || "được chỉ định"}]`,
          },
          { status: 400 }
        );
      }
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    const minOrder = Number(promo.minOrderValue);
    if (total < minOrder) {
      return NextResponse.json(
        {
          success: false,
          message: `Đơn hàng tối thiểu ${minOrder.toLocaleString("vi-VN")}đ mới có thể dùng mã này. (Hiện tại: ${total.toLocaleString("vi-VN")}đ)`,
        },
        { status: 400 }
      );
    }

    // Tính toán số tiền được giảm
    let discountAmount = 0;
    const discountVal = Number(promo.discountValue);

    if (promo.discountType === "PERCENT") {
      discountAmount = (total * discountVal) / 100;
      if (promo.maxDiscount) {
        const maxDisc = Number(promo.maxDiscount);
        if (discountAmount > maxDisc) {
          discountAmount = maxDisc;
        }
      }
    } else {
      // Giảm tiền mặt cố định (FIXED)
      discountAmount = discountVal;
    }

    // Số tiền giảm không được vượt quá tổng tiền đơn
    if (discountAmount > total) {
      discountAmount = total;
    }

    const finalTotal = Math.max(0, total - discountAmount);

    return NextResponse.json({
      success: true,
      message: `Áp dụng mã giảm giá [${promo.code}] thành công!`,
      voucher: {
        id: promo.id,
        code: promo.code,
        title: promo.title,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: discountVal,
        discountAmount,
        originalTotal: total,
        finalTotal,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    console.error("Lỗi áp dụng voucher:", error);
    return NextResponse.json(
      { success: false, message: "Không thể áp dụng mã giảm giá", error: msg },
      { status: 500 }
    );
  }
}
