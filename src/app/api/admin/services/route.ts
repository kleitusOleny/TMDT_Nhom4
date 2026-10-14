import { NextRequest, NextResponse } from "next/server";
import { initialServices, ServiceRecord } from "@/src/lib/admin-data";

const servicesStore: ServiceRecord[] = [...initialServices];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sellerId = searchParams.get("sellerId");
  const category = searchParams.get("category");

  let list = servicesStore;
  if (status && status !== "ALL") {
    list = list.filter((s) => s.status === status);
  }
  if (sellerId) {
    list = list.filter((s) => s.sellerId === parseInt(sellerId, 10));
  }
  if (category && category !== "ALL") {
    list = list.filter((s) => s.category === category);
  }

  return NextResponse.json({ success: true, services: list });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, status, price } = body;

    const idx = servicesStore.findIndex((s) => s.id === serviceId);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dịch vụ" },
        { status: 404 }
      );
    }

    if (status) servicesStore[idx].status = status;
    if (price) servicesStore[idx].price = price;

    return NextResponse.json({
      success: true,
      message: "Cập nhật dịch vụ thành công!",
      service: servicesStore[idx],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, categoryName, sellerId, sellerName, price, unit } = body;

    if (!name || !price || !unit) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const newService: ServiceRecord = {
      id: Date.now(),
      name,
      category: category || "home",
      categoryName: categoryName || "Vệ sinh nhà ở",
      sellerId: sellerId || 2,
      sellerName: sellerName || "Công ty TNHH CleanPro",
      price: Number(price),
      unit,
      status: "PENDING",
      rating: 5.0,
      completedBookings: 0,
    };

    servicesStore.unshift(newService);

    return NextResponse.json({
      success: true,
      message: "Tạo dịch vụ mới thành công! Đang chờ Admin duyệt.",
      service: newService,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
