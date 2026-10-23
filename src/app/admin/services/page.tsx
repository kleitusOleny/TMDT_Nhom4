"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAdmin } from "../layout";
import { useSearchParams } from "next/navigation";
import { ServiceRecord } from "@/src/lib/admin-data";
import { ServiceEditModal } from "@/src/components/admin/AdminModals";
import { Plus, Search, Edit, Trash2, Ban, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

function AdminServicesContent() {
  const { viewMode, selectedSellerId, shopsList, showToast } = useAdmin();
  const searchParams = useSearchParams();
  const initialSellerParam = searchParams.get("sellerId") || "ALL";

  const [servicesList, setServicesList] = useState<ServiceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [shopFilter, setShopFilter] = useState(initialSellerParam);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedServices = [...servicesList].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "category":
        aVal = a.categoryName.toLowerCase();
        bVal = b.categoryName.toLowerCase();
        break;
      case "seller":
        aVal = a.sellerName.toLowerCase();
        bVal = b.sellerName.toLowerCase();
        break;
      case "price":
        aVal = a.price;
        bVal = b.price;
        break;
      case "rating":
        aVal = a.rating;
        bVal = b.rating;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "createdAt":
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
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

  const fetchServices = async () => {
    try {
      let shopParam = "";
      if (viewMode === "SELLER") {
        shopParam = `&sellerId=${selectedSellerId}`;
      } else if (shopFilter !== "ALL") {
        shopParam = `&sellerId=${shopFilter}`;
      }

      const res = await fetch(
        `/api/admin/services?status=${statusFilter}&category=${categoryFilter}&q=${encodeURIComponent(
          searchQuery
        )}${shopParam}`
      );
      const json = await res.json();
      if (json.success) setServicesList(json.services || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchServices();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [viewMode, selectedSellerId, statusFilter, categoryFilter, shopFilter, searchQuery]);

  const handleSaveService = async (data: {
    serviceId?: number;
    name: string;
    category: string;
    sellerId: number;
    price: number;
    unit: string;
    status: string;
    description?: string;
    images?: string[];
    pricingTable?: {
      id: string;
      title: string;
      sub: string;
      price: number;
      unit: string;
    }[];
  }) => {
    try {
      const method = data.serviceId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast(data.serviceId ? "Cập nhật dịch vụ thành công!" : "Tạo dịch vụ mới thành công!");
        setModalOpen(false);
        setEditingService(null);
        fetchServices();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (serviceId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/ẩn dịch vụ "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/services?id=${serviceId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa dịch vụ "${name}"`);
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (
    serviceId: number,
    newStatus: "APPROVED" | "REJECTED" | "INACTIVE"
  ) => {
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Cập nhật trạng thái dịch vụ thành công!");
        fetchServices();
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
            {viewMode === "ADMIN" ? "Quản Lý Dịch Vụ Toàn Sàn" : "Dịch Vụ Của Đơn Vị"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý chi tiết từng gói dịch vụ, lọc theo từng nhà cung cấp và danh mục
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm dịch vụ mới</span>
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
            placeholder="Tìm theo tên dịch vụ hoặc mô tả..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        {/* Lọc theo Nhà cung cấp cụ thể */}
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả nhóm danh mục</option>
          <option value="ve-sinh-nha-o">Vệ sinh nhà ở</option>
          <option value="ve-sinh-van-phong">Vệ sinh văn phòng</option>
          <option value="ve-sinh-cong-nghiep">Sau xây dựng</option>
          <option value="giat-sofa-nem">Giặt sofa & nệm</option>
          <option value="ve-sinh-may-lanh">Vệ sinh máy lạnh</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt (Active)</option>
          <option value="PENDING">Chờ duyệt (Pending)</option>
          <option value="INACTIVE">Tạm ẩn (Inactive)</option>
        </select>
      </div>

      {/* Bảng danh sách dịch vụ */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tên Dịch Vụ</span>
                  {sortField === "name" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("category")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Danh mục</span>
                  {sortField === "category" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("seller")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Đơn vị cung cấp</span>
                  {sortField === "seller" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("price")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Giá niêm yết</span>
                  {sortField === "price" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("rating")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
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
            {sortedServices.map((srv) => (
              <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs">{srv.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                    {srv.categoryName}
                  </span>
                </td>
                <td className="px-6 py-4 text-blue-600 font-medium">{srv.sellerName}</td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {formatVND(srv.price)} / {srv.unit}
                </td>
                <td className="px-6 py-4 text-amber-500 font-semibold">
                  ★ {srv.rating > 0 ? srv.rating.toFixed(1) : "5.0"} ({srv.completedBookings} đơn)
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      srv.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : srv.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {srv.status === "APPROVED"
                      ? "Đã duyệt"
                      : srv.status === "PENDING"
                      ? "Chờ duyệt"
                      : "Tạm ẩn"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {viewMode === "ADMIN" && srv.status === "PENDING" && (
                      <button
                        onClick={() => handleUpdateStatus(srv.id, "APPROVED")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Duyệt
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingService(srv);
                        setModalOpen(true);
                      }}
                      title="Sửa dịch vụ"
                      className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          srv.id,
                          srv.status === "APPROVED" ? "INACTIVE" : "APPROVED"
                        )
                      }
                      title={srv.status === "APPROVED" ? "Ẩn dịch vụ" : "Hiện dịch vụ"}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                    >
                      {srv.status === "APPROVED" ? <Ban className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      title="Xóa dịch vụ"
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ServiceEditModal
          service={
            editingService || {
              id: 0,
              name: "",
              category: "home",
              categoryName: "Vệ sinh nhà ở",
              sellerId: shopsList[0]?.id || 1,
              sellerName: shopsList[0]?.name || "Shop",
              price: 250000,
              unit: "gói",
              status: "APPROVED",
              rating: 5,
              completedBookings: 0,
            }
          }
          shopsList={shopsList}
          onClose={() => {
            setModalOpen(false);
            setEditingService(null);
          }}
          onSubmit={handleSaveService}
        />
      )}
    </div>
  );
}

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải dịch vụ...</div>}>
      <AdminServicesContent />
    </Suspense>
  );
}
