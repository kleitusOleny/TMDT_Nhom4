import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Bắt đầu đổ dữ liệu mẫu vào cơ sở dữ liệu...");

  // 1. Tạo User chủ cửa hàng (Shop owner)
  const owner = await prisma.user.upsert({
    where: { phone: "0909123456" },
    update: {},
    create: {
      phone: "0909123456",
      email: "contact@sachbong.vn",
      password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK", // demo pass: 123456
      fullName: "Nguyễn Văn Chủ Shop",
      dateOfBirth: new Date("1990-05-15"),
    },
  });

  // 2. Tạo Shop
  const shop = await prisma.shop.upsert({
    where: { slug: "cong-ty-tnhh-ve-sinh-sach-bong" },
    update: {},
    create: {
      name: "Công ty TNHH Vệ sinh Sạch Bóng",
      slug: "cong-ty-tnhh-ve-sinh-sach-bong",
      isVerified: true,
      rating: 4.8,
      totalReviews: 256,
      area: "Quận 1, 2, 3, 7, Thủ Đức",
      ownerId: owner.id,
    },
  });

  // 3. Tạo Dịch vụ "Vệ sinh nhà ở toàn diện"
  const dichVu = await prisma.dichVu.upsert({
    where: { slug: "ve-sinh-nha-o-toan-dien" },
    update: {
      title: "Dịch vụ vệ sinh nhà ở toàn diện",
      description:
        "Dịch vụ vệ sinh nhà ở toàn diện của Sạch Bóng cung cấp giải pháp làm sạch sâu mọi ngóc ngách căn nhà của bạn. Chúng tôi sử dụng các máy móc hiện đại và hóa chất làm sạch thân thiện với môi trường, không độc hại cho trẻ nhỏ và vật nuôi. Đội ngũ nhân viên tận tâm, lý lịch rõ ràng đảm bảo sự hài lòng tuyệt đối cho bạn.",
      details: [
        "Lau dọn phòng khách: Hút bụi sofa, lau kệ TV, bàn trà, quét màng nhện trần nhà.",
        "Vệ sinh phòng ngủ: Thay ga trải giường (nếu có yêu cầu), quét bụi gầm giường, lau tủ quần áo.",
        "Làm sạch nhà bếp: Khử dầu mỡ bếp gas/bếp từ, lau chùi bồn rửa, lau bên ngoài tủ lạnh, lò vi sóng.",
        "Chà rửa nhà tắm: Tẩy sạch cặn bám gương, kính buồng tắm, khử trùng bồn cầu, chà sàn gạch toilet.",
        "Hút bụi và lau sàn toàn bộ căn nhà bằng dung dịch hương thơm tự nhiên dễ chịu.",
      ],
      priceStart: 250000,
      pricingTable: [
        {
          id: "fixed",
          title: "Giá cố định",
          sub: "Dưới 50m²",
          price: 250000,
          unit: "/lần",
        },
        {
          id: "sqm",
          title: "Giá theo m²",
          sub: "Từ 50m² trở lên",
          price: 15000,
          unit: "/m²",
        },
        {
          id: "hourly",
          title: "Giá theo giờ",
          sub: "Tối thiểu 3 tiếng",
          price: 120000,
          unit: "/giờ",
        },
        {
          id: "monthly",
          title: "Gói trọn gói",
          sub: "Tháng (4 lần dọn)",
          price: 1500000,
          unit: "/tháng",
        },
      ],
      images: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1200&q=80",
      ],
      rating: 4.8,
      totalReviews: 256,
      duration: "2-4 giờ",
      serviceArea: "Quận 1, 2, 3, 7, Thủ Đức",
      shopId: shop.id,
    },
    create: {
      title: "Dịch vụ vệ sinh nhà ở toàn diện",
      slug: "ve-sinh-nha-o-toan-dien",
      description:
        "Dịch vụ vệ sinh nhà ở toàn diện của Sạch Bóng cung cấp giải pháp làm sạch sâu mọi ngóc ngách căn nhà của bạn. Chúng tôi sử dụng các máy móc hiện đại và hóa chất làm sạch thân thiện với môi trường, không độc hại cho trẻ nhỏ và vật nuôi. Đội ngũ nhân viên tận tâm, lý lịch rõ ràng đảm bảo sự hài lòng tuyệt đối cho bạn.",
      details: [
        "Lau dọn phòng khách: Hút bụi sofa, lau kệ TV, bàn trà, quét màng nhện trần nhà.",
        "Vệ sinh phòng ngủ: Thay ga trải giường (nếu có yêu cầu), quét bụi gầm giường, lau tủ quần áo.",
        "Làm sạch nhà bếp: Khử dầu mỡ bếp gas/bếp từ, lau chùi bồn rửa, lau bên ngoài tủ lạnh, lò vi sóng.",
        "Chà rửa nhà tắm: Tẩy sạch cặn bám gương, kính buồng tắm, khử trùng bồn cầu, chà sàn gạch toilet.",
        "Hút bụi và lau sàn toàn bộ căn nhà bằng dung dịch hương thơm tự nhiên dễ chịu.",
      ],
      priceStart: 250000,
      pricingTable: [
        {
          id: "fixed",
          title: "Giá cố định",
          sub: "Dưới 50m²",
          price: 250000,
          unit: "/lần",
        },
        {
          id: "sqm",
          title: "Giá theo m²",
          sub: "Từ 50m² trở lên",
          price: 15000,
          unit: "/m²",
        },
        {
          id: "hourly",
          title: "Giá theo giờ",
          sub: "Tối thiểu 3 tiếng",
          price: 120000,
          unit: "/giờ",
        },
        {
          id: "monthly",
          title: "Gói trọn gói",
          sub: "Tháng (4 lần dọn)",
          price: 1500000,
          unit: "/tháng",
        },
      ],
      images: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1200&q=80",
      ],
      rating: 4.8,
      totalReviews: 256,
      duration: "2-4 giờ",
      serviceArea: "Quận 1, 2, 3, 7, Thủ Đức",
      shopId: shop.id,
    },
  });

  console.log(`✅ Đã tạo/cập nhật thành công dịch vụ: ${dichVu.title} (ID: ${dichVu.id}) thuộc Shop: ${shop.name}`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
