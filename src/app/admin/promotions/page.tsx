"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import {
  TicketPercent,
  Plus,
  Search,
  Sparkles,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Power,
  Percent,
} from "lucide-react";
import { formatDateVN } from "@/src/lib/date-utils";

export interface PromotionAdminItem {
  id: number;
  code: string;
  title: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  status: "ACTIVE" | "EXPIRED" | "PAUSED" | "UPCOMING";
  scope: "GLOBAL" | "SHOP";
  shopId: number | null;
  shopName: string | null;
  createdAt: string;
}

export default function AdminPromotionsPage() {
  const { viewMode, selectedSellerId, shopsList, showToast, isProviderOnly } = useAdmin();

  const [promotions, setPromotions] = useState<PromotionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sắp xếp
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal tạo mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMinOrderValue, setFormMinOrderValue] = useState("0");
  const [formMaxDiscount, setFormMaxDiscount] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formScope, setFormScope] = useState<"GLOBAL" | "SHOP">("GLOBAL");
  const [formShopId, setFormShopId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      if (viewMode === "SELLER") {
        params.append("shopId", String(selectedSellerId));
      } else if (shopFilter !== "ALL") {
        params.append("shopId", shopFilter);
      }

      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/admin/promotions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
      } else {
        showToast(data.message || "Không thể tải danh sách khuyến mãi");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedSellerId, statusFilter, shopFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPromotions();
  };

  const handleToggleStatus = async (item: PromotionAdminItem) => {
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${!item.isActive ? "kích hoạt" : "tạm dừng"} mã [${item.code}]`);
        fetchPromotions();
      } else {
        showToast(data.message || "Thao tác thất bại");
      }
    } catch {
      showToast("Lỗi kết nối khi cập nhật trạng thái voucher");
    }
  };

  const handleDeletePromotion = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã giảm giá [${code}] không?`)) return;

    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa mã [${code}] thành công`);
        fetchPromotions();
      } else {
        showToast(data.message || "Không thể xóa mã");
      }
    } catch {
      showToast("Lỗi mạng khi xóa mã giảm giá");
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formCode.trim() || !formTitle.trim() || !formDiscountValue) {
      setFormError("Vui lòng điền các trường bắt buộc (Mã, Tiêu đề, Giá trị giảm)");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode.trim().toUpperCase(),
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          discountType: formDiscountType,
          discountValue: parseFloat(formDiscountValue),
          minOrderValue: parseFloat(formMinOrderValue) || 0,
          maxDiscount: formMaxDiscount ? parseFloat(formMaxDiscount) : null,
          startDate: formStartDate,
          endDate: formEndDate,
          usageLimit: formUsageLimit ? parseInt(formUsageLimit, 10) : null,
          scope: viewMode === "SELLER" ? "SHOP" : formScope,
          shopId: viewMode === "SELLER" ? selectedSellerId : (formScope === "SHOP" ? formShopId : null),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Tạo thành công voucher [${formCode.toUpperCase()}]`);
        setIsCreateModalOpen(false);
        // Reset form
        setFormCode("");
        setFormTitle("");
        setFormDescription("");
        setFormDiscountValue("");
        setFormMinOrderValue("0");
        setFormMaxDiscount("");
        setFormUsageLimit("");
        fetchPromotions();
      } else {
        setFormError(data.message || "Tạo mã giảm giá thất bại");
      }
    } catch {
      setFormError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sắp xếp danh sách
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedPromotions = [...promotions].sort((a, b) => {
    let comparison = 0;
    if (sortField === "code") {
      comparison = a.code.localeCompare(b.code);
    } else if (sortField === "discountValue") {
      comparison = a.discountValue - b.discountValue;
    } else if (sortField === "usedCount") {
      comparison = a.usedCount - b.usedCount;
    } else if (sortField === "endDate") {
      comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    } else {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Voucher</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{promotions.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tất cả chương trình</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TicketPercent className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đang hoạt động</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {promotions.filter((p) => p.status === "ACTIVE").length}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Sẵn sàng áp dụng</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Lượt đã sử dụng</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {promotions.reduce((sum, p) => sum + p.usedCount, 0)}
            </div>
            <div className="text-[11px] text-purple-600 mt-0.5">Đã trừ vào đơn hàng</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Đã hết hạn / Dừng</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {promotions.filter((p) => p.status === "EXPIRED" || p.status === "PAUSED").length}
            </div>
            <div className="text-[11px] text-rose-500 mt-0.5">Cần gia hạn hoặc mở lại</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bộ lọc & Thanh công cụ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã code, tên chương trình hoặc mô tả..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bộ lọc trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="PAUSED">Đang tạm dừng</option>
              <option value="EXPIRED">Đã hết hạn</option>
            </select>

            {/* Bộ lọc shop (nếu Admin) */}
            {viewMode === "ADMIN" && (
              <select
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Toàn bộ phạm vi</option>
                <option value="GLOBAL">Toàn sàn CleanMate</option>
                {shopsList.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    Shop: {s.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo mã giảm giá mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bảng danh sách mã giảm giá */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("code")}>
                  <div className="flex items-center gap-1.5">
                    <span>Mã Voucher</span>
                    {sortField === "code" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4">Chương trình & Phạm vi</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("discountValue")}>
                  <div className="flex items-center gap-1.5">
                    <span>Mức giảm giá</span>
                    {sortField === "discountValue" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4">Đơn tối thiểu</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("usedCount")}>
                  <div className="flex items-center gap-1.5">
                    <span>Lượt sử dụng</span>
                    {sortField === "usedCount" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("endDate")}>
                  <div className="flex items-center gap-1.5">
                    <span>Thời hạn</span>
                    {sortField === "endDate" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span>Đang tải danh sách mã giảm giá...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedPromotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy mã giảm giá nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedPromotions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Mã Code */}
                    <td className="px-6 py-4 font-mono font-black text-sm text-blue-700">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.code}</span>
                      </div>
                    </td>

                    {/* Tiêu đề & Phạm vi */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.scope === "GLOBAL"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.scope === "GLOBAL" ? "Toàn sàn" : `Gian hàng: ${item.shopName || "Cụ thể"}`}
                        </span>
                      </div>
                    </td>

                    {/* Mức giảm */}
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-sm text-emerald-600">
                        {item.discountType === "PERCENT"
                          ? `Giảm ${item.discountValue}%`
                          : `Giảm ${item.discountValue.toLocaleString()}đ`}
                      </div>
                      {item.discountType === "PERCENT" && item.maxDiscount && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Tối đa {item.maxDiscount.toLocaleString()}đ
                        </span>
                      )}
                    </td>

                    {/* Đơn tối thiểu */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {item.minOrderValue > 0 ? `${item.minOrderValue.toLocaleString()}đ` : "Không giới hạn"}
                    </td>

                    {/* Lượt sử dụng */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{item.usedCount}</span>
                      <span className="text-slate-400"> / {item.usageLimit !== null ? item.usageLimit : "∞"}</span>
                    </td>

                    {/* Thời hạn */}
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      <div>Đến: <strong className="text-slate-800">{formatDateVN(item.endDate)}</strong></div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Từ: {formatDateVN(item.startDate)}</div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "UPCOMING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : item.status === "PAUSED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.status === "ACTIVE" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {item.status === "UPCOMING" && <Clock className="w-3 h-3 text-blue-600" />}
                        {item.status === "PAUSED" && <XCircle className="w-3 h-3 text-amber-600" />}
                        {item.status === "EXPIRED" && <Clock className="w-3 h-3 text-slate-400" />}
                        <span>
                          {item.status === "ACTIVE" && "Đang chạy"}
                          {item.status === "UPCOMING" && "Sắp tới"}
                          {item.status === "PAUSED" && "Tạm dừng"}
                          {item.status === "EXPIRED" && "Đã hết hạn"}
                        </span>
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            item.isActive
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                          }`}
                          title={item.isActive ? "Tạm dừng mã này" : "Kích hoạt lại mã"}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePromotion(item.id, item.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Xóa mã giảm giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO MÃ GIẢM GIÁ MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <TicketPercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tạo mã giảm giá mới (Voucher)</h3>
                  <p className="text-xs text-slate-500">Phát hành mã ưu đãi cho khách hàng trên nền tảng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 my-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePromotion} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Voucher Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="VD: GIAM20K, CHAOBANMOI"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: Giảm 20.000đ cho đơn đầu tiên"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chi tiết thể lệ</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Áp dụng cho mọi đơn đặt lịch dịch vụ vệ sinh..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Loại giảm giá & Mức giảm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức giảm</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as "PERCENT" | "FIXED")}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="PERCENT">Theo phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mức giảm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === "PERCENT" ? "15" : "50000"}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {formDiscountType === "PERCENT" ? "Đơn vị: %" : "Đơn vị: VNĐ"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    disabled={formDiscountType === "FIXED"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="VD: 100000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Chỉ dùng khi giảm %</span>
                </div>
              </div>

              {/* Điều kiện đơn & Giới hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinOrderValue}
                    onChange={(e) => setFormMinOrderValue(e.target.value)}
                    placeholder="VD: 200000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới hạn tổng lượt dùng</label>
                  <input
                    type="number"
                    min={1}
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="Để trống nếu không giới hạn"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phạm vi áp dụng */}
              {viewMode === "ADMIN" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phạm vi áp dụng</label>
                    <select
                      value={formScope}
                      onChange={(e) => setFormScope(e.target.value as "GLOBAL" | "SHOP")}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="GLOBAL">Toàn sàn CleanMate</option>
                      <option value="SHOP">Chỉ một Gian hàng cụ thể</option>
                    </select>
                  </div>

                  {formScope === "SHOP" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Chọn gian hàng</label>
                      <select
                        value={formShopId}
                        onChange={(e) => setFormShopId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">-- Chọn gian hàng --</option>
                        {shopsList.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Ngày bắt đầu - Ngày kết thúc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo mã ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
