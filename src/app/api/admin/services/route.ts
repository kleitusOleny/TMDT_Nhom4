import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { ServiceRecord } from "@/src/lib/admin-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.toLowerCase();

    const where: Record<string, unknown> = {};

    if (statusParam && statusParam !== "ALL") {
      if (statusParam === "APPROVED") where.isActive = true;
      if (statusParam === "INACTIVE" || statusParam === "REJECTED") where.isActive = false;
    }

    if (sellerId && sellerId !== "ALL") {
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

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { shop: { name: { contains: query } } },
      ];
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
          select: { bookings: true, reviews: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    const formattedList: ServiceRecord[] = dbServices.map((s) => {
      const cat = s.categories[0];
      const categoryKey = (cat?.slug || "home") as ServiceRecord["category"];

      const reviewList = s.reviews || [];
      const reviewCount = reviewList.length;
      let averageRating = s.rating;
      if (reviewCount > 0) {
        const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
        averageRating = Number((sum / reviewCount).toFixed(1));
      }

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
        rating: averageRating,
        completedBookings: s._count.bookings || reviewCount || 0,
        description: s.description || "",
        images: Array.isArray(s.images)
          ? (s.images as string[])
          : typeof s.images === "string"
          ? [s.images]
          : [],
        pricingTable: Array.isArray(s.pricingTable)
          ? (s.pricingTable as { id: string; title: string; sub: string; price: number; unit: string }[])
          : [],
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
    const { serviceId, status, price, name, unit, category, sellerId, description, images, pricingTable } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      data.isActive = status === "APPROVED";
    }
    if (price !== undefined && !isNaN(Number(price))) {
      data.priceStart = Number(price);
    }
    if (name) data.title = name;
    if (unit) data.duration = unit;
    if (sellerId) data.shopId = Number(sellerId);
    if (description !== undefined) data.description = description;
    if (images !== undefined) data.images = images;
    if (pricingTable !== undefined) data.pricingTable = pricingTable;

    if (category && category !== "all") {
      data.categories = {
        set: [],
        connect: [{ slug: category }],
      };
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
      description: updated.description || "",
      images: Array.isArray(updated.images)
        ? (updated.images as string[])
        : typeof updated.images === "string"
        ? [updated.images]
        : [],
      pricingTable: Array.isArray(updated.pricingTable)
        ? (updated.pricingTable as { id: string; title: string; sub: string; price: number; unit: string }[])
        : [],
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
    const { name, category, sellerId, price, unit, description, images, pricingTable } = body;

    if (!name || !price || !unit) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    let targetShopId = Number(sellerId);
    if (isNaN(targetShopId) || targetShopId <= 0) {
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
        images: Array.isArray(images) && images.length > 0
          ? images
          : [
              "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
            ],
        pricingTable: Array.isArray(pricingTable) && pricingTable.length > 0 ? pricingTable : undefined,
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
      description: newService.description || "",
      images: Array.isArray(newService.images)
        ? (newService.images as string[])
        : typeof newService.images === "string"
        ? [newService.images]
        : [],
      pricingTable: Array.isArray(newService.pricingTable)
        ? (newService.pricingTable as { id: string; title: string; sub: string; price: number; unit: string }[])
        : [],
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = Number(searchParams.get("id"));

    if (!serviceId) {
      return NextResponse.json({ success: false, message: "Thiếu ID dịch vụ cần xóa" }, { status: 400 });
    }

    try {
      await prisma.dichVu.delete({ where: { id: serviceId } });
    } catch {
      await prisma.dichVu.update({
        where: { id: serviceId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa/ngừng cung cấp dịch vụ thành công khỏi cơ sở dữ liệu!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
