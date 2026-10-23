"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { BookingRecord, ServiceRecord, UserRecord } from "@/src/lib/admin-data";
import { BookingDetailModal, CreateBookingModal } from "@/src/components/admin/AdminModals";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Check,
  Ban,
  Clock,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Sparkles,
  Phone,
  X,
  Loader2,
} from "lucide-react";
import { formatDateVN } from "@/src/lib/date-utils";

interface CleanerOption {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
}

export default function AdminBookingsPage() {
  const { viewMode, selectedSellerId, shopsList, showToast } = useAdmin();

  const [bookingsList, setBookingsList] = useState<BookingRecord[]>([]);
  const [servicesList, setServicesList] = useState<ServiceRecord[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [cleanersList, setCleanersList] = useState<CleanerOption[]>([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Modal điều phối & phân công nhân viên dọn dẹp (Assign Cleaner Modal)
  const [assigningBooking, setAssigningBooking] = useState<BookingRecord | null>(null);
  const [selectedCleanerId, setSelectedCleanerId] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedBookings = [...bookingsList].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "id":
        aVal = a.id;
        bVal = b.id;
        break;
      case "customer":
        aVal = a.customerName.toLowerCase();
        bVal = b.customerName.toLowerCase();
        break;
      case "service":
        aVal = a.serviceName.toLowerCase();
        bVal = b.serviceName.toLowerCase();
        break;
      case "time":
        aVal = `${a.bookingDate} ${a.bookingTime}`;
        bVal = `${b.bookingDate} ${b.bookingTime}`;
        break;
      case "amount":
        aVal = a.totalAmount;
        bVal = b.totalAmount;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Format tiền tệ VNĐ
  const formatVND = (amount: number | undefined) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const fetchBookings = async () => {
    try {
      let shopParam = "";
      if (viewMode === "SELLER" && selectedSellerId) {
        shopParam = `&sellerId=${selectedSellerId}`;
      } else if (shopFilter !== "ALL") {
        shopParam = `&sellerId=${shopFilter}`;
      }

      const res = await fetch(
        `/api/admin/bookings?status=${statusFilter}&paymentMethod=${paymentFilter}&q=${encodeURIComponent(
          searchQuery
        )}${shopParam}`
      );
      const json = await res.json();
      if (json.success) setBookingsList(json.bookings || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchServicesAndUsers = async () => {
    try {
      const [resSrv, resUsr, resCleaners] = await Promise.all([
        fetch("/api/admin/services"),
        fetch("/api/admin/users?role=CUSTOMER"),
        fetch("/api/admin/users?role=CLEANER"),
      ]);
      const jsonSrv = await resSrv.json();
      const jsonUsr = await resUsr.json();
      const jsonCleaners = await resCleaners.json();

      if (jsonSrv.success) setServicesList(jsonSrv.services || []);
      if (jsonUsr.success) setUsersList(jsonUsr.users || []);
      if (jsonCleaners.success) {
        setCleanersList(
          (jsonCleaners.users || []).map((u: { id: number; fullName?: string; phone?: string; email?: string | null }) => ({
            id: u.id,
            fullName: u.fullName || "",
            phone: u.phone || "",
            email: u.email || null,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchBookings();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viewMode, selectedSellerId, statusFilter, paymentFilter, shopFilter, searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchServicesAndUsers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleCreateBooking = async (data: {
    serviceId: number;
    customerId: number;
    scheduledDate: string;
    address: string;
    note: string;
    totalPrice: number;
    paymentMethod: string;
  }) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Tạo đơn đặt lịch mới thành công!");
        setCreateModalOpen(false);
        fetchBookings();
      } else {
        showToast(json.message || "Tạo đơn thất bại");
      }
    } catch {
      showToast("Lỗi kết nối");
    }
  };

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Đã cập nhật trạng thái đơn #${bookingId} thành ${newStatus}`);
        fetchBookings();
      } else {
        showToast(json.message || "Cập nhật thất bại");
      }
    } catch {
      showToast("Lỗi kết nối");
    }
  };

  // Mở modal phân công Cleaner
  const handleOpenAssignModal = (booking: BookingRecord) => {
    setAssigningBooking(booking);
    setSelectedCleanerId(booking.cleanerId || (cleanersList[0]?.id ?? null));
  };

  // Xác nhận phân công Cleaner cho đơn đặt dịch vụ
  const handleConfirmAssign = async () => {
    if (!assigningBooking || !selectedCleanerId) return;

    try {
      setIsAssigning(true);
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: assigningBooking.id,
          cleanerId: selectedCleanerId,
          status: assigningBooking.status === "PENDING" ? "CONFIRMED" : assigningBooking.status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const assignedCleaner = cleanersList.find((c) => c.id === selectedCleanerId);
        showToast(
          `Đã điều phối đơn #${assigningBooking.id} cho nhân viên ${assignedCleaner?.fullName || "Cleaner"}!`
        );
        setAssigningBooking(null);
        fetchBookings();
      } else {
        showToast(json.message || "Không thể phân công đơn");
      }
    } catch {
      showToast("Lỗi kết nối khi phân công đơn");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm(`Bạn có chắc muốn hủy đơn đặt lịch #${bookingId}?`)) return;
    try {
      const res = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Đã hủy đơn hàng #${bookingId}`);
        fetchBookings();
      } else {
        showToast(json.message || "Hủy đơn thất bại");
      }
    } catch {
      showToast("Lỗi kết nối");
    }
  };

  return (
    <div className="space-y-6">
      {/* Thanh tiêu đề & Nút Tạo đơn mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {viewMode === "ADMIN" ? "Quản Lý Đơn Đặt Dịch Vụ Sàn" : "Đơn Đặt Dịch Vụ & Điều Phối Nhân Viên (Assign)"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi đơn mới, chỉ định nhân viên dọn dẹp (Cleaner) và giám sát trạng thái nghiệm thu công việc.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Đặt Lịch Mới</span>
        </button>
      </div>

      {/* Thanh tìm kiếm & bộ lọc */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, khách hàng, số điện thoại, địa chỉ hoặc dịch vụ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 transition"
          />
        </div>

        {viewMode === "ADMIN" && (
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả gian hàng đối tác</option>
            {shopsList.map((shop) => (
              <option key={shop.id} value={shop.id}>
                🏢 {shop.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận (PENDING)</option>
          <option value="CONFIRMED">Đã xác nhận / Phân công (CONFIRMED)</option>
          <option value="IN_PROGRESS">Đang dọn dẹp (IN_PROGRESS)</option>
          <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
          <option value="CANCELLED">Đã hủy đơn (CANCELLED)</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả thanh toán</option>
          <option value="CASH">Tiền mặt (COD)</option>
          <option value="VNPAY">Cổng VNPAY</option>
          <option value="CREDIT_CARD">Thẻ quốc tế</option>
        </select>
      </div>

      {/* Bảng danh sách đơn hàng */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort("id")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mã đơn</span>
                    {sortField === "id" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
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
                <th className="px-6 py-3.5">Nhân viên dọn dẹp (Assign)</th>
                <th
                  onClick={() => handleSort("time")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lịch hẹn & Địa chỉ</span>
                    {sortField === "time" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tổng tiền</span>
                    {sortField === "amount" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Trạng thái</span>
                    {sortField === "status" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3.5 text-right">Điều phối & Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">#{booking.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{booking.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{booking.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 line-clamp-1">{booking.serviceName}</div>
                    <div className="text-[11px] text-blue-600 font-medium">🏢 {booking.sellerName}</div>
                  </td>

                  {/* Cột Nhân viên dọn dẹp phụ trách (Cleaner Assign) */}
                  <td className="px-6 py-4">
                    {booking.assignedStaff ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-[10px]">
                          {booking.assignedStaff.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">{booking.assignedStaff}</div>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(booking)}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Đổi nhân viên
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(booking)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold cursor-pointer transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Chỉ định Cleaner</span>
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">
                      📅 {formatDateVN(booking.bookingDate)} ({booking.bookingTime})
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={booking.address}>
                      📍 {booking.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{formatVND(booking.totalAmount)}</div>
                    <div className="text-[11px] text-slate-500">
                      {viewMode === "ADMIN"
                        ? `Hoa hồng: +${formatVND(booking.commissionFee)}`
                        : `Shop nhận: ${formatVND(booking.sellerEarnings)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        booking.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : booking.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-700"
                          : booking.status === "CONFIRMED"
                          ? "bg-purple-50 text-purple-700"
                          : booking.status === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {booking.status === "COMPLETED" && <Check className="w-3 h-3" />}
                      {booking.status === "IN_PROGRESS" && (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      )}
                      {booking.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {booking.status === "CANCELLED" && <Ban className="w-3 h-3" />}
                      {booking.status === "COMPLETED"
                        ? "Hoàn tất"
                        : booking.status === "IN_PROGRESS"
                        ? "Đang dọn"
                        : booking.status === "CONFIRMED"
                        ? "Đã giao đơn"
                        : booking.status === "PENDING"
                        ? "Chờ duyệt"
                        : "Đã hủy"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingBooking(booking)}
                        title="Xem chi tiết đơn hàng & hình ảnh nghiệm thu"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút phân công nhanh */}
                      <button
                        onClick={() => handleOpenAssignModal(booking)}
                        title="Phân công nhân viên dọn dẹp"
                        className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>

                      {booking.status === "PENDING" && (
                        <button
                          onClick={() => handleOpenAssignModal(booking)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Nhận & Giao
                        </button>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "IN_PROGRESS")}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Bắt đầu
                        </button>
                      )}
                      {booking.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "COMPLETED")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Nghiệm thu
                        </button>
                      )}
                      {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          title="Hủy đơn"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PHÂN CÔNG ĐIỀU PHỐI CLEANER (ASSIGN CLEANER MODAL) */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Điều Phối & Phân Công Nhân Viên</h3>
                  <p className="text-[11px] text-slate-500">Mã đơn: #{assigningBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => setAssigningBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chi tiết đơn */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
              <div>
                <strong>Dịch vụ:</strong> <span className="font-bold text-slate-800">{assigningBooking.serviceName}</span>
              </div>
              <div>
                <strong>Khách hàng:</strong> {assigningBooking.customerName} ({assigningBooking.customerPhone})
              </div>
              <div>
                <strong>Thời gian hẹn:</strong> {formatDateVN(assigningBooking.bookingDate)} ({assigningBooking.bookingTime})
              </div>
              <div>
                <strong>Địa chỉ:</strong> {assigningBooking.address}
              </div>
            </div>

            {/* Danh sách Cleaner để chọn */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Chọn Chuyên viên dọn dẹp phụ trách (Cleaner):
              </label>

              {cleanersList.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl text-amber-800 text-center">
                  Chưa có tài khoản Cleaner nào trong hệ thống. Vui lòng tạo tài khoản vai trò CLEANER trong mục Quản lý người dùng.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cleanersList.map((cleaner) => (
                    <label
                      key={cleaner.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        selectedCleanerId === cleaner.id
                          ? "bg-teal-50/70 border-teal-500 shadow-2xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="assignedCleaner"
                          checked={selectedCleanerId === cleaner.id}
                          onChange={() => setSelectedCleanerId(cleaner.id)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{cleaner.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{cleaner.phone || "---"} • {cleaner.email || "---"}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Sẵn sàng nhận ca
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Nút hành động */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAssigningBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isAssigning || !selectedCleanerId}
                onClick={handleConfirmAssign}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang phân công...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Xác nhận giao việc</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingBooking && (
        <BookingDetailModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {createModalOpen && (
        <CreateBookingModal
          servicesList={servicesList}
          usersList={usersList}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateBooking}
        />
      )}
    </div>
  );
}
