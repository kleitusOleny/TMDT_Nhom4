"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function DichVuDetailPage() {
  // Tab hiện tại: Mô tả chi tiết | Bảng giá | Đánh giá
  const [activeTab, setActiveTab] = useState<"desc" | "pricing" | "reviews">("desc");

  // Ảnh được chọn hiển thị lớn
  const images = [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1200&q=80",
  ];
  const [selectedImage, setSelectedImage] = useState(images[0]);

  // Bảng giá tùy chọn
  const pricingOptions = [
    {
      id: "fixed",
      title: "Giá cố định",
      sub: "Dưới 50m²",
      price: "250.000đ",
      unit: "/lần",
      numericPrice: 250000,
    },
    {
      id: "sqm",
      title: "Giá theo m²",
      sub: "Từ 50m² trở lên",
      price: "15.000đ",
      unit: "/m²",
      numericPrice: 15000,
    },
    {
      id: "hourly",
      title: "Giá theo giờ",
      sub: "Tối thiểu 3 tiếng",
      price: "120.000đ",
      unit: "/giờ",
      numericPrice: 120000,
    },
    {
      id: "monthly",
      title: "Gói trọn gói",
      sub: "Tháng (4 lần dọn)",
      price: "1.500.000đ",
      unit: "/tháng",
      numericPrice: 1500000,
    },
  ];

  const [selectedPricingType, setSelectedPricingType] = useState(pricingOptions[0].id);
  const [cleaningDate, setCleaningDate] = useState("");

  const currentOption = pricingOptions.find((p) => p.id === selectedPricingType) || pricingOptions[0];

  const serviceChecklist = [
    "Lau dọn phòng khách: Hút bụi sofa, lau kệ TV, bàn trà, quét màng nhện trần nhà.",
    "Vệ sinh phòng ngủ: Thay ga trải giường (nếu có yêu cầu), quét bụi gầm giường, lau tủ quần áo.",
    "Làm sạch nhà bếp: Khử dầu mỡ bếp gas/bếp từ, lau chùi bồn rửa, lau bên ngoài tủ lạnh, lò vi sóng.",
    "Chà rửa nhà tắm: Tẩy sạch cặn bám gương, kính buồng tắm, khử trùng bồn cầu, chà sàn gạch toilet.",
    "Hút bụi và lau sàn toàn bộ căn nhà bằng dung dịch hương thơm tự nhiên dễ chịu.",
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* 1. HEADER CHUẨN */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Clean<span className="text-blue-600">Mate</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">
              Trang chủ
            </Link>
            <Link href="/dich-vu" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Dịch vụ
            </Link>
            <Link href="/#providers" className="hover:text-blue-600 transition">
              Đối tác vệ sinh
            </Link>
            <Link href="/#guarantee" className="hover:text-blue-600 transition">
              Về chúng tôi
            </Link>
            <Link href="#" className="hover:text-blue-600 transition">
              Hỗ trợ
            </Link>
          </nav>

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
            <button className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition items-center gap-1.5 cursor-pointer">
              Đặt dịch vụ
            </button>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/dich-vu" className="hover:text-blue-600 transition">
            Dịch vụ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-blue-600">Vệ sinh nhà ở toàn diện</span>
        </div>
      </div>

      {/* 3. MAIN CONTENT: 2 CỘT (Cột trái: Thông tin dịch vụ & Gallery, Cột phải: Khối đặt & Báo giá) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CỘT TRÁI (7 CỘT) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Gallery ảnh */}
            <div className="space-y-4">
              <div className="relative w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
                <Image
                  src={selectedImage}
                  alt="Vệ sinh nhà ở toàn diện"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-24 sm:w-28 h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      selectedImage === img
                        ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Thông tin nhà cung cấp & Tiêu đề dịch vụ */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-slate-800">
                  Công ty TNHH Vệ sinh Sạch Bóng
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã xác minh
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                Dịch vụ vệ sinh nhà ở toàn diện
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">4.8</span>
                <span className="text-slate-500">(256 đánh giá)</span>
              </div>
            </div>

            {/* Tabs Điều hướng: Mô tả chi tiết | Bảng giá | Đánh giá */}
            <div className="border-b border-slate-200">
              <nav className="flex gap-8 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("desc")}
                  className={`pb-3 border-b-2 transition cursor-pointer ${
                    activeTab === "desc"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mô tả chi tiết
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pricing")}
                  className={`pb-3 border-b-2 transition cursor-pointer ${
                    activeTab === "pricing"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Bảng giá
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-3 border-b-2 transition cursor-pointer ${
                    activeTab === "reviews"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Đánh giá (256)
                </button>
              </nav>
            </div>

            {/* Nội dung Tab */}
            {activeTab === "desc" && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <p>
                  Dịch vụ vệ sinh nhà ở toàn diện của Sạch Bóng cung cấp giải pháp làm sạch sâu mọi
                  ngóc ngách căn nhà của bạn. Chúng tôi sử dụng các máy móc hiện đại và hóa chất làm
                  sạch thân thiện với môi trường, không độc hại cho trẻ nhỏ và vật nuôi. Đội ngũ nhân
                  viên tận tâm, lý lịch rõ ràng đảm bảo sự hài lòng tuyệt đối cho bạn.
                </p>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    Dịch vụ bao gồm những gì?
                  </h3>
                  <ul className="space-y-2.5">
                    {serviceChecklist.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Chi tiết các gói bảng giá</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {pricingOptions.map((opt) => (
                    <div key={opt.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{opt.title}</div>
                        <div className="text-xs text-slate-500">{opt.sub}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 text-base">{opt.price}</span>
                        <span className="text-xs text-slate-500">{opt.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-4xl font-extrabold text-blue-600">4.8</div>
                  <div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Dựa trên 256 đánh giá đã xác thực</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Hoàng Thuỳ Linh</span>
                      <span className="text-xs text-slate-400">2 ngày trước</span>
                    </div>
                    <p className="text-xs text-slate-600">Nhân viên làm việc rất tỉ mỉ, sàn nhà và bếp bóng loáng sạch sẽ. Sẽ tiếp tục đặt lại!</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Vũ Minh Đức</span>
                      <span className="text-xs text-slate-400">1 tuần trước</span>
                    </div>
                    <p className="text-xs text-slate-600">Đúng giờ, mang đầy đủ thiết bị và nước tẩy rửa chuyên dụng an toàn cho nhà có em bé.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: BẢNG GIÁ & ĐẶT DỊCH VỤ (5 CỘT) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-2xl border-2 border-dashed border-blue-400 p-6 sm:p-7 bg-white shadow-sm space-y-6">
              {/* Giá chỉ từ */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Giá chỉ từ</span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                    250.000đ
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/lần</span>
                </div>
              </div>

              {/* Bảng giá dịch vụ cụ thể */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Bảng giá dịch vụ cụ thể
                </h4>
                <div className="space-y-3 text-xs sm:text-sm">
                  {pricingOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedPricingType(opt.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        selectedPricingType === opt.id
                          ? "bg-blue-50/70 text-blue-700 font-medium"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{opt.title}</div>
                        <div className="text-[11px] text-slate-500">{opt.sub}</div>
                      </div>
                      <div className="font-extrabold text-blue-600 text-right">
                        {opt.price}
                        <span className="text-[11px] font-normal text-slate-500 ml-0.5">
                          {opt.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form tùy chọn tính giá */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                {/* Chọn hình thức */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    HÌNH THỨC TÍNH GIÁ
                  </label>
                  <select
                    value={selectedPricingType}
                    onChange={(e) => setSelectedPricingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {pricingOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.title} ({opt.sub})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn ngày dọn dẹp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    CHỌN NGÀY DỌN DẸP
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={cleaningDate}
                      onChange={(e) => setCleaningDate(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Tổng tạm tính */}
                <div className="pt-2 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-800">Tổng tạm tính:</span>
                  <span className="text-2xl font-black text-blue-600">
                    {currentOption.price}
                  </span>
                </div>

                {/* Nút đặt dịch vụ ngay */}
                <button
                  type="button"
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Đặt dịch vụ ngay
                </button>
              </div>

              {/* Thông tin phụ trợ */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Thời gian thực hiện: 2-4 giờ</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Khu vực phục vụ: Quận 1, 2, 3, 7, Thủ Đức</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
