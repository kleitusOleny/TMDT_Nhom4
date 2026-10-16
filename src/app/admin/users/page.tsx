"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { UserRecord } from "@/src/lib/admin-data";
import { UserFormModal } from "@/src/components/admin/AdminModals";
import { Plus, Search, Edit, Trash2, Ban, Check, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminUsersPage() {
  const { showToast } = useAdmin();

  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<string>("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedUsers = [...usersList].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "fullName":
        aVal = a.fullName.toLowerCase();
        bVal = b.fullName.toLowerCase();
        break;
      case "phone":
        aVal = a.phone;
        bVal = b.phone;
        break;
      case "email":
        aVal = (a.email || "").toLowerCase();
        bVal = (b.email || "").toLowerCase();
        break;
      case "role":
        aVal = a.role;
        bVal = b.role;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "joinedDate":
        aVal = a.joinedDate;
        bVal = b.joinedDate;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `/api/admin/users?role=${roleFilter}&status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`
      );
      const json = await res.json();
      if (json.success) setUsersList(json.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [roleFilter, statusFilter, searchQuery]);

  const handleSaveUser = async (data: {
    userId?: number;
    fullName: string;
    phone: string;
    email: string;
    role: string;
    status?: string;
  }) => {
    try {
      const method = data.userId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast(data.userId ? "Cập nhật tài khoản thành công!" : "Tạo tài khoản mới thành công!");
        setModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(resJson.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${newStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản ${user.fullName}`);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/vô hiệu hóa tài khoản "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa tài khoản "${name}"`);
        fetchUsers();
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
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Phân Quyền Người Dùng Theo RBAC
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản, gán vai trò CUSTOMER, STAFF, PROVIDER, ADMIN và kiểm soát trạng thái
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm tài khoản mới</span>
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
            placeholder="Tìm theo tên, email, SĐT hoặc tên shop..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
          <option value="STAFF">Nhân viên sàn (STAFF)</option>
          <option value="SELLER">Nhà cung cấp (PROVIDER)</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="BLOCKED">Bị khóa</option>
        </select>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort("fullName")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Họ & Tên</span>
                  {sortField === "fullName" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("phone")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Số điện thoại</span>
                  {sortField === "phone" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("email")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Email</span>
                  {sortField === "email" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("role")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Vai trò (RBAC)</span>
                  {sortField === "role" ? (
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
              <th
                onClick={() => handleSort("joinedDate")}
                className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/80 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ngày tham gia</span>
                  {sortField === "joinedDate" ? (
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
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80 transition">
                <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <div>{user.fullName}</div>
                    {user.sellerName && (
                      <div className="text-[11px] text-blue-600 font-normal">🏢 {user.sellerName}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono">{user.phone}</td>
                <td className="px-6 py-4">{user.email || "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "STAFF"
                        ? "bg-amber-100 text-amber-700"
                        : user.role === "SELLER"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {user.actualRole || user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {user.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{user.joinedDate}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setModalOpen(true);
                      }}
                      title="Sửa & Phân quyền"
                      className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      title={user.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        user.status === "ACTIVE"
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {user.status === "ACTIVE" ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    {user.role !== "ADMIN" && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        title="Xóa tài khoản"
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

      {modalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSaveUser}
        />
      )}
    </div>
  );
}
