import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { ServiceRecord } from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (statusParam && statusParam !== "ALL") {
      if (statusParam === "APPROVED") where.isActive = true;
      if (statusParam === "INACTIVE" || statusParam === "REJECTED") where.isActive = false;
    }

    if (sellerId) {
      const parsedSellerId = parseInt(sellerId, 10);
      if (!isNaN(parsedSellerId)) {
        where.shopId = parsedSellerId;
      }
    }

    if (category && category !== "ALL") {
      where.categories = {
        some: {
          slug: category,
        },
      };
    }

    const dbServices = await prisma.dichVu.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    const formattedList: ServiceRecord[] = dbServices.map((s) => {
      const cat = s.categories[0];
      const categoryKey = (cat?.slug || "home") as ServiceRecord["category"];

      return {
        id: s.id,
        name: s.title,
        category: categoryKey,
        categoryName: cat?.name || "Vệ sinh nhà ở",
        sellerId: s.shop.id,
        sellerName: s.shop.name,
        price: Number(s.priceStart),
        unit: s.duration || "gói",
        status: s.isActive ? "APPROVED" : "INACTIVE",
        rating: s.rating,
        completedBookings: s._count.bookings || s.totalReviews || 0,
      };
    });

    return NextResponse.json({ success: true, services: formattedList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, status, price } = body;

    const data: Record<string, unknown> = {};
    if (status) {
      data.isActive = status === "APPROVED";
    }
    if (price !== undefined && !isNaN(Number(price))) {
      data.priceStart = Number(price);
    }

    const updated = await prisma.dichVu.update({
      where: { id: Number(serviceId) },
      data,
      include: {
        shop: { select: { id: true, name: true } },
        categories: { select: { name: true, slug: true } },
        _count: { select: { bookings: true } },
      },
    });

    const cat = updated.categories[0];

    const formattedService: ServiceRecord = {
      id: updated.id,
      name: updated.title,
      category: (cat?.slug || "home") as ServiceRecord["category"],
      categoryName: cat?.name || "Vệ sinh",
      sellerId: updated.shop.id,
      sellerName: updated.shop.name,
      price: Number(updated.priceStart),
      unit: updated.duration || "gói",
      status: updated.isActive ? "APPROVED" : "INACTIVE",
      rating: updated.rating,
      completedBookings: updated._count.bookings,
    };

    return NextResponse.json({
      success: true,
      message: "Cập nhật dịch vụ trong database thành công!",
      service: formattedService,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, sellerId, price, unit, description } = body;

    if (!name || !price || !unit) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    // Lấy shopId hợp lệ hoặc shop đầu tiên
    let targetShopId = Number(sellerId);
    if (isNaN(targetShopId)) {
      const firstShop = await prisma.shop.findFirst();
      targetShopId = firstShop?.id || 1;
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const newService = await prisma.dichVu.create({
      data: {
        title: name,
        slug,
        description: description || `Dịch vụ ${name} chất lượng cao do CleanMate cung cấp.`,
        priceStart: Number(price),
        duration: unit,
        images: [
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        ],
        isActive: true,
        shopId: targetShopId,
        categories: category && category !== "all"
          ? {
              connect: { slug: category },
            }
          : undefined,
      },
      include: {
        shop: { select: { id: true, name: true } },
        categories: { select: { name: true, slug: true } },
      },
    });

    const cat = newService.categories[0];

    const formattedService: ServiceRecord = {
      id: newService.id,
      name: newService.title,
      category: (cat?.slug || "home") as ServiceRecord["category"],
      categoryName: cat?.name || "Vệ sinh",
      sellerId: newService.shop.id,
      sellerName: newService.shop.name,
      price: Number(newService.priceStart),
      unit: newService.duration || "gói",
      status: newService.isActive ? "APPROVED" : "INACTIVE",
      rating: 5.0,
      completedBookings: 0,
    };

    return NextResponse.json({
      success: true,
      message: "Tạo dịch vụ mới thành công vào cơ sở dữ liệu!",
      service: formattedService,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
