"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import {
  Sparkles,
  MapPin,
  Calendar,
  Search,
  Star,
  CheckCircle2,
  ShieldCheck,
  Headphones,
  DollarSign,
  Award,
  ChevronRight,
  Building2,
  Clock,
  ArrowRight,
  Layers,
  Sparkle,
  Fan,
  Home,
  Factory,
  Loader2,
} from "lucide-react";

interface ServiceItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  priceStart: number | string;
  rating: number;
  totalReviews: number;
  duration?: string | null;
  serviceArea?: string | null;
  images: string[] | string;
  shop: {
    id: number;
    name: string;
    slug: string;
    approvalStatus: string;
    rating: number;
    area?: string | null;
  };
  categories?: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  _count?: {
    services: number;
  };
}

interface ShopItem {
  id: number;
  name: string;
  slug: string;
  rating: number;
  totalReviews: number;
  area?: string | null;
  _count?: {
    services: number;
  };
}

export default function CleanMateHome() {
  const router = useRouter();

  // Booking Form State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [location, setLocation] = useState("TP. Hồ Chí Minh");
  const [bookingDate, setBookingDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dữ liệu từ Database
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/home");
        const json = await res.json();
        if (json.success && json.data) {
          setServices(json.data.featuredServices || []);
          setCategories(json.data.categories || []);
          setShops(json.data.topShops || []);
        }
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  // Điều hướng tìm kiếm sang trang /dichvu
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    router.push(`/dichvu?${params.toString()}`);
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return isNaN(num) ? "0đ" : new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  // Icon mapping cho Category
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "ve-sinh-nha-o":
        return Home;
      case "ve-sinh-van-phong":
        return Building2;
      case "ve-sinh-cong-nghiep":
        return Factory;
      case "giat-sofa-nem":
        return Layers;
      case "ve-sinh-may-lanh":
        return Fan;
      default:
        return Sparkle;
    }
  };

  const steps = [
    {
      number: "01",
      title: "Chọn dịch vụ mong muốn",
      desc: "Khám phá danh sách các gói dịch vụ dọn dẹp vệ sinh nhà ở, văn phòng với giá niêm yết rõ ràng.",
    },
    {
      number: "02",
      title: "Đặt lịch trực tuyến",
      desc: "Chọn ngày giờ, địa điểm và ghi chú yêu cầu cụ thể chỉ trong 60 giây.",
    },
    {
      number: "03",
      title: "Đối tác chuyên nghiệp thực hiện",
      desc: "Nhân viên đối tác được đào tạo đến đúng giờ với máy móc hiện đại và hóa chất thân thiện môi trường.",
    },
    {
      number: "04",
      title: "Nghiệm thu & Đánh giá",
      desc: "Khách hàng kiểm tra chất lượng bằng mắt & hình ảnh nghiệm thu, thanh toán an toàn và đánh giá chất lượng.",
    },
  ];

  const commitments = [
    {
      icon: ShieldCheck,
      title: "Đối tác được xác minh",
      desc: "Hồ sơ pháp lý rõ ràng, lý lịch minh bạch và tay nghề được kiểm tra định kỳ.",
    },
    {
      icon: CheckCircle2,
      title: "Bảo hành hài lòng 100%",
      desc: "Hỗ trợ dọn lại hoàn toàn miễn phí nếu khách hàng chưa hài lòng trong vòng 24 giờ.",
    },
    {
      icon: DollarSign,
      title: "Giá cả minh bạch",
      desc: "Bảng giá niêm yết công khai, thanh toán linh hoạt, cam kết không phụ phí ẩn vô lý.",
    },
    {
      icon: Headphones,
      title: "Hỗ trợ tận tâm 24/7",
      desc: "Hệ thống hỗ trợ và xử lý khiếu nại (Ticket) nhanh chóng, đảm bảo quyền lợi khách hàng.",
    },
    {
      icon: Sparkles,
      title: "Thiết bị & Hóa chất an toàn",
      desc: "Sử dụng hóa chất làm sạch sinh học, an toàn tuyệt đối cho người già, trẻ nhỏ và thú nuôi.",
    },
    {
      icon: Award,
      title: "Đúng giờ & Tác phong chuẩn",
      desc: "Nhân viên tuân thủ đúng lịch hẹn, trung thực, lịch sự và giữ gìn tài sản của khách hàng.",
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Mai Phương",
      role: "Trưởng phòng Marketing, Q.1",
      content:
        "“Tôi rất ấn tượng với sự tỉ mỉ của đội ngũ CleanMate. Các bạn lau chùi từng góc tủ bếp và khung kính bóng loáng. Sẽ tiếp tục ủng hộ dịch vụ định kỳ hàng tuần!”",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Trần Minh Tuấn",
      role: "Chủ Doanh nghiệp, Q.Bình Thạnh",
      content:
        "“CleanMate cung cấp dịch vụ dọn dẹp văn phòng cực kỳ chu đáo. Nhân viên ngoan ngoãn, trung thực và tác phong rất chuyên nghiệp. Rất an tâm khi giao chìa khóa văn phòng.”",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Phạm Nhật Nam",
      role: "Kỹ sư phần mềm, TP. Thủ Đức",
      content:
        "“Đặt lịch trên web nhanh như chớp. Nhân viên đến đúng giờ, mang đầy đủ đồ nghề diệt khuẩn nệm sofa nhìn chuyên nghiệp hẳn. Giá cả lại rất hợp lý!”",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* 1. HEADER CHUNG ĐỒNG BỘ */}
      <Header currentPath="/" showSearchOrBooking={true} />

      {/* 2. HERO SECTION VỚI SEARCH BOX ĐỘNG TRỰC TIẾP TỪ DB */}
      <section className="relative pt-12 pb-20 bg-gradient-to-b from-blue-50/70 via-slate-50/40 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-6 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> Giải pháp vệ sinh công nghệ hàng đầu
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
                Dịch vụ vệ sinh chuyên nghiệp <span className="text-blue-600">tại nhà & văn phòng</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
                Nền tảng kết nối trực tiếp với các đơn vị dịch vụ dọn dẹp hàng đầu. Đặt lịch online nhanh chóng, giá niêm yết minh bạch, bảo hành dịch vụ 24h.
              </p>

              {/* SEARCH & BOOKING BAR TƯƠNG TÁC THẬT */}
              <form
                id="booking-box"
                onSubmit={handleSearch}
                className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200/90 max-w-2xl mb-10 transition-all hover:border-blue-300"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  {/* Danh mục */}
                  <div className="px-3 py-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Loại dịch vụ
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Khu vực */}
                  <div className="px-3 py-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Khu vực
                    </label>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Quận / Huyện..."
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Thời gian */}
                  <div className="px-3 py-1 flex flex-col justify-between">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Ngày cần dọn
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-auto sm:flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nhập từ khóa tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Tìm Dịch Vụ Ngay</span>
                  </button>
                </div>
              </form>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-6 pt-4 max-w-lg border-t border-slate-200/60">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">10,000+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Khách hàng tin cậy</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">500+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Đối tác dịch vụ</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">50,000+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Lượt dọn thành công</div>
                </div>
              </div>
            </div>

            {/* Hero Right Image Banner */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/15 border-4 border-white">
                <Image
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                  alt="Đội ngũ CleanMate làm sạch chuyên nghiệp"
                  width={800}
                  height={900}
                  className="w-full h-[460px] sm:h-[520px] object-cover hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg flex items-center gap-4 border border-white/60">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cam kết an toàn tuyệt đối</h4>
                    <p className="text-xs text-slate-600">Đối tác có bảo hiểm trách nhiệm & hồ sơ xác thực 100%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KHÁM PHÁ THEO DANH MỤC THỰC TẾ TRONG DATABASE */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Phân loại dịch vụ
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Danh mục dịch vụ phổ biến
              </h2>
            </div>
            <Link
              href="/dichvu"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition"
            >
              <span>Xem tất cả dịch vụ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((c) => {
              const Icon = getCategoryIcon(c.slug);
              return (
                <Link
                  key={c.id}
                  href={`/dichvu?category=${c.slug}`}
                  className="group bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition flex flex-col items-center text-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white group-hover:bg-blue-600 shadow-xs flex items-center justify-center text-blue-600 group-hover:text-white transition-all duration-300 mb-3 border border-slate-100">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition mb-1 line-clamp-1">
                    {c.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {c._count?.services || 0} dịch vụ
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. DỊCH VỤ NỔI BẬT ĐƯỢC TẢI ĐỘNG TỪ DATABASE */}
      <section id="services" className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Dịch vụ hàng đầu
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Dịch vụ vệ sinh được đánh giá cao nhất
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Dữ liệu được cập nhật theo thời gian thực từ đánh giá của khách hàng thực tế.
            </p>
          </div>

          {isLoading ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-slate-500">Đang tải danh sách dịch vụ...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((item) => {
                const firstImg = Array.isArray(item.images)
                  ? item.images[0]
                  : typeof item.images === "string"
                  ? item.images
                  : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80";

                return (
                  <Link
                    key={item.id}
                    href={`/dichvu/${item.id}`}
                    className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col"
                  >
                    {/* Ảnh đại diện */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <Image
                        src={firstImg}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 shadow-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span className="truncate max-w-[150px]">{item.shop?.name}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-amber-400 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    {/* Nội dung dịch vụ */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span className="text-blue-600 font-semibold">
                            {item.categories?.[0]?.name || "Vệ sinh chuyên nghiệp"}
                          </span>
                          {item.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{item.duration}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Khởi điểm từ</span>
                          <span className="text-base font-extrabold text-blue-600">
                            {formatCurrency(item.priceStart)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 flex items-center gap-0.5">
                          Đặt lịch <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/dichvu"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-800 hover:text-blue-600 font-bold text-sm rounded-xl transition shadow-xs"
            >
              <span>Xem tất cả dịch vụ và Lọc giá</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. ĐƠN VỊ ĐỐI TÁC UY TÍN TỪ CƠ SỞ DỮ LIỆU */}
      <section id="providers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Đối tác tiêu biểu
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Gian hàng đối tác hàng đầu
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Các doanh nghiệp và cơ sở vệ sinh được kiểm duyệt và có xếp hạng cao nhất sàn CleanMate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-blue-300 hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã xác thực
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-1.5">{s.name}</h3>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-400 stroke-none" />
                      <span className="ml-1 text-slate-800">{s.rating || 5.0}</span>
                    </div>
                    <span className="text-xs text-slate-400">({s.totalReviews || 0} đánh giá)</span>
                  </div>

                  {s.area && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{s.area}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {s._count?.services || 0} gói dịch vụ
                  </span>
                  <Link
                    href={`/dichvu?search=${encodeURIComponent(s.name)}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Xem dịch vụ <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. QUY TRÌNH 4 BƯỚC ĐƠN GIẢN */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Quy trình dễ dàng
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Đặt dịch vụ chỉ với 4 bước
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Trải nghiệm đặt lịch nhanh chóng, an toàn và hoàn toàn tiện lợi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-blue-300 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-black text-blue-600/20 group-hover:text-blue-600 transition mb-4">
                    {st.number}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{st.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CAM KẾT CHẤT LƯỢNG CLEANMATE */}
      <section id="guarantee" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Giá trị cốt lõi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Cam kết dịch vụ tại CleanMate
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Chúng tôi luôn đặt sự an tâm và trải nghiệm hài lòng của bạn lên hàng đầu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {commitments.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div key={idx} className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{c.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. ĐÁNH GIÁ CỦA KHÁCH HÀNG */}
      <section className="py-20 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Phản hồi thực tế
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Khách hàng nói gì về chúng tôi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div className="mb-6">
                  <div className="flex text-amber-400 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">{t.content}</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                    <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CALL TO ACTION BANNER */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Sẵn sàng để không gian sống luôn sạch bóng?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Hơn 50,000 lượt dọn dẹp đã hoàn thành xuất sắc. Đặt dịch vụ ngay hôm nay để nhận ưu đãi đặc biệt!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dichvu"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-600 font-extrabold text-sm rounded-xl hover:bg-blue-50 transition shadow-lg"
            >
              Khám Phá Dịch Vụ Ngay
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-700/60 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition border border-blue-400"
            >
              Đăng Ký Thành Viên
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Clean<span className="text-blue-400">Mate</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-4 text-slate-400">
              Nền tảng thương mại điện tử chuyên cung cấp dịch vụ dọn dẹp, vệ sinh công nghiệp và gia đình chuyên nghiệp.
            </p>
            <p className="text-xs text-slate-500">© 2026 CleanMate Inc. All rights reserved.</p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dichvu?category=ve-sinh-nha-o" className="hover:text-white transition">
                  Vệ sinh nhà ở toàn diện
                </Link>
              </li>
              <li>
                <Link href="/dichvu?category=ve-sinh-van-phong" className="hover:text-white transition">
                  Vệ sinh văn phòng
                </Link>
              </li>
              <li>
                <Link href="/dichvu?category=giat-sofa-nem" className="hover:text-white transition">
                  Giặt ghế sofa & nệm thảm
                </Link>
              </li>
              <li>
                <Link href="/dichvu?category=ve-sinh-may-lanh" className="hover:text-white transition">
                  Vệ sinh máy lạnh inverter
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition">
                  Quy trình đặt dịch vụ
                </a>
              </li>
              <li>
                <a href="#guarantee" className="hover:text-white transition">
                  Chính sách bảo hành 24h
                </a>
              </li>
              <li>
                <Link href="/dichvu" className="hover:text-white transition">
                  Bảng giá niêm yết
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Liên hệ</h4>
            <p className="text-xs text-slate-400 mb-2">Hotline: 1900 1234 (8:00 - 21:00)</p>
            <p className="text-xs text-slate-400 mb-2">Email: support@cleanmate.vn</p>
            <p className="text-xs text-slate-400">Địa chỉ: Tòa nhà TechHub, TP. Hồ Chí Minh</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
