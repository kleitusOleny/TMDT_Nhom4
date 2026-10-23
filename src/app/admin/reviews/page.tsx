"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import {
  Star,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Trash2,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Clock,
  X,
  Smile,
  Frown,
  Tag,
  UserCheck,
} from "lucide-react";
import { formatDateTimeVN } from "@/src/lib/date-utils";

export interface AspectSentimentItem {
  aspect: string; // Ví dụ: "Chất lượng làm sạch", "Thái độ nhân viên", "Đúng giờ", "Giá cả"
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  confidence?: number;
  highlightText?: string;
}

export interface ReviewAdminItem {
  id: number;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  customer: {
    id: number;
    fullName: string;
    phone: string;
    email: string | null;
    image: string | null;
  };
  service: {
    id: number;
    title: string;
    image: string;
    shopId: number;
    shopName: string;
  };
  booking: {
    id: number;
    bookingCode: string;
    scheduledDate: string;
    totalPrice: number;
    cleaner?: {
      id: number;
      fullName: string;
      phone: string;
      email: string | null;
      image: string | null;
    } | null;
  };
  aspectSentiments: AspectSentimentItem[];
}

export default function AdminReviewsPage() {
  const { viewMode, selectedSellerId, shopsList, showToast } = useAdmin();

  const [reviewsList, setReviewsList] = useState<ReviewAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sắp xếp
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal chi tiết bình luận & Phân loại cảm xúc theo khía cạnh
  const [selectedReview, setSelectedReview] = useState<ReviewAdminItem | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // Hàm kích hoạt phân tích AI theo khía cạnh khi người dùng bấm nút
  const handleAnalyzeSentimentAI = async () => {
    if (!selectedReview || isAnalyzingAI) return;

    try {
      setIsAnalyzingAI(true);
      const res = await fetch("/api/admin/reviews/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedReview.comment }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.predictions) && data.predictions.length > 0) {
        const updated: ReviewAdminItem = {
          ...selectedReview,
          aspectSentiments: data.predictions,
        };
        setSelectedReview(updated);
        setReviewsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        showToast("Phân tích cảm xúc theo khía cạnh thành công!");
      } else {
        showToast(data.message || "Không tìm thấy khía cạnh phù hợp");
      }
    } catch (err) {
      console.error("Lỗi phân tích cảm xúc khía cạnh:", err);
      showToast("Có lỗi xảy ra khi gọi AI phân tích");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Mở modal xem chi tiết bình luận
  const handleSelectReviewWithAI = (review: ReviewAdminItem) => {
    setSelectedReview(review);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let shopParam = "";
      if (viewMode === "SELLER") {
        shopParam = `&sellerId=${selectedSellerId}`;
      } else if (shopFilter !== "ALL") {
        shopParam = `&sellerId=${shopFilter}`;
      }

      const res = await fetch(
        `/api/admin/reviews?rating=${ratingFilter}&q=${encodeURIComponent(
          searchQuery
        )}${shopParam}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.reviews)) {
        setReviewsList(json.reviews);
      }
    } catch (e) {
      console.error("Lỗi tải đánh giá:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchReviews();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viewMode, selectedSellerId, ratingFilter, shopFilter, searchQuery]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedReviews = [...reviewsList].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "customer":
        aVal = a.customer.fullName.toLowerCase();
        bVal = b.customer.fullName.toLowerCase();
        break;
      case "service":
        aVal = a.service.title.toLowerCase();
        bVal = b.service.title.toLowerCase();
        break;
      case "rating":
        aVal = a.rating;
        bVal = b.rating;
        break;
      case "createdAt":
      default:
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleDeleteReview = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Đã xóa đánh giá thành công!");
        setReviewsList((prev) => prev.filter((r) => r.id !== id));
        if (selectedReview?.id === id) setSelectedReview(null);
      } else {
        showToast(json.message || "Xóa đánh giá thất bại");
      }
    } catch (e) {
      console.error(e);
      showToast("Có lỗi xảy ra khi xóa");
    }
  };



  // Thống kê nhanh
  const totalReviews = reviewsList.length;
  const avgRating = totalReviews > 0 ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const fiveStarsCount = reviewsList.filter((r) => r.rating === 5).length;
  const lowRatingCount = reviewsList.filter((r) => r.rating <= 3).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards nhanh về Đánh giá */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng đánh giá</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalReviews}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm trung bình</div>
            <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hài lòng (5 sao)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{fiveStarsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Smile className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cần cải thiện (≤ 3 sao)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{lowRatingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Frown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Tìm kiếm */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo nội dung, tên khách, tên dịch vụ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 transition"
          />
        </div>

        {/* Lọc theo sao & Shop */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {viewMode === "ADMIN" && (
            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả gian hàng đối tác</option>
              {shopsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả số sao</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
            <option value="4">⭐⭐⭐⭐ (4 sao)</option>
            <option value="3">⭐⭐⭐ (3 sao)</option>
            <option value="2">⭐⭐ (2 sao)</option>
            <option value="1">⭐ (1 sao)</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách bình luận đánh giá */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort("customer")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Khách hàng</span>
                    {sortField === "customer" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("service")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Dịch vụ & Shop</span>
                    {sortField === "service" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("rating")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Đánh giá</span>
                    {sortField === "rating" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="px-6 py-3.5">Nội dung bình luận</th>

                <th className="px-6 py-3.5">
                  <div className="flex items-center gap-1 text-indigo-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cảm xúc khía cạnh</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Thời gian</span>
                    {sortField === "createdAt" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span>Đang tải danh sách bình luận & đánh giá...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedReviews.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleSelectReviewWithAI(item)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    {/* Khách hàng */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {item.customer.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {item.customer.phone || item.customer.email || "---"}
                      </div>
                    </td>

                    {/* Dịch vụ & Shop */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 line-clamp-1 max-w-[220px]">
                        {item.service.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {item.service.shopName}
                      </div>
                    </td>

                    {/* Số sao */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              item.rating >= s ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                        {item.rating}.0 / 5.0
                      </span>
                    </td>

                    {/* Nội dung bình luận */}
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 max-w-sm text-slate-700 italic">
                        &quot;{item.comment}&quot;
                      </p>
                    </td>

                    {/* Cảm xúc khía cạnh (Tạm thời để trống) */}
                    <td className="px-6 py-4">
                      {item.aspectSentiments && item.aspectSentiments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.aspectSentiments.map((asp, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                asp.sentiment === "POSITIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : asp.sentiment === "NEGATIVE"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {asp.aspect}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic bg-slate-100/70 px-2.5 py-1 rounded-lg border border-dashed border-slate-200">
                          (Chưa phân loại)
                        </span>
                      )}
                    </td>

                    {/* Thời gian */}
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTimeVN(item.createdAt)}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedReview(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          Chi tiết
                        </button>
                        {viewMode === "ADMIN" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Xóa đánh giá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT BÌNH LUẬN & PHÂN LOẠI CẢM XÚC THEO KHÍA CẠNH */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-lg">Chi tiết bình luận & đánh giá</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    #{selectedReview.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Đăng lúc: {formatDateTimeVN(selectedReview.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin dịch vụ & Đơn hàng */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                {selectedReview.service.image ? (
                  <img
                    src={selectedReview.service.image}
                    alt={selectedReview.service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="grow">
                <div className="font-extrabold text-slate-900 text-sm">{selectedReview.service.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Gian hàng: <strong className="text-slate-700">{selectedReview.service.shopName}</strong>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Mã đơn liên kết: #{selectedReview.booking.bookingCode} • Giá trị:{" "}
                  {selectedReview.booking.totalPrice.toLocaleString()}đ
                </div>

                {/* Người thực hiện đơn hàng (Cleaner / Thợ) */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Người thực hiện:</span>
                  </div>
                  {selectedReview.booking.cleaner ? (
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg">
                      <span className="font-bold text-xs text-emerald-800">
                        {selectedReview.booking.cleaner.fullName}
                      </span>
                      {selectedReview.booking.cleaner.phone && (
                        <span className="text-[11px] text-emerald-600 font-mono">
                          ({selectedReview.booking.cleaner.phone})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Chưa chỉ định nhân viên thực hiện
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nội dung khách hàng viết & số sao */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                    {selectedReview.customer.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{selectedReview.customer.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{selectedReview.customer.phone || selectedReview.customer.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        selectedReview.rating >= s ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="font-black text-xs text-amber-700 ml-1">({selectedReview.rating}.0)</span>
                </div>
              </div>

              <div className="text-sm text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-amber-100">
                &quot;{selectedReview.comment}&quot;
              </div>

              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">Ảnh đính kèm từ khách hàng:</div>
                  <div className="flex gap-2">
                    {selectedReview.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 block">
                        <img src={img} alt={`Review img ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PHÂN LOẠI CẢM XÚC THEO KHÍA CẠNH (ASPECT-BASED SENTIMENT) */}
            <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Phân loại cảm xúc theo khía cạnh (Aspect-Based Sentiment)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeSentimentAI}
                  disabled={isAnalyzingAI}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {isAnalyzingAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Phân tích</span>
                    </>
                  )}
                </button>
              </div>

              {/* Danh sách khía cạnh đã phân loại */}
              {selectedReview.aspectSentiments && selectedReview.aspectSentiments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedReview.aspectSentiments.map((asp, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between"
                    >
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{asp.aspect}</span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          asp.sentiment === "POSITIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : asp.sentiment === "NEGATIVE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {asp.sentiment === "POSITIVE" && "TÍCH CỰC"}
                        {asp.sentiment === "NEGATIVE" && "TIÊU CỰC"}
                        {asp.sentiment === "NEUTRAL" && "TRUNG TÍNH"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white/80 rounded-xl border border-dashed border-indigo-200 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-indigo-900">
                    Chưa có phân loại cảm xúc
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {/*Bạn có thể gán nhãn các khía cạnh (như Chất lượng làm sạch, Thái độ nhân viên, Giá cả, Đúng giờ) bên dưới để hỗ trợ người bán tối ưu dịch vụ.*/}
                  </p>
                </div>
              )}

              {/* Form gán nhãn khía cạnh mới */}
              {/*<div className="pt-2 border-t border-indigo-100/80">*/}
              {/*  <div className="text-xs font-bold text-slate-700 mb-2">Thêm khía cạnh cảm xúc:</div>*/}
              {/*  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">*/}
              {/*    <input*/}
              {/*      type="text"*/}
              {/*      value={newAspect}*/}
              {/*      onChange={(e) => setNewAspect(e.target.value)}*/}
              {/*      placeholder="Khía cạnh (vd: Chất lượng, Thái độ, Giá...)"*/}
              {/*      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600"*/}
              {/*    />*/}
              {/*    <select*/}
              {/*      value={newSentiment}*/}
              {/*      onChange={(e) => setNewSentiment(e.target.value as "POSITIVE" | "NEUTRAL" | "NEGATIVE")}*/}
              {/*      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600 font-medium"*/}
              {/*    >*/}
              {/*      <option value="POSITIVE">Tích cực (Positive)</option>*/}
              {/*      <option value="NEUTRAL">Trung tính (Neutral)</option>*/}
              {/*      <option value="NEGATIVE">Tiêu cực (Negative)</option>*/}
              {/*    </select>*/}
              {/*    <button*/}
              {/*      type="button"*/}
              {/*      onClick={handleAddAspectSentiment}*/}
              {/*      disabled={!newAspect.trim()}*/}
              {/*      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"*/}
              {/*    >*/}
              {/*      <Plus className="w-4 h-4" />*/}
              {/*      <span>Gán nhãn</span>*/}
              {/*    </button>*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
