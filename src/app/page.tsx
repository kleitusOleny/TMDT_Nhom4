"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Home,
  Building2,
  Factory,
  Layers,
  Sparkle,
  Fan,
} from "lucide-react";

export default function CleanMateHome() {
  const [selectedService, setSelectedService] = useState("Vệ sinh nhà ở");
  const [location, setLocation] = useState("TP. Hồ Chí Minh");
  const [bookingDate, setBookingDate] = useState("");

  const services = [
    {
      id: "home",
      title: "Vệ sinh nhà ở",
      desc: "Dọn dẹp phòng khách, bếp, phòng ngủ, nhà vệ sinh toàn diện theo giờ hoặc định kỳ.",
      price: "từ 80.000đ/giờ",
      icon: Home,
      tag: "Phổ biến",
    },
    {
      id: "office",
      title: "Vệ sinh văn phòng",
      desc: "Duy trì không gian làm việc sạch sẽ, thoáng đãng, nâng cao hiệu suất doanh nghiệp.",
      price: "từ 120.000đ/giờ",
      icon: Building2,
      tag: "Doanh nghiệp",
    },
    {
      id: "industrial",
      title: "Vệ sinh sau xây dựng",
      desc: "Làm sạch bụi bẩn thô & tinh, tẩy vết sơn, xi măng mang lại căn nhà hoàn hảo trước khi dọn vào.",
      price: "từ 15.000đ/m²",
      icon: Factory,
      tag: "Chuyên sâu",
    },
    {
      id: "sofa",
      title: "Giặt sofa & nệm thảm",
      desc: "Công nghệ phun hút diệt khuẩn 99.9%, khử mùi hôi, nấm mốc sâu trong sợi vải.",
      price: "từ 250.000đ/bộ",
      icon: Layers,
      tag: "Diệt khuẩn",
    },
    {
      id: "glass",
      title: "Vệ sinh kính & mặt ngoài",
      desc: "Đu dây lau kính mặt ngoài cao ốc, lau cửa kính ban công trong và ngoài sạch bóng.",
      price: "từ 20.000đ/m²",
      icon: Sparkle,
      tag: "Chuyên nghiệp",
    },
    {
      id: "ac",
      title: "Vệ sinh máy lạnh",
      desc: "Tháo rửa xịt dàn lạnh, dàn nóng, bảo dưỡng kiểm tra gas giúp làm lạnh sâu và tiết kiệm điện.",
      price: "từ 150.000đ/máy",
      icon: Fan,
      tag: "Tiết kiệm điện",
    },
  ];

  const providers = [
    {
      name: "Công ty TNHH CleanPro",
      verified: true,
      rating: 4.9,
      reviews: 1250,
      area: "Quận 1, 3, Bình Thạnh (TP.HCM)",
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Dịch vụ Vệ sinh Sài Gòn Xanh",
      verified: true,
      rating: 4.8,
      reviews: 980,
      area: "Quận 7, Nhà Bè, Quận 4",
      image:
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "CleanPlus Việt Nam",
      verified: true,
      rating: 4.9,
      reviews: 1420,
      area: "Tân Bình, Phú Nhuận, Gò Vấp",
      image:
        "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Người Giúp Việc Tận Tâm",
      verified: true,
      rating: 4.7,
      reviews: 730,
      area: "TP. Thủ Đức, Quận 2, Quận 9",
      image:
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Chọn dịch vụ",
      desc: "Lựa chọn gói dịch vụ dọn dẹp phù hợp với nhu cầu và diện tích của bạn.",
    },
    {
      number: "02",
      title: "Đặt lịch trực tuyến",
      desc: "Chọn ngày giờ, địa điểm và các yêu cầu bổ sung chỉ trong 60 giây.",
    },
    {
      number: "03",
      title: "Nhân viên thực hiện",
      desc: "Đội ngũ chuyên nghiệp đến đúng giờ, mang đầy đủ trang thiết bị và hóa chất chuẩn.",
    },
    {
      number: "04",
      title: "Đánh giá & nghiệm thu",
      desc: "Kiểm tra sự hài lòng, thanh toán linh hoạt và đánh giá chất lượng phục vụ.",
    },
  ];

  const commitments = [
    {
      icon: ShieldCheck,
      title: "Đối tác được xác thực",
      desc: "Hồ sơ lý lịch rõ ràng, kỹ năng nghiệp vụ được đào tạo bài bản và kiểm tra định kỳ.",
    },
    {
      icon: CheckCircle2,
      title: "Hài lòng 100%",
      desc: "Bảo hành dịch vụ dọn lại miễn phí nếu quý khách chưa hài lòng trong vòng 24h.",
    },
    {
      icon: DollarSign,
      title: "Giá minh bạch, rõ ràng",
      desc: "Báo giá trọn gói niêm yết, cam kết không phát sinh chi phí phụ vô lý.",
    },
    {
      icon: Headphones,
      title: "Hỗ trợ 24/7",
      desc: "Tổng đài viên luôn túc trực hỗ trợ giải quyết thắc mắc và sự cố nhanh chóng.",
    },
    {
      icon: Sparkles,
      title: "Trang thiết bị hiện đại",
      desc: "Sử dụng máy móc chuyên dụng cùng hóa chất an toàn đạt chuẩn thân thiện môi trường.",
    },
    {
      icon: Award,
      title: "Nhanh chóng & đúng giờ",
      desc: "Đáp ứng lịch đặt trong vòng 60 phút, nhân viên luôn đến đúng giờ hẹn đã xác nhận.",
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
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Clean<span className="text-blue-600">Mate</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Trang chủ
            </Link>
            <Link href="#services" className="hover:text-blue-600 transition">
              Dịch vụ
            </Link>
            <Link href="#providers" className="hover:text-blue-600 transition">
              Đơn vị đối tác
            </Link>
            <Link href="#how-it-works" className="hover:text-blue-600 transition">
              Quy trình
            </Link>
            <Link href="#guarantee" className="hover:text-blue-600 transition">
              Về chúng tôi
            </Link>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition"
            >
              Đăng ký
            </Link>
            <a
              href="#booking-box"
              className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition items-center gap-1.5"
            >
              Đặt dịch vụ
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 bg-gradient-to-b from-blue-50/60 via-slate-50/30 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Giải pháp vệ sinh tiêu chuẩn cao
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
                Dịch vụ vệ sinh chuyên nghiệp <span className="text-blue-600">tại nhà</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
                Giải pháp toàn diện cho tổ ấm và văn phòng bạn. Đặt nhanh qua mạng, đối tác uy tín được xác minh, cam kết hoàn tiền 100% nếu không hài lòng.
              </p>

              {/* Booking Quick Form Bar */}
              <div
                id="booking-box"
                className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200 max-w-2xl mb-10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  {/* Select Service */}
                  <div className="px-3 py-1.5">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Loại dịch vụ
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Vệ sinh nhà ở">Vệ sinh nhà ở</option>
                      <option value="Vệ sinh văn phòng">Vệ sinh văn phòng</option>
                      <option value="Vệ sinh sau xây dựng">Sau xây dựng</option>
                      <option value="Giặt sofa & nệm thảm">Giặt sofa / nệm</option>
                      <option value="Vệ sinh máy lạnh">Vệ sinh máy lạnh</option>
                    </select>
                  </div>

                  {/* Select Location */}
                  <div className="px-3 py-1.5">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
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

                  {/* Date & Button */}
                  <div className="px-3 py-1.5 flex flex-col justify-between">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Thời gian
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

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                  <button className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" />
                    Tìm kiếm & Đặt lịch
                  </button>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-6 pt-4 max-w-lg border-t border-slate-200/60">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">10,000+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Khách hàng tin dùng</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">500+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Đối tác chuyên nghiệp</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">50,000+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Lượt dọn dẹp hoàn thành</div>
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
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cam kết an toàn tuyệt đối</h4>
                    <p className="text-xs text-slate-600">Nhân viên có bảo hiểm & hồ sơ xác thực 100%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DỊCH VỤ NỔI BẬT */}
      <section id="services" className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Dịch vụ của chúng tôi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Giải pháp làm sạch toàn diện
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Tùy chỉnh đa dạng gói dịch vụ phù hợp với ngân sách và mong muốn cụ thể của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">{item.desc}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-600">{item.price}</span>
                    <a
                      href="#booking-box"
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      Đặt ngay <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. ĐƠN VỊ UY TÍN HÀNG ĐẦU */}
      <section id="providers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Đối tác nổi bật
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Đơn vị uy tín hàng đầu
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Các đối tác đạt chuẩn xếp hạng 4.8★ trở lên, được khách hàng đánh giá thực tế cao nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers.map((p, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                      Đã xác minh
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1">{p.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-4 h-4 fill-amber-400 stroke-none" />
                        <span className="ml-1 text-slate-800">{p.rating}</span>
                      </div>
                      <span className="text-xs text-slate-400">({p.reviews} đánh giá)</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{p.area}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <a
                    href="#booking-box"
                    className="w-full block text-center py-2.5 px-4 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition"
                  >
                    Xem chi tiết & Đặt
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. QUY TRÌNH 4 BƯỚC ĐƠN GIẢN */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Cách thức hoạt động
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Quy trình 4 bước đơn giản
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Trải nghiệm đặt lịch nhanh chóng, tiện lợi, không mất thời gian chờ đợi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => (
              <div
                key={i}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm relative group hover:border-blue-300 transition"
              >
                <div className="text-3xl font-black text-blue-600/20 group-hover:text-blue-600 transition mb-4">
                  {st.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{st.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CAM KẾT CHẤT LƯỢNG VƯỢT TRỘI */}
      <section id="guarantee" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Vì sao chọn CleanMate
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Cam kết chất lượng dịch vụ vượt trội
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Đặt lợi ích, sự an tâm và trải nghiệm sạch sẽ của khách hàng lên hàng đầu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {commitments.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-slate-50 transition">
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

      {/* 7. ĐÁNH GIÁ KHÁCH HÀNG (TESTIMONIALS) */}
      <section className="py-20 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Đánh giá từ khách hàng
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Hơn 10,000 + niềm tin trao gửi
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Lắng nghe cảm nhận thực tế từ những gia đình và doanh nghiệp đã đồng hành cùng CleanMate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed mb-6">{t.content}</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION (CTA BANNER) */}
      <section className="py-16 bg-blue-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Đặt dịch vụ vệ sinh ngay hôm nay
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Nhận ưu đãi giảm ngay 15% cho lần đầu tiên trải nghiệm với mã code <span className="font-bold underline text-white">CLEAN15</span>.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nhập số điện thoại để tư vấn nhanh..."
              className="px-4 py-3 rounded-xl bg-white text-slate-900 text-sm outline-none grow placeholder:text-slate-400"
            />
            <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition shrink-0 shadow-lg">
              Tư vấn miễn phí
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-sm py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Clean<span className="text-blue-400">Mate</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
              Nền tảng kết nối dịch vụ vệ sinh và dọn dẹp hàng đầu. Chúng tôi cung cấp các gói dịch vụ chất lượng cao, an toàn và tiện lợi cho mọi gia đình & doanh nghiệp.
            </p>
            <div className="text-xs space-y-1.5 text-slate-400">
              <p>Hotline: 1900 6868 (8:00 - 21:00)</p>
              <p>Email: contact@cleanmate.vn</p>
            </div>
          </div>

          {/* Column Dịch vụ */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#services" className="hover:text-white transition">Vệ sinh nhà ở</a></li>
              <li><a href="#services" className="hover:text-white transition">Vệ sinh văn phòng</a></li>
              <li><a href="#services" className="hover:text-white transition">Vệ sinh sau xây dựng</a></li>
              <li><a href="#services" className="hover:text-white transition">Giặt sofa & nệm</a></li>
              <li><a href="#services" className="hover:text-white transition">Vệ sinh máy lạnh</a></li>
              <li><a href="#services" className="hover:text-white transition">Tổng vệ sinh</a></li>
            </ul>
          </div>

          {/* Column Hỗ trợ */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-white transition">Chính sách giá cả</a></li>
              <li><a href="#" className="hover:text-white transition">Quy trình hoàn tiền</a></li>
              <li><a href="#" className="hover:text-white transition">Tiêu chuẩn an toàn</a></li>
              <li><a href="#" className="hover:text-white transition">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          {/* Column Về chúng tôi */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Về chúng tôi</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-white transition">Tuyển dụng đối tác</a></li>
              <li><a href="#" className="hover:text-white transition">Tin tức & Mẹo hay</a></li>
              <li><a href="#" className="hover:text-white transition">Đối tác doanh nghiệp</a></li>
              <li><a href="#" className="hover:text-white transition">Liên hệ hợp tác</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CleanMate Corporation. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-400 transition">Điều khoản dịch vụ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
