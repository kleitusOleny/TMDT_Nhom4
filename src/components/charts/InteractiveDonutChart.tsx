"use client";

import React, { useState } from "react";

export interface DonutItem {
  name: string;
  count?: number;
  revenue?: number;
  percentage: number;
  color: string;
}

interface Props {
  data: DonutItem[];
  title?: string;
  centerLabel?: string;
  valueFormatter?: "currency" | "count";
}

export default function InteractiveDonutChart({
  data,
  title,
  centerLabel = "Tổng quan",
  valueFormatter = "count",
}: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
        Không có dữ liệu
      </div>
    );
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Tính toán chu vi hình tròn cho SVG stroke-dasharray
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Tính lũy kế góc bắt đầu cho từng lát cắt
  const { slices } = data.reduce(
    (result, item, index) => {
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((result.cumulativePercent / 100) * circumference);

      return {
        cumulativePercent: result.cumulativePercent + item.percentage,
        slices: [
          ...result.slices,
          {
            ...item,
            strokeDasharray,
            strokeDashoffset,
            index,
          },
        ],
      };
    },
    {
      cumulativePercent: 0,
      slices: [] as Array<
        DonutItem & { strokeDasharray: string; strokeDashoffset: number; index: number }
      >,
    }
  );

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Vòng tròn Donut Chart */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Vòng nền xám mờ */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Các phân đoạn màu */}
          {slices.map((slice) => {
            const isHovered = activeIndex === slice.index;
            return (
              <circle
                key={slice.index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setActiveIndex(slice.index)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            );
          })}
        </svg>

        {/* Nội dung trung tâm của Donut Chart */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {activeItem ? (
            <>
              <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">
                {activeItem.name}
              </span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5">
                {activeItem.percentage}%
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">
                {activeItem.revenue
                  ? formatVND(activeItem.revenue)
                  : `${activeItem.count || 0} đơn`}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400 font-medium">{centerLabel}</span>
              <span className="text-base font-bold text-slate-800 mt-0.5">100%</span>
              <span className="text-[10px] text-slate-400">Rê chuột xem</span>
            </>
          )}
        </div>
      </div>

      {/* Chú thích dữ liệu (Legends) */}
      <div className="w-full space-y-2.5">
        {data.map((item, idx) => {
          const isHovered = activeIndex === idx;
          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer text-xs ${
                isHovered ? "bg-slate-100/90 font-medium" : "hover:bg-slate-50"
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2.5 truncate max-w-[180px]">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-slate-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">{item.percentage}%</span>
                <span className="text-slate-400 text-[11px]">
                  {item.revenue
                    ? formatVND(item.revenue)
                    : `(${item.count || 0})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
