"use client";

import React, { useState } from "react";

export interface ColumnDataPoint {
  date: string;
  formattedDate: string;
  totalRevenue: number;
  platformFee?: number;
  sellerRevenue?: number;
  orderCount: number;
}

interface Props {
  data: ColumnDataPoint[];
  metricType?: "revenue" | "orders";
  showSecondary?: boolean;
}

export default function InteractiveColumnChart({
  data,
  metricType = "revenue",
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Không có dữ liệu trong khoảng thời gian này
      </div>
    );
  }

  // Lấy giá trị lớn nhất để căn chỉnh tỷ lệ cột
  const maxVal = Math.max(
    ...data.map((d) => (metricType === "revenue" ? d.totalRevenue : d.orderCount)),
    100000
  );

  const chartHeight = 220;
  const chartWidth = 720;
  const paddingBottom = 30;
  const paddingTop = 20;
  const availableHeight = chartHeight - paddingTop - paddingBottom;
  const barWidth = Math.min(36, Math.max(16, (chartWidth / data.length) * 0.55));
  const stepX = chartWidth / data.length;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="w-full relative select-none">
      <div className="relative w-full overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-64 overflow-visible"
        >
          <defs>
            {/* Gradient cho cột doanh thu */}
            <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
            </linearGradient>
            {/* Gradient khi hover */}
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Đường lưới ngang (Grid lines) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + availableHeight * (1 - pct);
            const gridVal = maxVal * pct;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y={y - 4}
                  fill="#94a3b8"
                  fontSize="10"
                  className="font-medium"
                >
                  {metricType === "revenue"
                    ? gridVal >= 1000000
                      ? `${(gridVal / 1000000).toFixed(1)}Tr`
                      : `${Math.round(gridVal / 1000)}k`
                    : Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Các cột dữ liệu (Bars) */}
          {data.map((item, index) => {
            const rawVal = metricType === "revenue" ? item.totalRevenue : item.orderCount;
            const barH = Math.max(6, (rawVal / maxVal) * availableHeight);
            const x = index * stepX + (stepX - barWidth) / 2;
            const y = paddingTop + (availableHeight - barH);
            const isHovered = hoveredIndex === index;

            return (
              <g
                key={index}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Vùng cảm ứng chuột mở rộng */}
                <rect
                  x={index * stepX}
                  y={0}
                  width={stepX}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Nền mờ khi hover cột */}
                {isHovered && (
                  <rect
                    x={index * stepX + 2}
                    y={paddingTop}
                    width={stepX - 4}
                    height={availableHeight}
                    fill="#eff6ff"
                    rx="8"
                    opacity="0.8"
                  />
                )}

                {/* Cột chính */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="6"
                  fill={isHovered ? "url(#barGradientHover)" : "url(#barGradientPrimary)"}
                  className="transition-all duration-200 filter drop-shadow-sm"
                />

                {/* Nhãn ngày bên dưới */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill={isHovered ? "#1e293b" : "#64748b"}
                  fontSize="11"
                  fontWeight={isHovered ? "600" : "500"}
                >
                  {item.formattedDate}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip khi người dùng rê chuột */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-20 top-2 pointer-events-none transition-all duration-150 ease-out transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs border border-slate-700 min-w-44"
            style={{
              left: `${((hoveredIndex * stepX + stepX / 2) / chartWidth) * 100}%`,
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
              <span>Ngày: {data[hoveredIndex].date}</span>
              <span className="text-blue-400 font-bold">
                {data[hoveredIndex].orderCount} đơn
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span>Tổng doanh thu:</span>
                <span className="font-bold text-white">
                  {formatVND(data[hoveredIndex].totalRevenue)}
                </span>
              </div>
              {data[hoveredIndex].platformFee !== undefined && (
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Hoa hồng sàn (15%):</span>
                  <span className="text-emerald-400">
                    +{formatVND(data[hoveredIndex].platformFee || 0)}
                  </span>
                </div>
              )}
              {data[hoveredIndex].sellerRevenue !== undefined && (
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Người bán nhận:</span>
                  <span className="text-blue-300">
                    {formatVND(data[hoveredIndex].sellerRevenue || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
