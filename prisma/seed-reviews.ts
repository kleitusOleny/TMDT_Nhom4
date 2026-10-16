import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Bắt đầu tạo đánh giá & đơn hoàn thành mẫu cho tất cả các dịch vụ...");

  // 1. Tạo danh sách khách hàng mẫu để viết đánh giá
  const sampleCustomers = [
    { phone: "0911223344", email: "hoangthuylinh@gmail.com", fullName: "Hoàng Thùy Linh" },
    { phone: "0922334455", email: "vuminhduc@gmail.com", fullName: "Vũ Minh Đức" },
    { phone: "0933445566", email: "ngocmai@gmail.com", fullName: "Trần Ngọc Mai" },
    { phone: "0944556677", email: "lehonganh@gmail.com", fullName: "Lê Hồng Ánh" },
    { phone: "0955667788", email: "phamquocbao@gmail.com", fullName: "Phạm Quốc Bảo" },
    { phone: "0966778899", email: "nguyenthithu@gmail.com", fullName: "Nguyễn Thị Thu" },
    { phone: "0977889900", email: "dangvanlong@gmail.com", fullName: "Đặng Văn Long" },
    { phone: "0988990011", email: "buihoangnam@gmail.com", fullName: "Bùi Hoàng Nam" },
  ];

  const customerRecords = [];
  for (const c of sampleCustomers) {
    const user = await prisma.user.upsert({
      where: { phone: c.phone },
      update: { fullName: c.fullName },
      create: {
        phone: c.phone,
        email: c.email,
        fullName: c.fullName,
        password: "$2a$10$e7Kvh8Vz4b6nE37P8fUe/eW5G29CsqeI30X.g9.aD9W/jY.vWw6cK",
        role: "CUSTOMER",
      },
    });
    customerRecords.push(user);
  }

  // 2. Lấy toàn bộ dịch vụ hiện tại trong database
  const services = await prisma.dichVu.findMany();
  console.log(`Tìm thấy ${services.length} dịch vụ trong cơ sở dữ liệu.`);

  // 3. Mẫu bình luận thực tế theo danh mục
  const commentsPool = [
    {
      rating: 5,
      comment: "Dịch vụ làm rất sạch sẽ và chu đáo. Nhân viên đeo găng tay, khẩu trang đầy đủ và có thái độ rất niềm nở. Sẽ tiếp tục đặt lại lần sau!",
      images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"],
    },
    {
      rating: 5,
      comment: "Đúng giờ hẹn, trang thiết bị máy móc hiện đại. Tẩy sạch các vết ố vàng cứng đầu mà mình tự làm mãi không hết. Rất hài lòng với chất lượng!",
      images: null,
    },
    {
      rating: 4,
      comment: "Làm việc nhanh nhẹn, các góc chân tường và gầm giường đều được hút bụi kỹ. Giá cả hợp lý so với mặt bằng chung. Cho 4 sao vì đến trễ 10 phút do kẹt xe nhưng có gọi báo trước.",
      images: null,
    },
    {
      rating: 5,
      comment: "Nhà mình có em bé và nuôi mèo nên rất kỹ tính, bên CleanMate dùng dung dịch sinh học khử mùi rất thơm nhẹ dễ chịu, không bị nồng hóa chất.",
      images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80"],
    },
    {
      rating: 5,
      comment: "Quy trình làm việc chuyên nghiệp, có checklist nghiệm thu rõ ràng trước khi bàn giao. Dọn dẹp xong còn hướng dẫn mình cách bảo dưỡng định kỳ.",
      images: null,
    },
    {
      rating: 4,
      comment: "Thợ nhiệt tình, làm sạch bóng loáng. Giá tiền đúng như niêm yết trên app không phát sinh thêm chi phí nào khác.",
      images: null,
    },
  ];

  let totalNewReviews = 0;

  for (const s of services) {
    // Kiểm tra xem dịch vụ này đã có bao nhiêu review
    const existingReviewsCount = await prisma.review.count({
      where: { serviceId: s.id },
    });

    // Tạo từ 3 đến 5 đánh giá cho mỗi dịch vụ
    const reviewsNeeded = Math.max(3, 4 - existingReviewsCount);

    for (let i = 0; i < reviewsNeeded; i++) {
      const customer = customerRecords[(s.id + i) % customerRecords.length];
      const commentTemplate = commentsPool[(s.id * 2 + i) % commentsPool.length];
      const bookingCode = `SEED-RV-${s.id}-${Date.now().toString().slice(-4)}-${i}`;

      // Tạo đơn hàng COMPLETED tương ứng để liên kết Review
      const booking = await prisma.booking.create({
        data: {
          bookingCode,
          scheduledDate: new Date(Date.now() - (i + 1) * 86400000 * 3), // lùi ngày về quá khứ
          address: "Căn hộ Vinhomes Central Park, Q.Bình Thạnh, TP.HCM",
          totalPrice: s.priceStart,
          status: "COMPLETED",
          isAcceptedByCustomer: true,
          customerId: customer.id,
          serviceId: s.id,
          payment: {
            create: {
              amount: s.priceStart,
              method: "VNPAY",
              status: "COMPLETED",
              transactionId: `TXN-${bookingCode}`,
            },
          },
        },
      });

      // Tạo Review cho booking này
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          serviceId: s.id,
          rating: commentTemplate.rating,
          comment: commentTemplate.comment,
          images: commentTemplate.images,
          createdAt: new Date(Date.now() - (i + 1) * 86400000 * 2),
        },
      });

      totalNewReviews++;
    }

    // Cập nhật lại rating và totalReviews trong model DichVu để đồng bộ
    const allReviewsForService = await prisma.review.findMany({
      where: { serviceId: s.id },
      select: { rating: true },
    });
    const count = allReviewsForService.length;
    const avg = Number((allReviewsForService.reduce((a, b) => a + b.rating, 0) / count).toFixed(1));

    await prisma.dichVu.update({
      where: { id: s.id },
      data: {
        rating: avg,
        totalReviews: count,
      },
    });

    console.log(`✨ Dịch vụ #${s.id} (${s.title}): ${count} đánh giá - Điểm TB: ${avg}★`);
  }

  console.log(`\n🎉 Hoàn thành! Đã tạo thành công ${totalNewReviews} đánh giá thực tế vào database.`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed reviews:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
