export interface UserRecord {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: "ADMIN" | "SELLER" | "CUSTOMER" | "STAFF" | "CLEANER";
  actualRole?: string;
  status: "ACTIVE" | "BLOCKED";
  sellerName?: string;
  joinedDate: string;
}

export interface ProviderRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  area: string;
  rating: number;
  totalReviews: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  servicesCount: number;
  ownerId: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string | null;
  createdAt: string;
}

export interface ServiceRecord {
  id: number;
  name: string;
  category: "home" | "office" | "industrial" | "sofa" | "ac" | "glass";
  categoryName: string;
  sellerId: number;
  sellerName: string;
  price: number;
  unit: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "INACTIVE";
  rating: number;
  completedBookings: number;
  description?: string;
  images?: string[];
  pricingTable?: {
    id: string;
    title: string;
    sub: string;
    price: number;
    unit: string;
  }[];
}

export interface BookingRecord {
  id: string; // CM-2026-001
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  serviceId: number;
  serviceName: string;
  category: string;
  sellerId: number;
  sellerName: string;
  assignedStaff?: string;
  cleanerId?: number | null;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string;
  address: string;
  note?: string | null;
  totalAmount: number;
  commissionFee: number; // Phí sàn
  sellerEarnings: number; // Tiền người bán thực nhận
  paymentMethod: "CASH" | "VNPAY" | "MOMO" | "QR_BANKING" | "CREDIT_CARD" | "BANK_TRANSFER";
  paymentStatus?: string;
  tipAmount?: number;
  transactionId?: string | null;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  beforeImages?: string[];
  afterImages?: string[];
  cancellationReason?: string | null;
  createdAt: string;
}

export interface DailyRevenueRecord {
  date: string; // YYYY-MM-DD
  formattedDate: string; // DD/MM
  totalRevenue: number;
  platformFee: number;
  sellerRevenue: number;
  orderCount: number;
}

// Danh sách dữ liệu mẫu chất lượng cao, thực tế
export const initialUsers: UserRecord[] = [
  {
    id: 1,
    fullName: "Quản Trị Viên Hệ Thống",
    phone: "0901234567",
    email: "admin@cleanmate.vn",
    role: "ADMIN",
    status: "ACTIVE",
    joinedDate: "2026-01-01",
  },
  {
    id: 2,
    fullName: "Nguyễn Văn Hùng",
    phone: "0912345678",
    email: "hung.cleanpro@gmail.com",
    role: "SELLER",
    status: "ACTIVE",
    sellerName: "Công ty TNHH CleanPro",
    joinedDate: "2026-01-15",
  },
  {
    id: 3,
    fullName: "Trần Thị Mai",
    phone: "0987654321",
    email: "saigonxanh.services@gmail.com",
    role: "SELLER",
    status: "ACTIVE",
    sellerName: "Dịch vụ Vệ sinh Sài Gòn Xanh",
    joinedDate: "2026-02-01",
  },
  {
    id: 4,
    fullName: "Lê Hoàng Long",
    phone: "0933445566",
    email: "cleanplus.vn@gmail.com",
    role: "SELLER",
    status: "ACTIVE",
    sellerName: "CleanPlus Việt Nam",
    joinedDate: "2026-02-10",
  },
  {
    id: 5,
    fullName: "Phạm Thúy Hằng",
    phone: "0966778899",
    email: "thuyhang.nguyen@gmail.com",
    role: "CUSTOMER",
    status: "ACTIVE",
    joinedDate: "2026-03-05",
  },
  {
    id: 6,
    fullName: "Đỗ Minh Khang",
    phone: "0977889900",
    email: "khang.do@gmail.com",
    role: "CUSTOMER",
    status: "ACTIVE",
    joinedDate: "2026-03-12",
  },
  {
    id: 7,
    fullName: "Vũ Bảo Ngọc",
    phone: "0944556677",
    email: "ngoc.vu@gmail.com",
    role: "CUSTOMER",
    status: "ACTIVE",
    joinedDate: "2026-03-18",
  },
  {
    id: 8,
    fullName: "Ngô Đức Trọng",
    phone: "0911223344",
    email: "trong.ngo@yahoo.com",
    role: "CUSTOMER",
    status: "BLOCKED",
    joinedDate: "2026-03-20",
  },
];

export const initialServices: ServiceRecord[] = [
  {
    id: 101,
    name: "Dọn dẹp nhà ở toàn diện theo giờ",
    category: "home",
    categoryName: "Vệ sinh nhà ở",
    sellerId: 2,
    sellerName: "Công ty TNHH CleanPro",
    price: 90000,
    unit: "giờ",
    status: "APPROVED",
    rating: 4.9,
    completedBookings: 320,
  },
  {
    id: 102,
    name: "Vệ sinh văn phòng định kỳ theo hợp đồng",
    category: "office",
    categoryName: "Vệ sinh văn phòng",
    sellerId: 2,
    sellerName: "Công ty TNHH CleanPro",
    price: 130000,
    unit: "giờ",
    status: "APPROVED",
    rating: 4.8,
    completedBookings: 185,
  },
  {
    id: 103,
    name: "Vệ sinh công trình sau xây dựng căn hộ",
    category: "industrial",
    categoryName: "Sau xây dựng",
    sellerId: 3,
    sellerName: "Dịch vụ Vệ sinh Sài Gòn Xanh",
    price: 18000,
    unit: "m²",
    status: "APPROVED",
    rating: 4.8,
    completedBookings: 94,
  },
  {
    id: 104,
    name: "Giặt sofa nỉ, da và nệm kymdan diệt khuẩn",
    category: "sofa",
    categoryName: "Giặt sofa & nệm thảm",
    sellerId: 3,
    sellerName: "Dịch vụ Vệ sinh Sài Gòn Xanh",
    price: 320000,
    unit: "bộ",
    status: "APPROVED",
    rating: 4.9,
    completedBookings: 240,
  },
  {
    id: 105,
    name: "Bảo dưỡng xịt rửa dàn lạnh Inverter",
    category: "ac",
    categoryName: "Vệ sinh máy lạnh",
    sellerId: 4,
    sellerName: "CleanPlus Việt Nam",
    price: 160000,
    unit: "máy",
    status: "APPROVED",
    rating: 4.7,
    completedBookings: 156,
  },
  {
    id: 106,
    name: "Lau kính mặt ngoài và ban công chung cư",
    category: "glass",
    categoryName: "Vệ sinh kính",
    sellerId: 4,
    sellerName: "CleanPlus Việt Nam",
    price: 25000,
    unit: "m²",
    status: "PENDING",
    rating: 4.6,
    completedBookings: 42,
  },
  {
    id: 107,
    name: "Khử khuẩn Nano Bạc chống ẩm mốc phòng kín",
    category: "home",
    categoryName: "Vệ sinh nhà ở",
    sellerId: 2,
    sellerName: "Công ty TNHH CleanPro",
    price: 280000,
    unit: "phòng",
    status: "PENDING",
    rating: 0,
    completedBookings: 0,
  },
];

export const initialBookings: BookingRecord[] = [
  {
    id: "CM-2026-101",
    customerName: "Phạm Thúy Hằng",
    customerPhone: "0966778899",
    serviceId: 101,
    serviceName: "Dọn dẹp nhà ở toàn diện theo giờ",
    category: "Vệ sinh nhà ở",
    sellerId: 2,
    sellerName: "Công ty TNHH CleanPro",
    assignedStaff: "Nguyễn Thị Hoa",
    bookingDate: "2026-10-12",
    bookingTime: "08:30",
    address: "Căn hộ Landmark 4, Vinhomes Central Park, Q. Bình Thạnh",
    totalAmount: 360000,
    commissionFee: 54000,
    sellerEarnings: 306000,
    paymentMethod: "VNPAY",
    status: "COMPLETED",
    createdAt: "2026-10-11T14:20:00Z",
  },
  {
    id: "CM-2026-102",
    customerName: "Đỗ Minh Khang",
    customerPhone: "0977889900",
    serviceId: 104,
    serviceName: "Giặt sofa nỉ, da và nệm kymdan diệt khuẩn",
    category: "Giặt sofa & nệm thảm",
    sellerId: 3,
    sellerName: "Dịch vụ Vệ sinh Sài Gòn Xanh",
    assignedStaff: "Lê Văn Đức",
    bookingDate: "2026-10-12",
    bookingTime: "10:00",
    address: "Số 45 Đường số 7, KDC Him Lam, P. Tân Hưng, Q. 7",
    totalAmount: 640000,
    commissionFee: 96000,
    sellerEarnings: 544000,
    paymentMethod: "MOMO",
    status: "COMPLETED",
    createdAt: "2026-10-11T16:45:00Z",
  },
  {
    id: "CM-2026-103",
    customerName: "Vũ Bảo Ngọc",
    customerPhone: "0944556677",
    serviceId: 105,
    serviceName: "Bảo dưỡng xịt rửa dàn lạnh Inverter",
    category: "Vệ sinh máy lạnh",
    sellerId: 4,
    sellerName: "CleanPlus Việt Nam",
    assignedStaff: "Trần Tuấn Anh",
    bookingDate: "2026-10-12",
    bookingTime: "14:00",
    address: "128 Lê Văn Sỹ, Phường 10, Quận Phú Nhuận",
    totalAmount: 320000,
    commissionFee: 48000,
    sellerEarnings: 272000,
    paymentMethod: "QR_BANKING",
    status: "IN_PROGRESS",
    createdAt: "2026-10-12T07:15:00Z",
  },
  {
    id: "CM-2026-104",
    customerName: "Hoàng Gia Bảo",
    customerPhone: "0908889999",
    serviceId: 102,
    serviceName: "Vệ sinh văn phòng định kỳ theo hợp đồng",
    category: "Vệ sinh văn phòng",
    sellerId: 2,
    sellerName: "Công ty TNHH CleanPro",
    assignedStaff: "Đội Vệ sinh 01",
    bookingDate: "2026-10-13",
    bookingTime: "09:00",
    address: "Tầng 5, Tòa nhà Sunwah, 115 Nguyễn Huệ, Quận 1",
    totalAmount: 1250000,
    commissionFee: 187500,
    sellerEarnings: 1062500,
    paymentMethod: "QR_BANKING",
    status: "CONFIRMED",
    createdAt: "2026-10-12T09:30:00Z",
  },
  {
    id: "CM-2026-105",
    customerName: "Lê Thu Trang",
    customerPhone: "0918776655",
    serviceId: 103,
    serviceName: "Vệ sinh công trình sau xây dựng căn hộ",
    category: "Sau xây dựng",
    sellerId: 3,
    sellerName: "Dịch vụ Vệ sinh Sài Gòn Xanh",
    assignedStaff: "Chưa phân công",
    bookingDate: "2026-10-14",
    bookingTime: "08:00",
    address: "Căn hộ 12.08, Chung cư Masteri Thảo Điền, TP. Thủ Đức",
    totalAmount: 1800000,
    commissionFee: 270000,
    sellerEarnings: 1530000,
    paymentMethod: "CASH",
    status: "PENDING",
    createdAt: "2026-10-12T11:10:00Z",
  },
  {
    id: "CM-2026-106",
    customerName: "Trịnh Hoài An",
    customerPhone: "0934112233",
    serviceId: 101,
    serviceName: "Dọn dẹp nhà ở toàn diện theo giờ",
    category: "Vệ sinh nhà ở",
    sellerId: 2,
    sellerName: "Công ty TNHH CleanPro",
    bookingDate: "2026-10-10",
    bookingTime: "15:00",
    address: "88 Hai Bà Trưng, Phường Bến Nghé, Quận 1",
    totalAmount: 270000,
    commissionFee: 40500,
    sellerEarnings: 229500,
    paymentMethod: "CASH",
    status: "CANCELLED",
    createdAt: "2026-10-09T18:00:00Z",
  },
  {
    id: "CM-2026-107",
    customerName: "Bùi Khánh Linh",
    customerPhone: "0989223344",
    serviceId: 104,
    serviceName: "Giặt sofa nỉ, da và nệm kymdan diệt khuẩn",
    category: "Giặt sofa & nệm thảm",
    sellerId: 3,
    sellerName: "Dịch vụ Vệ sinh Sài Gòn Xanh",
    assignedStaff: "Nguyễn Văn Tuấn",
    bookingDate: "2026-10-09",
    bookingTime: "09:30",
    address: "Biệt thự Lucasta, Đường Liên Phường, TP. Thủ Đức",
    totalAmount: 960000,
    commissionFee: 144000,
    sellerEarnings: 816000,
    paymentMethod: "VNPAY",
    status: "COMPLETED",
    createdAt: "2026-10-08T10:15:00Z",
  },
  {
    id: "CM-2026-108",
    customerName: "Phan Quốc Việt",
    customerPhone: "0909554433",
    serviceId: 105,
    serviceName: "Bảo dưỡng xịt rửa dàn lạnh Inverter",
    category: "Vệ sinh máy lạnh",
    sellerId: 4,
    sellerName: "CleanPlus Việt Nam",
    assignedStaff: "Phạm Tiến Đạt",
    bookingDate: "2026-10-08",
    bookingTime: "13:30",
    address: "354 Hoàng Văn Thụ, Phường 4, Quận Tân Bình",
    totalAmount: 480000,
    commissionFee: 72000,
    sellerEarnings: 408000,
    paymentMethod: "MOMO",
    status: "COMPLETED",
    createdAt: "2026-10-07T14:00:00Z",
  },
];

// Hàm sinh dữ liệu doanh thu theo khoảng ngày (Date Range)
export function generateDailyStats(
  fromDate: string,
  toDate: string,
  sellerIdFilter?: number
): DailyRevenueRecord[] {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  // Đảm bảo start <= end
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const results: DailyRevenueRecord[] = [];
  const curr = new Date(start);

  while (curr <= end) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, "0");
    const dd = String(curr.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const formattedDate = `${dd}/${mm}`;

    // Lọc các booking trong ngày đó
    const matchingBookings = initialBookings.filter((b) => {
      const matchDate = b.bookingDate === dateStr;
      const matchSeller = sellerIdFilter ? b.sellerId === sellerIdFilter : true;
      return matchDate && matchSeller && b.status !== "CANCELLED";
    });

    let totalRevenue = 0;
    let platformFee = 0;
    let sellerRevenue = 0;
    let orderCount = matchingBookings.length;

    if (orderCount > 0) {
      totalRevenue = matchingBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      platformFee = matchingBookings.reduce((sum, b) => sum + b.commissionFee, 0);
      sellerRevenue = matchingBookings.reduce((sum, b) => sum + b.sellerEarnings, 0);
    } else {
      // Giả lập dữ liệu mô phỏng dựa theo ngày để biểu đồ sinh động nếu khoảng ngày rộng
      const daySeed = (curr.getDate() * 17 + curr.getMonth() * 31) % 10;
      const baseCount = sellerIdFilter ? (daySeed % 3) + 1 : (daySeed % 5) + 2;
      const avgPrice = 450000;
      totalRevenue = baseCount * avgPrice + (daySeed * 45000);
      platformFee = Math.round(totalRevenue * 0.15);
      sellerRevenue = totalRevenue - platformFee;
      orderCount = baseCount;
    }

    results.push({
      date: dateStr,
      formattedDate,
      totalRevenue,
      platformFee,
      sellerRevenue,
      orderCount,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return results;
}
