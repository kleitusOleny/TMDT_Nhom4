"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { useRouter } from "next/navigation";
import { ProviderRecord } from "@/src/lib/admin-data";
import { ProviderFormModal } from "@/src/components/admin/AdminModals";
import { Plus, Search, Edit, Trash2, Building2, Layers, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminProvidersPage() {
  const { showToast } = useAdmin();
  const router = useRouter();

  const [providersList, setProvidersList] = useState<ProviderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderRecord | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedProviders = [...providersList].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "owner":
        aVal = a.ownerName.toLowerCase();
        bVal = b.ownerName.toLowerCase();
        break;
      case "area":
        aVal = a.area.toLowerCase();
        bVal = b.area.toLowerCase();
        break;
      case "servicesCount":
        aVal = a.servicesCount;
        bVal = b.servicesCount;
        break;
      case "rating":
        aVal = a.rating;
        bVal = b.rating;
        break;
      case "status":
        aVal = a.approvalStatus;
        bVal = b.approvalStatus;
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

  const fetchProviders = async () => {
    try {
      const res = await fetch(
        `/api/admin/providers?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`
      );
      const json = await res.json();
      if (json.success) setProvidersList(json.shops || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProviders();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [statusFilter, searchQuery]);

  const handleSaveProvider = async (data: {
    shopId?: number;
    name: string;
    area: string;
    address: string;
    description: string;
    approvalStatus: string;
  }) => {
    try {
      const method = data.shopId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/providers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast(data.shopId ? "Cập nhật nhà cung cấp thành công!" : "Đăng ký nhà cung cấp mới thành công!");
        setModalOpen(false);
        setEditingProvider(null);
        fetchProviders();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProvider = async (shopId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/vô hiệu hóa nhà cung cấp "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/providers?id=${shopId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa nhà cung cấp "${name}"`);
        fetchProviders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Quản Lý Nhà Cung Cấp & Đối Tác
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Phê duyệt, kiểm tra thông tin, quản lý địa bàn và dịch vụ của từng đơn vị
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProvider(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm nhà cung cấp mới</span>
        </button>
      </div>

      {/* Bộ lọc chi tiết cho Nhà cung cấp */}
      <div className="px-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên doanh nghiệp, khu vực, chủ sở hữu..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái xét duyệt</option>
          <option value="APPROVED">Đã duyệt (APPROVED)</option>
          <option value="PENDING">Chờ xét duyệt (PENDING)</option>
          <option value="REJECTED">Từ chối (REJECTED)</option>
        </select>
      </div>

      {/* Bảng danh sách nhà cung cấp */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Doanh nghiệp / Shop</span>
                  {sortField === "name" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("owner")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Chủ sở hữu</span>
                  {sortField === "owner" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("area")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Khu vực phục vụ</span>
                  {sortField === "area" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("servicesCount")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Số gói dịch vụ</span>
                  {sortField === "servicesCount" ? (
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
            {sortedProviders.map((shop) => (
              <tr key={shop.id} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <div>
                      <div>{shop.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        ID: #{shop.id} • {shop.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{shop.ownerName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{shop.ownerPhone}</div>
                </td>
                <td className="px-6 py-4 max-w-xs truncate text-slate-600">{shop.area}</td>
                <td className="px-6 py-4 font-bold text-blue-600">{shop.servicesCount} gói</td>
                <td className="px-6 py-4 text-amber-500 font-semibold">
                  ★ {shop.rating.toFixed(1)} ({shop.totalReviews} đánh giá)
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      shop.approvalStatus === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : shop.approvalStatus === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {shop.approvalStatus === "APPROVED"
                      ? "Đã phê duyệt"
                      : shop.approvalStatus === "PENDING"
                      ? "Chờ duyệt"
                      : "Bị từ chối"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Chuyển sang trang Dịch vụ và lọc theo Shop này */}
                    <button
                      onClick={() => router.push(`/admin/services?sellerId=${shop.id}`)}
                      title="Xem các gói dịch vụ của shop này"
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingProvider(shop);
                        setModalOpen(true);
                      }}
                      title="Sửa thông tin"
                      className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(shop.id, shop.name)}
                      title="Xóa nhà cung cấp"
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
        <ProviderFormModal
          provider={editingProvider}
          onClose={() => {
            setModalOpen(false);
            setEditingProvider(null);
          }}
          onSubmit={handleSaveProvider}
        />
      )}
    </div>
  );
}
