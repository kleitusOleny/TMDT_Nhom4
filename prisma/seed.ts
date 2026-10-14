import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Bắt đầu đổ dữ liệu danh mục, đối tác và dịch vụ mẫu vào cơ sở dữ liệu...");

  // 1. Tạo Category mẫu
  const categories = [
    { name: "Vệ sinh nhà ở", slug: "ve-sinh-nha-o", description: "Dọn dẹp phòng khách, bếp, phòng ngủ, nhà vệ sinh toàn diện." },
    { name: "Vệ sinh văn phòng", slug: "ve-sinh-van-phong", description: "Dọn dẹp sàn, bàn ghế, thiết bị văn phòng chuyên nghiệp." },
    { name: "Vệ sinh công nghiệp", slug: "ve-sinh-cong-nghiep", description: "Vệ sinh sau xây dựng, nhà xưởng, mặt ngoài tòa nhà." },
    { name: "Giặt sofa & nệm", slug: "giat-sofa-nem", description: "Công nghệ phun hút diệt khuẩn 99.9%, khử mùi hôi nấm mốc." },
    { name: "Vệ sinh máy lạnh", slug: "ve-sinh-may-lanh", description: "Tháo rửa xịt dàn lạnh, dàn nóng, bảo dưỡng nạp gas." },
  ];

  const catMap: Record<string, number> = {};
  for (const cat of categories) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    catMap[cat.slug] = createdCat.id;
  }

  // 2. Tạo Tài khoản Quản Trị Viên (ADMIN)
  await prisma.user.upsert({
    where: { phone: "0901234567" },
    update: { role: "ADMIN" },
    create: {
      phone: "0901234567",
      email: "admin@cleanmate.vn",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK", // demo pass: 123456
      fullName: "Quản Trị Viên CleanMate",
      role: "ADMIN",
      dateOfBirth: new Date("1985-01-01"),
    },
  });

  // 3. Tạo User chủ cửa hàng (Shop owner)
  const owner1 = await prisma.user.upsert({
    where: { phone: "0909123456" },
    update: {},
    create: {
      phone: "0909123456",
      email: "contact@sachbong.vn",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
      fullName: "Nguyễn Văn Chủ Shop",
      dateOfBirth: new Date("1990-05-15"),
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { phone: "0908888999" },
    update: {},
    create: {
      phone: "0908888999",
      email: "cleanpro@cleanmate.vn",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
      fullName: "Trần CleanPro",
      dateOfBirth: new Date("1988-08-20"),
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { phone: "0907777888" },
    update: {},
    create: {
      phone: "0907777888",
      email: "saigonxanh@cleanmate.vn",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
      fullName: "Lê Sài Gòn Xanh",
      dateOfBirth: new Date("1992-12-10"),
    },
  });

  // 3. Tạo các Shop đối tác
  const shop1 = await prisma.shop.upsert({
    where: { slug: "cong-ty-tnhh-ve-sinh-sach-bong" },
    update: { approvalStatus: "APPROVED" },
    create: {
      name: "Công ty TNHH Vệ sinh Sạch Bóng",
      slug: "cong-ty-tnhh-ve-sinh-sach-bong",
      approvalStatus: "APPROVED",
      rating: 4.8,
      totalReviews: 256,
      area: "Quận 1, 2, 3, 7, Thủ Đức",
      ownerId: owner1.id,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { slug: "cong-ty-tnhh-cleanpro" },
    update: { approvalStatus: "APPROVED" },
    create: {
      name: "Công ty TNHH CleanPro",
      slug: "cong-ty-tnhh-cleanpro",
      approvalStatus: "APPROVED",
      rating: 4.9,
      totalReviews: 1250,
      area: "Quận 1, 3, Bình Thạnh (TP.HCM)",
      ownerId: owner2.id,
    },
  });

  const shop3 = await prisma.shop.upsert({
    where: { slug: "dich-vu-ve-sinh-sai-gon-xanh" },
    update: { approvalStatus: "APPROVED" },
    create: {
      name: "Dịch vụ Vệ sinh Sài Gòn Xanh",
      slug: "dich-vu-ve-sinh-sai-gon-xanh",
      approvalStatus: "APPROVED",
      rating: 4.8,
      totalReviews: 980,
      area: "Quận 7, Nhà Bè, Quận 4",
      ownerId: owner3.id,
    },
  });

  // 4. Danh sách các dịch vụ đa dạng liên kết với các Shop
  const sampleServices = [
    {
      title: "Dịch vụ vệ sinh nhà ở toàn diện",
      slug: "ve-sinh-nha-o-toan-dien",
      description: "Dịch vụ vệ sinh nhà ở toàn diện của Sạch Bóng cung cấp giải pháp làm sạch sâu mọi ngóc ngách căn nhà của bạn. Máy móc hiện đại và hóa chất thân thiện môi trường.",
      priceStart: 250000,
      rating: 4.8,
      totalReviews: 256,
      duration: "2-4 giờ",
      serviceArea: "Quận 1, 2, 3, 7, Thủ Đức",
      categorySlug: "ve-sinh-nha-o",
      shopId: shop1.id,
      images: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
      ],
      pricingTable: [
        { id: "fixed", title: "Giá cố định", sub: "Dưới 50m²", price: 250000, unit: "/lần" },
        { id: "sqm", title: "Giá theo m²", sub: "Từ 50m² trở lên", price: 15000, unit: "/m²" },
      ],
    },
    {
      title: "Vệ sinh văn phòng theo giờ & định kỳ",
      slug: "ve-sinh-van-phong-dinh-ky",
      description: "Duy trì môi trường làm việc sạch đẹp, thơm mát và ngăn nắp cho doanh nghiệp. Nhân viên tận tình, bảo mật tài liệu tốt.",
      priceStart: 120000,
      rating: 4.9,
      totalReviews: 184,
      duration: "Theo ca / giờ",
      serviceArea: "Toàn TP. Hồ Chí Minh",
      categorySlug: "ve-sinh-van-phong",
      shopId: shop2.id,
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      ],
      pricingTable: [
        { id: "hourly", title: "Theo giờ", sub: "Tối thiểu 2 giờ", price: 120000, unit: "/giờ" },
      ],
    },
    {
      title: "Tổng vệ sinh sau xây dựng chuyên sâu",
      slug: "tong-ve-sinh-sau-xay-dung",
      description: "Đánh bóng sàn, tẩy sạch vết xi măng, sơn dính và bụi bẩn thô tinh công trình mới hoàn thiện trước khi bàn giao nhà.",
      priceStart: 1500000,
      rating: 4.7,
      totalReviews: 92,
      duration: "1-2 ngày",
      serviceArea: "TP. Hồ Chí Minh & Bình Dương",
      categorySlug: "ve-sinh-cong-nghiep",
      shopId: shop3.id,
      images: [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
      ],
      pricingTable: [
        { id: "full", title: "Trọn gói căn hộ", sub: "Dưới 80m²", price: 1500000, unit: "/căn" },
      ],
    },
    {
      title: "Giặt sấy sofa da, vải nỉ và nệm cao su tại nhà",
      slug: "giat-sofa-nem-tai-nha",
      description: "Phun hút nước nóng kết hợp ion khử khuẩn giúp loại bỏ 99.9% mạt bụi, nấm mốc và mùi thú cưng trên sofa và đệm giường.",
      priceStart: 350000,
      rating: 4.9,
      totalReviews: 310,
      duration: "1.5 - 2 giờ",
      serviceArea: "Quận 1, 3, 5, 7, Bình Thạnh, Gò Vấp",
      categorySlug: "giat-sofa-nem",
      shopId: shop1.id,
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
      ],
      pricingTable: [
        { id: "sofa-v", title: "Sofa Vải / Nỉ góc L", sub: "Gồm hút bụi & sấy", price: 350000, unit: "/bộ" },
      ],
    },
    {
      title: "Bảo dưỡng & vệ sinh máy lạnh inverter",
      slug: "ve-sinh-may-lanh-inverter",
      description: "Vệ sinh xịt rửa lồng quạt, lưới lọc và dàn nóng lạnh, kiểm tra bổ sung gas giúp máy lạnh chạy êm ái và tiết kiệm điện năng.",
      priceStart: 180000,
      rating: 4.8,
      totalReviews: 420,
      duration: "45-60 phút",
      serviceArea: "Tất cả các quận nội thành",
      categorySlug: "ve-sinh-may-lanh",
      shopId: shop2.id,
      images: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
      ],
      pricingTable: [
        { id: "treotuong", title: "Máy treo tường 1 - 2.5 HP", sub: "Xịt rửa dàn nóng & lạnh", price: 180000, unit: "/máy" },
      ],
    },
    {
      title: "Lau kính mặt ngoài và ban công căn hộ cao tầng",
      slug: "lau-kinh-mat-ngoai-can-ho",
      description: "Đội ngũ thợ đu dây lành nghề, trang bị bảo hộ an toàn chuẩn quốc tế, làm sạch kính ố vàng và bụi bẩn ngoài trời bóng loáng.",
      priceStart: 600000,
      rating: 4.6,
      totalReviews: 67,
      duration: "3-5 giờ",
      serviceArea: "TP. Hồ Chí Minh",
      categorySlug: "ve-sinh-cong-nghiep",
      shopId: shop3.id,
      images: [
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
      ],
      pricingTable: [
        { id: "glass-pack", title: "Kính căn hộ trọn gói", sub: "Mặt trong & ngoài", price: 600000, unit: "/gói" },
      ],
    },
  ];

  for (const s of sampleServices) {
    const catId = catMap[s.categorySlug];
    await prisma.dichVu.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        description: s.description,
        priceStart: s.priceStart,
        rating: s.rating,
        totalReviews: s.totalReviews,
        duration: s.duration,
        serviceArea: s.serviceArea,
        images: s.images,
        pricingTable: s.pricingTable,
        shopId: s.shopId,
        categories: catId ? { set: [{ id: catId }] } : undefined,
      },
      create: {
        title: s.title,
        slug: s.slug,
        description: s.description,
        priceStart: s.priceStart,
        rating: s.rating,
        totalReviews: s.totalReviews,
        duration: s.duration,
        serviceArea: s.serviceArea,
        images: s.images,
        pricingTable: s.pricingTable,
        shopId: s.shopId,
        categories: catId ? { connect: [{ id: catId }] } : undefined,
      },
    });
  }

  // 5. Seed Reviews và Bookings mẫu cho các dịch vụ
  const customer1 = await prisma.user.upsert({
    where: { phone: "0911223344" },
    update: {},
    create: {
      phone: "0911223344",
      email: "hoangthuylinh@gmail.com",
      fullName: "Hoàng Thùy Linh",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { phone: "0922334455" },
    update: {},
    create: {
      phone: "0922334455",
      email: "vuminhduc@gmail.com",
      fullName: "Vũ Minh Đức",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
    },
  });

  const customer3 = await prisma.user.upsert({
    where: { phone: "0933445566" },
    update: {},
    create: {
      phone: "0933445566",
      email: "ngocmai@gmail.com",
      fullName: "Trần Ngọc Mai",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
    },
  });

  // Tìm lại dịch vụ 1 để tạo booking & review
  const dv1 = await prisma.dichVu.findFirst({ where: { slug: "ve-sinh-nha-o-toan-dien" } });
  if (dv1) {
    // Booking 1
    const b1 = await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-001" },
      update: {},
      create: {
        bookingCode: "CM-BK-001",
        scheduledDate: new Date("2026-10-01T08:00:00Z"),
        address: "Landmark 81, P.22, Q.Bình Thạnh, TP.HCM",
        totalPrice: 250000,
        status: "COMPLETED",
        isAcceptedByCustomer: true,
        customerId: customer1.id,
        serviceId: dv1.id,
      },
    });

    await prisma.review.upsert({
      where: { bookingId: b1.id },
      update: {
        rating: 5,
        comment: "Nhân viên làm việc rất tỉ mỉ, sàn nhà và bếp bóng loáng sạch sẽ. Nhân viên đeo khẩu trang, mang đầy đủ đồng phục rất lịch sự. Sẽ tiếp tục ủng hộ dịch vụ định kỳ!",
      },
      create: {
        bookingId: b1.id,
        customerId: customer1.id,
        serviceId: dv1.id,
        rating: 5,
        comment: "Nhân viên làm việc rất tỉ mỉ, sàn nhà và bếp bóng loáng sạch sẽ. Nhân viên đeo khẩu trang, mang đầy đủ đồng phục rất lịch sự. Sẽ tiếp tục ủng hộ dịch vụ định kỳ!",
        images: [
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
        ],
      },
    });

    // Booking 2
    const b2 = await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-002" },
      update: {},
      create: {
        bookingCode: "CM-BK-002",
        scheduledDate: new Date("2026-10-05T14:00:00Z"),
        address: "Chung cư Sunrise City, Q.7, TP.HCM",
        totalPrice: 250000,
        status: "COMPLETED",
        isAcceptedByCustomer: true,
        customerId: customer2.id,
        serviceId: dv1.id,
      },
    });

    await prisma.review.upsert({
      where: { bookingId: b2.id },
      update: {
        rating: 5,
        comment: "Đúng giờ hẹn, tác phong nhanh nhẹn. Sử dụng dung dịch tẩy rửa sinh học không hề có mùi hắc độc hại, rất an tâm vì nhà mình có con nhỏ.",
      },
      create: {
        bookingId: b2.id,
        customerId: customer2.id,
        serviceId: dv1.id,
        rating: 5,
        comment: "Đúng giờ hẹn, tác phong nhanh nhẹn. Sử dụng dung dịch tẩy rửa sinh học không hề có mùi hắc độc hại, rất an tâm vì nhà mình có con nhỏ.",
      },
    });

    // Booking 3
    const b3 = await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-003" },
      update: {},
      create: {
        bookingCode: "CM-BK-003",
        scheduledDate: new Date("2026-10-10T09:30:00Z"),
        address: "Masteri Thảo Điền, TP.Thủ Đức, TP.HCM",
        totalPrice: 250000,
        status: "COMPLETED",
        isAcceptedByCustomer: true,
        customerId: customer3.id,
        serviceId: dv1.id,
      },
    });

    await prisma.review.upsert({
      where: { bookingId: b3.id },
      update: {
        rating: 4,
        comment: "Dịch vụ ổn áp, các góc kẹt tủ lạnh và chân bàn được hút bụi cẩn thận. Giá cả phải chăng, lần sau sẽ book tiếp.",
      },
      create: {
        bookingId: b3.id,
        customerId: customer3.id,
        serviceId: dv1.id,
        rating: 4,
        comment: "Dịch vụ ổn áp, các góc kẹt tủ lạnh và chân bàn được hút bụi cẩn thận. Giá cả phải chăng, lần sau sẽ book tiếp.",
      },
    });
  }

  // Thêm đơn hàng cho các dịch vụ khác (Sofa, Máy lạnh, Lau kính)
  const allServices = await prisma.dichVu.findMany();
  const dvSofa = allServices.find((s) => s.slug === "giat-sofa-nem-tai-nha");
  const dvMayLanh = allServices.find((s) => s.slug === "ve-sinh-may-lanh-inverter");
  const dvLauKinh = allServices.find((s) => s.slug === "lau-kinh-mat-ngoai-can-ho");

  if (dvSofa) {
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-004" },
      update: {},
      create: {
        bookingCode: "CM-BK-004",
        scheduledDate: new Date("2026-10-07T10:00:00Z"),
        address: "Vinhomes Central Park, Bình Thạnh",
        totalPrice: 350000,
        status: "COMPLETED",
        customerId: customer1.id,
        serviceId: dvSofa.id,
      },
    });
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-005" },
      update: {},
      create: {
        bookingCode: "CM-BK-005",
        scheduledDate: new Date("2026-10-11T15:30:00Z"),
        address: "Khu đô thị Sala, Q.2",
        totalPrice: 700000,
        status: "IN_PROGRESS",
        customerId: customer2.id,
        serviceId: dvSofa.id,
      },
    });
  }

  if (dvMayLanh) {
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-006" },
      update: {},
      create: {
        bookingCode: "CM-BK-006",
        scheduledDate: new Date("2026-10-08T09:00:00Z"),
        address: "Chung cư Phú Mỹ Hưng, Q.7",
        totalPrice: 360000,
        status: "COMPLETED",
        customerId: customer3.id,
        serviceId: dvMayLanh.id,
      },
    });
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-007" },
      update: {},
      create: {
        bookingCode: "CM-BK-007",
        scheduledDate: new Date("2026-10-12T13:00:00Z"),
        address: "Hà Đô Centrosa, Q.10",
        totalPrice: 540000,
        status: "CONFIRMED",
        customerId: customer1.id,
        serviceId: dvMayLanh.id,
      },
    });
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-008" },
      update: {},
      create: {
        bookingCode: "CM-BK-008",
        scheduledDate: new Date("2026-10-13T16:00:00Z"),
        address: "The Sun Avenue, TP.Thủ Đức",
        totalPrice: 180000,
        status: "PENDING",
        customerId: customer2.id,
        serviceId: dvMayLanh.id,
      },
    });
  }

  if (dvLauKinh) {
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-009" },
      update: {},
      create: {
        bookingCode: "CM-BK-009",
        scheduledDate: new Date("2026-10-09T08:30:00Z"),
        address: "Imperia An Phú, Q.2",
        totalPrice: 600000,
        status: "COMPLETED",
        customerId: customer2.id,
        serviceId: dvLauKinh.id,
      },
    });
    await prisma.booking.upsert({
      where: { bookingCode: "CM-BK-010" },
      update: {},
      create: {
        bookingCode: "CM-BK-010",
        scheduledDate: new Date("2026-10-14T10:00:00Z"),
        address: "Gold View, Bến Vân Đồn, Q.4",
        totalPrice: 1200000,
        status: "IN_PROGRESS",
        customerId: customer3.id,
        serviceId: dvLauKinh.id,
      },
    });
  }

  console.log(`✅ Đã đồng bộ đầy đủ các Shop đối tác, dịch vụ và đánh giá mẫu!`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
