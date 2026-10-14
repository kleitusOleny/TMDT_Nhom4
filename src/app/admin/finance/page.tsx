"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../layout";

export default function AdminFinancePage() {
  const { viewMode, selectedSellerId, showToast } = useAdmin();

  const [platformFee, setPlatformFee] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Format tiền tệ VNĐ
  const formatVND = (amount: number | undefined) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  useEffect(() => {
    async function loadFinanceData() {
      try {
        const endpoint =
          viewMode === "ADMIN"
            ? "/api/admin/analytics"
            : `/api/seller/analytics?sellerId=${selectedSellerId}`;
        const res = await fetch(endpoint);
        const json = await res.json();
        if (json.success && json.kpi) {
          setPlatformFee(json.kpi.platformFee || 0);
          setWalletBalance(json.kpi.walletBalance || 0);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadFinanceData();
  }, [viewMode, selectedSellerId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900">
          {viewMode === "ADMIN" ? "Ví Thu Hộ & Hoa Hồng Sàn" : "Số Dư Ví Đối Soát"}
        </h3>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
          <span className="text-xs uppercase font-medium text-blue-100">Số dư khả dụng</span>
          <div className="text-3xl font-black mt-2">
            {formatVND(viewMode === "ADMIN" ? platformFee : walletBalance)}
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
            <span>Chu kỳ đối soát: Hàng tuần</span>
            <span className="font-semibold text-white">Thứ 6 hàng tuần</span>
          </div>
        </div>

        {viewMode === "SELLER" && (
          <button
            onClick={() =>
              showToast(
                `Đã gửi yêu cầu rút tiền ${formatVND(
                  walletBalance
                )} tới ban quản trị sàn CleanMate!`
              )
            }
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            Tạo yêu cầu rút tiền về tài khoản
          </button>
        )}
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Lịch Sử Đối Soát & Giao Dịch</h3>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-800">
                Rút tiền về Vietcombank (STK: 0071000123xxx)
              </div>
              <div className="text-slate-400 mt-0.5">Mã GD: #WD-2026-981 • 05/10/2026</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-emerald-600">+15.800.000 ₫</div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Thành công
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-800">
                Đối soát định kỳ đơn hàng Tuần 39
              </div>
              <div className="text-slate-400 mt-0.5">Mã GD: #ST-2026-442 • 28/09/2026</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">+22.450.000 ₫</div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Đã tất toán
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
