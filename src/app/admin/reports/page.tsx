"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import {
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Truck,
  UserX,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { formatDateTimeVN } from "@/src/lib/date-utils";

export interface ReportAdminItem {
  id: number;
  type: "SHOP" | "CUSTOMER" | "SERVICE" | "REVIEW";
  title: string;
  reason: string;
  targetName: string;
  bookingCode?: string;
  images: string[];
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: number;
    fullName: string;
    phone: string | null;
    email: string | null;
    role: string;
    image: string | null;
  };
  reportedUser?: {
    id: number;
    fullName: string;
    phone: string | null;
    email: string | null;
    role: string;
    image: string | null;
    isActive: boolean;
  } | null;
  reportedShop?: {
    id: number;
    name: string;
    rating: number;
    ownerName?: string;
    ownerPhone?: string;
  } | null;
}

export default function AdminReportsPage() {
  const { showToast } = useAdmin();

  const [reportsList, setReportsList] = useState<ReportAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sắp xếp
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal chi tiết báo cáo
  const [selectedReport, setSelectedReport] = useState<ReportAdminItem | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/reports?type=${typeFilter}&status=${statusFilter}&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.reports)) {
        setReportsList(json.reports);
      }
    } catch (e) {
      console.error("Lỗi tải danh sách báo cáo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, searchQuery]);

  // Sắp xếp danh sách
  const sortedReports = [...reportsList].sort((a, b) => {
    let aVal = a[sortField as keyof ReportAdminItem];
    let bVal = b[sortField as keyof ReportAdminItem];

    if (sortField === "createdAt") {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Cập nhật trạng thái xử lý báo cáo
  const handleUpdateStatus = async (
    status: "REVIEWING" | "RESOLVED" | "REJECTED",
    blockUser = false
  ) => {
    if (!selectedReport || isUpdating) return;

    try {
      setIsUpdating(true);
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReport.id,
          status,
          adminNote: adminNoteInput,
          blockReportedUser: blockUser,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã cập nhật trạng thái báo cáo thành [${status}]`);
        const updated = {
          ...selectedReport,
          status,
          adminNote: adminNoteInput,
        };
        setSelectedReport(updated);
        setReportsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        showToast(data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi mạng khi cập nhật báo cáo");
    } finally {
      setIsUpdating(false);
    }
  };

  // Xóa báo cáo
  const handleDeleteReport = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) return;

    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Xóa báo cáo thành công!");
        setReportsList((prev) => prev.filter((r) => r.id !== id));
        if (selectedReport?.id === id) setSelectedReport(null);
      } else {
        showToast(json.message || "Xóa thất bại");
      }
    } catch (e) {
      console.error(e);
      showToast("Có lỗi xảy ra khi xóa");
    }
  };

  // Mở modal
  const handleOpenDetail = (r: ReportAdminItem) => {
    setSelectedReport(r);
    setAdminNoteInput(r.adminNote || "");
  };

  // KPI Counts
  const totalReports = reportsList.length;
  const pendingCount = reportsList.filter((r) => r.status === "PENDING").length;
  const deliveryCount = reportsList.filter((r) => r.type === "SERVICE" || r.bookingCode).length;
  const userReportsCount = reportsList.filter((r) => r.type === "CUSTOMER").length;

  return (
    <div className="space-y-6">
      {/* 4 THẺ KPI TỔNG QUAN BÁO CÁO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng báo cáo</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalReports}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Chờ xử lý</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{pendingCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sự cố Giao hàng / Đơn</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{deliveryCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Báo cáo Người dùng</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{userReportsCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* THANH BỘ LỌC VÀ TÌM KIẾM */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, lý do, người gửi..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Lọc phân loại */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">Tất cả phân loại</option>
            <option value="SERVICE">Sự cố Giao hàng / Dịch vụ</option>
            <option value="CUSTOMER">Báo cáo Người dùng / Khách hàng</option>
            <option value="SHOP">Báo cáo Gian hàng</option>
            <option value="REVIEW">Báo cáo Đánh giá</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý (Pending)</option>
            <option value="REVIEWING">Đang xác minh (Reviewing)</option>
            <option value="RESOLVED">Đã giải quyết (Resolved)</option>
            <option value="REJECTED">Đã bác bỏ (Rejected)</option>
          </select>
        </div>
      </div>

      {/* BẢNG DANH SÁCH BÁO CÁO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải danh sách báo cáo...</span>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-700">Chưa có báo cáo vi phạm nào</p>
            <p className="text-xs text-slate-400 mt-1">Hệ thống đang hoạt động an toàn và ổn định.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Loại báo cáo</th>
                  <th className="py-3 px-4">Đối tượng bị báo cáo</th>
                  <th className="py-3 px-4">Nội dung sự cố / Vi phạm</th>
                  <th className="py-3 px-4">Người gửi báo cáo</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Trạng thái</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Thời gian gửi</span>
                      {sortField === "createdAt" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedReports.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    {/* Loại báo cáo */}
                    <td className="py-3 px-4">
                      {item.type === "SERVICE" || item.bookingCode ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          <Truck className="w-3 h-3" />
                          <span>Giao hàng / Đơn</span>
                        </span>
                      ) : item.type === "CUSTOMER" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                          <UserX className="w-3 h-3" />
                          <span>Người dùng</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                          <Building2 className="w-3 h-3" />
                          <span>Gian hàng</span>
                        </span>
                      )}
                    </td>

                    {/* Đối tượng */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.targetName}</div>
                      {item.bookingCode && (
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                          Đơn: #{item.bookingCode}
                        </div>
                      )}
                    </td>

                    {/* Nội dung */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-bold text-slate-800 line-clamp-1">{item.title}</div>
                      <div className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">{item.reason}</div>
                    </td>

                    {/* Người gửi */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{item.reporter.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.reporter.phone || item.reporter.email || `ID: ${item.reporter.id}`}
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          item.status === "PENDING"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : item.status === "REVIEWING"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : item.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.status === "PENDING" && "Chờ xử lý"}
                        {item.status === "REVIEWING" && "Đang xác minh"}
                        {item.status === "RESOLVED" && "Đã giải quyết"}
                        {item.status === "REJECTED" && "Đã bác bỏ"}
                      </span>
                    </td>

                    {/* Ngày tạo */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDateTimeVN(item.createdAt)}
                    </td>

                    {/* Nút hành động */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          title="Xem chi tiết"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(item.id)}
                          title="Xóa báo cáo"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT & XỬ LÝ BÁO CÁO */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Chi tiết Báo cáo vi phạm</span>
                    <span className="font-mono text-xs text-slate-400">#{selectedReport.id}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gửi lúc: {formatDateTimeVN(selectedReport.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin đối tượng và loại báo cáo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Phân loại sự cố
                </div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  {selectedReport.type === "SERVICE" || selectedReport.bookingCode ? (
                    <>
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Sự cố Giao hàng / Thực hiện đơn</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 text-amber-600" />
                      <span>Báo cáo Vi phạm người dùng</span>
                    </>
                  )}
                </div>
                {selectedReport.bookingCode && (
                  <div className="text-blue-600 font-mono font-bold mt-1">
                    Mã đơn hàng: #{selectedReport.bookingCode}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Người gửi báo cáo
                </div>
                <div className="font-bold text-slate-900">{selectedReport.reporter.fullName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {selectedReport.reporter.phone || selectedReport.reporter.email || "Không có SĐT"} • Vai trò: {selectedReport.reporter.role}
                </div>
              </div>
            </div>

            {/* Đối tượng bị báo cáo */}
            {(selectedReport.reportedUser || selectedReport.reportedShop) && (
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-2 text-xs">
                <div className="font-bold text-rose-800 uppercase tracking-wider text-[11px]">
                  Đối tượng bị phản ánh:
                </div>
                {selectedReport.reportedUser && (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {selectedReport.reportedUser.fullName}
                      </span>
                      <span className="text-slate-500 ml-2 font-mono">
                        ({selectedReport.reportedUser.phone || selectedReport.reportedUser.email})
                      </span>
                      <span className="text-xs text-rose-600 ml-2 font-semibold">
                        [Vai trò: {selectedReport.reportedUser.role}]
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        selectedReport.reportedUser.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {selectedReport.reportedUser.isActive ? "Tài khoản Đang hoạt động" : "Tài khoản Đang bị khóa"}
                    </span>
                  </div>
                )}

                {selectedReport.reportedShop && (
                  <div>
                    <span className="font-bold text-slate-900">{selectedReport.reportedShop.name}</span>
                    <span className="text-slate-500 ml-2">
                      (Chủ gian hàng: {selectedReport.reportedShop.ownerName || "---"})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Chi tiết nội dung báo cáo */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">{selectedReport.title}</div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedReport.reason}
              </p>
            </div>

            {/* Ảnh đính kèm nếu có */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Hình ảnh bằng chứng đính kèm:</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedReport.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noreferrer"
                      className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 block hover:opacity-90 transition"
                    >
                      <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Ghi chú xử lý của Admin */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Ghi chú / Hướng giải quyết của Admin:
              </label>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Nhập ghi chú xử lý, kết quả liên hệ hoặc thỏa thuận bồi hoàn..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none transition resize-none"
              />
            </div>

            {/* Nút hành động trạng thái */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedReport.reportedUser && selectedReport.reportedUser.isActive && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus("RESOLVED", true)}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Khóa tài khoản vi phạm</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus("REVIEWING")}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Đang xác minh</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus("REJECTED")}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Bác bỏ</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus("RESOLVED")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Giải quyết xong</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
