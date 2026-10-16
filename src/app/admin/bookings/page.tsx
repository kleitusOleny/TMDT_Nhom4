"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { BookingRecord, ServiceRecord, UserRecord } from "@/src/lib/admin-data";
import { BookingDetailModal, CreateBookingModal } from "@/src/components/admin/AdminModals";
import { Plus, Search, Eye, Trash2, Check, Ban, Clock, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminBookingsPage() {
  const { viewMode, selectedSellerId, shopsList, showToast } = useAdmin();

  const [bookingsList, setBookingsList] = useState<BookingRecord[]>([]);
  const [servicesList, setServicesList] = useState<ServiceRecord[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
      if (viewMode === "SELLER") {
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
      const [resSrv, resUsr] = await Promise.all([
        fetch("/api/admin/services"),
        fetch("/api/admin/users?role=CUSTOMER"),
      ]);
      const jsonSrv = await resSrv.json();
      const jsonUsr = await resUsr.json();
      if (jsonSrv.success) setServicesList(jsonSrv.services || []);
      if (jsonUsr.success) setUsersList(jsonUsr.users || []);
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
      const resJson = await res.json();
      if (resJson.success) {
        showToast("Tạo đơn đặt dịch vụ thành công!");
        setCreateModalOpen(false);
        fetchBookings();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
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
      const data = await res.json();
      if (data.success) {
        showToast(`Đã cập nhật trạng thái đơn ${bookingId}`);
        fetchBookings();
        if (viewingBooking && viewingBooking.id === bookingId) {
          setViewingBooking({ ...viewingBooking, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng "${bookingId}"?`)) return;
    try {
      const res = await fetch(`/api/admin/bookings?id=${bookingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã hủy đơn hàng ${bookingId}`);
        fetchBookings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {viewMode === "ADMIN" ? "Quản Lý Đơn Đặt Dịch Vụ" : "Đơn Đặt Của Đơn Vị"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem chi tiết đơn hàng, ảnh nghiệm thu, cập nhật tiến độ và chiết khấu
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo đơn đặt mới</span>
        </button>
      </div>

      {/* Thanh lọc chi tiết */}
      <div className="px-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã đơn, tên khách, SĐT hoặc địa chỉ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        {viewMode === "ADMIN" && (
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">🏢 Tất cả nhà cung cấp</option>
            {shopsList.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái đơn</option>
          <option value="PENDING">Chờ duyệt (PENDING)</option>
          <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
          <option value="IN_PROGRESS">Đang dọn dẹp (IN_PROGRESS)</option>
          <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
          <option value="CANCELLED">Đã hủy (CANCELLED)</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Phương thức thanh toán</option>
          <option value="CASH">Tiền mặt (COD)</option>
          <option value="VNPAY">VNPAY</option>
          <option value="MOMO">MOMO</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
        </select>
      </div>

      {/* Bảng đơn hàng */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort("id")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
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
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
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
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Dịch vụ & Đối tác</span>
                  {sortField === "service" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("time")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Thời gian & Địa chỉ</span>
                  {sortField === "time" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("amount")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
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
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
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
              <th className="px-6 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">
                  <button
                    onClick={() => setViewingBooking(booking)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{booking.id}</span>
                    <Eye className="w-3 h-3 text-slate-400" />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{booking.customerName}</div>
                  <div className="text-[11px] text-slate-500">{booking.customerPhone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{booking.serviceName}</div>
                  <div className="text-[11px] text-blue-600">🏢 {booking.sellerName}</div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="font-semibold text-slate-900">
                    📅 {booking.bookingDate} ({booking.bookingTime})
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">📍 {booking.address}</div>
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
                      ? "Đã nhận đơn"
                      : booking.status === "PENDING"
                      ? "Chờ duyệt"
                      : "Đã hủy"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setViewingBooking(booking)}
                      title="Xem chi tiết đơn hàng"
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {booking.status === "PENDING" && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Nhận đơn
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
