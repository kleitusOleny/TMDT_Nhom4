"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateVN } from "@/src/lib/date-utils";
import Header from "@/src/components/Header";
import {
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  User,
  MessageSquare,
  Send,
  Reply,
  CornerDownRight,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";

interface PricingOption {
  id: string;
  title: string;
  sub: string;
  price: number;
  unit: string;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  images: string[] | string | null;
  createdAt: string;
  customer: {
    id: number;
    fullName: string | null;
    image?: string | null;
  };
}

interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string | null;
    role: string;
    image: string | null;
  };
  replies?: CommentItem[];
}

interface DichVuData {
  id: number;
  title: string;
  slug: string;
  description: string;
  details: string[];
  priceStart: number;
  pricingTable: PricingOption[];
  images: string[];
  rating: number;
  totalReviews: number;
  duration: string;
  serviceArea: string;
  shop: {
    id: number;
    name: string;
    slug: string;
    approvalStatus: string;
    rating: number;
    totalReviews: number;
    area: string | null;
  };
  reviews?: ReviewItem[];
  comments?: CommentItem[];
}

function DichVuContent({ serviceId }: { serviceId: string }) {
  const [dichVu, setDichVu] = useState<DichVuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab hiện tại: Mô tả chi tiết | Bảng giá | Đánh giá | Hỏi đáp
  const [activeTab, setActiveTab] = useState<"desc" | "pricing" | "reviews" | "comments">("desc");

  // Ảnh được chọn hiển thị lớn
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Bảng giá tùy chọn
  const router = useRouter();
  const [selectedPricingId, setSelectedPricingId] = useState<string>("");
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");

  const handleAddToCart = async (goToCheckout = false) => {
    if (!dichVu) return;
    try {
      setIsAddingCart(true);
      setBookingSuccessMsg("");

      let mainImg = "";
      if (dichVu.images && dichVu.images.length > 0) {
        mainImg = dichVu.images[0];
      }

      const cartItem = {
        id: String(Date.now()),
        serviceId: dichVu.id,
        title: dichVu.title,
        priceStart: currentOption ? currentOption.price : Number(dichVu.priceStart),
        image: mainImg,
        shopName: dichVu.shop.name,
        quantity: 1,
        scheduledDate: cleaningDate || new Date().toISOString().split("T")[0],
        workingTime: "09:00",
        note: currentOption ? currentOption.title : "",
      };

      // 1. Lưu vào localStorage để fallback tức thì
      let localCart = [];
      try {
        const raw = localStorage.getItem("cleanmate_cart");
        if (raw) localCart = JSON.parse(raw);
        if (!Array.isArray(localCart)) localCart = [];
      } catch {}
      localCart.push(cartItem);
      localStorage.setItem("cleanmate_cart", JSON.stringify(localCart));

      // 2. Đồng bộ lên API cart nếu đã login
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: dichVu.id,
            quantity: 1,
            scheduledDate: cleaningDate || null,
            note: currentOption ? currentOption.title : null,
          }),
        });
      } catch {}

      if (goToCheckout) {
        router.push("/checkout");
      } else {
        setBookingSuccessMsg("Đã thêm vào giỏ hàng thành công!");
        setTimeout(() => setBookingSuccessMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingCart(false);
    }
  };
  const [cleaningDate, setCleaningDate] = useState("");

  // Bình luận & Đặt câu hỏi
  const [newQuestion, setNewQuestion] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  const fetchDichVu = async () => {
    if (!serviceId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Gọi API lấy dịch vụ theo dynamic ID từ database
      const res = await fetch(`/api/dich-vu/${serviceId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || `Không tìm thấy dịch vụ #${serviceId}.`);
      }

      const data: DichVuData = json.data;
      setDichVu(data);

      if (data.images && data.images.length > 0) {
        setSelectedImage(data.images[0]);
      }

      if (data.pricingTable && data.pricingTable.length > 0) {
        setSelectedPricingId(data.pricingTable[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async (parentId?: number) => {
    setCommentError("");
    setCommentSuccess("");
    const content = parentId ? replyContent.trim() : newQuestion.trim();

    if (!content) {
      setCommentError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    try {
      setIsSubmittingComment(true);
      const res = await fetch(`/api/dich-vu/${serviceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể gửi bình luận.");
      }

      setCommentSuccess(data.message || "Gửi câu hỏi thành công!");
      if (parentId) {
        setReplyContent("");
        setReplyingCommentId(null);
      } else {
        setNewQuestion("");
      }

      // Tải lại dữ liệu bình luận mới
      const reloadRes = await fetch(`/api/dich-vu/${serviceId}`);
      const reloadJson = await reloadRes.json();
      if (reloadJson.success) {
        setDichVu(reloadJson.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi.";
      setCommentError(msg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    fetchDichVu();
  }, [serviceId]);

  const currentOption =
    dichVu?.pricingTable?.find((p) => p.id === selectedPricingId) ||
    dichVu?.pricingTable?.[0];

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return isNaN(num) ? "0đ" : new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-800">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-medium text-slate-600">Đang tải thông tin dịch vụ #{serviceId} từ cơ sở dữ liệu...</p>
      </div>
    );
  }

  if (error || !dichVu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-800 p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Không thể tải thông tin dịch vụ</h2>
        <p className="text-sm text-slate-500 mb-6">{error || "Dịch vụ không tồn tại trong cơ sở dữ liệu."}</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 transition"
        >
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* 1. HEADER CHUẨN */}
      <Header currentPath={`/dichvu/${serviceId}`} showSearchOrBooking={true} />

      {/* 2. BREADCRUMB */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/dichvu/1" className="hover:text-blue-600 transition">
            Dịch vụ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-blue-600">{dichVu.title}</span>
        </div>
      </div>

      {/* 3. MAIN CONTENT: 2 CỘT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CỘT TRÁI (7 CỘT) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Gallery ảnh từ Database */}
            <div className="space-y-4">
              <div className="relative w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
                <Image
                  src={selectedImage || dichVu.images[0]}
                  alt={dichVu.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Thumbnails từ Database */}
              <div className="flex gap-3">
                {dichVu.images.map((img, idx) => (
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

            {/* Thông tin nhà cung cấp & Tiêu đề dịch vụ từ Database */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-slate-800">
                  {dichVu.shop.name}
                </span>
                {dichVu.shop.approvalStatus === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã xác thực
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                {dichVu.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">{dichVu.rating}</span>
                <span className="text-slate-500">({dichVu.totalReviews} đánh giá)</span>
              </div>
            </div>

            {/* Tabs Điều hướng */}
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
                  Đánh giá ({dichVu.totalReviews})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("comments")}
                  className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "comments"
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hỏi đáp & Bình luận ({dichVu.comments?.length || 0})</span>
                </button>
              </nav>
            </div>

            {/* Nội dung Tab */}
            {activeTab === "desc" && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <p>{dichVu.description}</p>

                {dichVu.details && dichVu.details.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">
                      Dịch vụ bao gồm những gì?
                    </h3>
                    <ul className="space-y-2.5">
                      {dichVu.details.map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Chi tiết các gói bảng giá</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {dichVu.pricingTable?.map((opt) => (
                    <div key={opt.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{opt.title}</div>
                        <div className="text-xs text-slate-500">{opt.sub}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 text-base">{formatCurrency(opt.price)}</span>
                        <span className="text-xs text-slate-500">{opt.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Tổng quan xếp hạng */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="text-center sm:text-left">
                    <div className="text-5xl font-black text-blue-600">{dichVu.rating}</div>
                    <div className="flex text-amber-400 justify-center sm:justify-start mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(dichVu.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      {dichVu.reviews?.length || dichVu.totalReviews} đánh giá đã xác minh
                    </div>
                  </div>

                  <div className="flex-1 w-full border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-4 sm:pt-0 sm:pl-6 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>100% đánh giá đến từ khách hàng đã hoàn thành đơn dịch vụ trên hệ thống</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Được kiểm duyệt và đảm bảo tính trung thực bởi CleanMate</span>
                    </p>
                  </div>
                </div>

                {/* Danh sách đánh giá lấy từ Database */}
                <div className="space-y-4">
                  {!dichVu.reviews || dichVu.reviews.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-500">Chưa có đánh giá nào cho dịch vụ này.</p>
                    </div>
                  ) : (
                    dichVu.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {rev.customer?.fullName ? rev.customer.fullName[0].toUpperCase() : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">
                                {rev.customer?.fullName || "Khách hàng CleanMate"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <div className="flex text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < rev.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã sử dụng dịch vụ
                          </span>
                        </div>

                        {rev.comment && (
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2">
                            {rev.comment}
                          </p>
                        )}

                        {/* Hình ảnh đánh giá nếu có */}
                        {rev.images && (
                          <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                            {(Array.isArray(rev.images) ? rev.images : [rev.images]).map((imgSrc, imgIdx) => (
                              <div key={imgIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                <Image
                                  src={typeof imgSrc === "string" ? imgSrc : ""}
                                  alt="Ảnh phản hồi"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB HỎI ĐÁP & BÌNH LUẬN VỀ DỊCH VỤ */}
            {activeTab === "comments" && (
              <div className="space-y-6">
                {/* Form đặt câu hỏi mới */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Hỏi đáp về dịch vụ với {dichVu.shop.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Bạn có thắc mắc về quy trình, vật tư hay thời gian phục vụ? Đặt câu hỏi tại đây để được đối tác tư vấn và giải đáp chi tiết.
                  </p>

                  {commentError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{commentError}</span>
                    </div>
                  )}

                  {commentSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{commentSuccess}</span>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ví dụ: Dịch vụ này có hỗ trợ dọn vào cuối tuần không? Nhà có nuôi chó mèo thì cần chuẩn bị gì trước khi nhân viên đến?..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handlePostComment()}
                      disabled={isSubmittingComment || !newQuestion.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Gửi câu hỏi</span>
                    </button>
                  </div>
                </div>

                {/* Danh sách các câu hỏi & trả lời */}
                <div className="space-y-4">
                  {!dichVu.comments || dichVu.comments.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Chưa có câu hỏi nào</p>
                      <p className="text-xs text-slate-400 mt-1">Hãy là người đầu tiên đặt câu hỏi thắc mắc về dịch vụ này!</p>
                    </div>
                  ) : (
                    dichVu.comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                      >
                        {/* Header bình luận */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {cmt.user?.fullName ? cmt.user.fullName[0].toUpperCase() : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                  {cmt.user?.fullName || "Khách hàng"}
                                </h4>
                                {cmt.user?.role === "PROVIDER" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Đối tác
                                  </span>
                                )}
                                {cmt.user?.role === "ADMIN" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(cmt.createdAt).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReplyingCommentId(replyingCommentId === cmt.id ? null : cmt.id);
                              setReplyContent("");
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>Trả lời</span>
                          </button>
                        </div>

                        {/* Nội dung câu hỏi */}
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-12">
                          {cmt.content}
                        </p>

                        {/* Danh sách các câu trả lời (replies) nếu có */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="pl-12 space-y-2.5 pt-2">
                            {cmt.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="font-bold text-xs text-slate-900">
                                    {rep.user?.fullName || "Phản hồi"}
                                  </span>
                                  {rep.user?.role === "PROVIDER" && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      Nhà cung cấp
                                    </span>
                                  )}
                                  {rep.user?.role === "ADMIN" && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                      Admin
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 ml-auto">
                                    {new Date(rep.createdAt).toLocaleDateString("vi-VN", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 pl-5 leading-relaxed">{rep.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ô nhập câu trả lời khi nhấn Trả lời */}
                        {replyingCommentId === cmt.id && (
                          <div className="pl-12 pt-2 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Viết câu trả lời hoặc phản hồi..."
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handlePostComment(cmt.id)}
                                disabled={isSubmittingComment || !replyContent.trim()}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition disabled:opacity-50"
                              >
                                {isSubmittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                <span>Gửi</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: BẢNG GIÁ & ĐẶT DỊCH VỤ TỪ DATABASE (5 CỘT) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-2xl border-2 border-dashed border-blue-400 p-6 sm:p-7 bg-white shadow-sm space-y-6">
              {/* Giá chỉ từ */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Giá chỉ từ</span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                    {formatCurrency(dichVu.priceStart)}
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
                  {dichVu.pricingTable?.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedPricingId(opt.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        selectedPricingId === opt.id
                          ? "bg-blue-50/70 text-blue-700 font-medium"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{opt.title}</div>
                        <div className="text-[11px] text-slate-500">{opt.sub}</div>
                      </div>
                      <div className="font-extrabold text-blue-600 text-right">
                        {formatCurrency(opt.price)}
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
                    value={selectedPricingId}
                    onChange={(e) => setSelectedPricingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {dichVu.pricingTable?.map((opt) => (
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
                    {currentOption ? formatCurrency(currentOption.price) : "0đ"}
                  </span>
                </div>

                {bookingSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bookingSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  {/* Nút Đặt dịch vụ ngay -> chuyển hướng đến trang thanh toán */}
                  <button
                    type="button"
                    disabled={isAddingCart}
                    onClick={() => handleAddToCart(true)}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAddingCart ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Đặt dịch vụ ngay</span>
                      </>
                    )}
                  </button>

                  {/* Nút Thêm vào giỏ hàng */}
                  <button
                    type="button"
                    disabled={isAddingCart}
                    onClick={() => handleAddToCart(false)}
                    className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Thêm vào giỏ hàng</span>
                  </button>
                </div>
              </div>

              {/* Thông tin phụ trợ từ Database */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Thời gian thực hiện: {dichVu.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Khu vực phục vụ: {dichVu.serviceArea}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DichVuParamsResolver({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  return <DichVuContent serviceId={unwrappedParams.id} />;
}

export default function DichVuDynamicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-800">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-sm font-medium text-slate-600">Đang tải chi tiết dịch vụ...</p>
        </div>
      }
    >
      <DichVuParamsResolver params={params} />
    </React.Suspense>
  );
}
