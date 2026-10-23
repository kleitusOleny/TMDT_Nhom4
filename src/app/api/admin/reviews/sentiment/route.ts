import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, threshold = 0.45 } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: false, message: "Thiếu nội dung bình luận" }, { status: 400 });
    }

    // 1. Gọi Python AI Microservice (FastAPI trên port 8000)
    try {
      const aiRes = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, threshold }),
        cache: "no-store",
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        return NextResponse.json({
          success: true,
          source: "model_pth",
          predictions: data.predictions || [],
        });
      }
    } catch {
      // AI Service chưa bật hoặc đang tải trọng số
    }

    // 2. Fallback heuristic/rule-based thông minh nếu server Python chưa khởi động xong
    const lower = text.toLowerCase();
    const fallbackResults: { aspect: string; sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; confidence: number; highlightText: string }[] = [];

    // Khía cạnh Chất lượng
    if (lower.includes("sạch") || lower.includes("kỹ") || lower.includes("bẩn") || lower.includes("bóng") || lower.includes("hôi") || lower.includes("ố")) {
      const isNeg = lower.includes("không sạch") || lower.includes("chưa sạch") || lower.includes("bẩn") || lower.includes("hôi");
      fallbackResults.push({
        aspect: "Chất lượng",
        sentiment: isNeg ? "NEGATIVE" : "POSITIVE",
        confidence: 0.88,
        highlightText: text,
      });
    }

    // Khía cạnh Nhân sự
    if (lower.includes("nhân viên") || lower.includes("thợ") || lower.includes("thái độ") || lower.includes("nhiệt tình") || lower.includes("lịch sự") || lower.includes("tận tình")) {
      const isNeg = lower.includes("khó chịu") || lower.includes("cáu") || lower.includes("thô lỗ") || lower.includes("ẩu");
      fallbackResults.push({
        aspect: "Nhân sự",
        sentiment: isNeg ? "NEGATIVE" : "POSITIVE",
        confidence: 0.85,
        highlightText: text,
      });
    }

    // Khía cạnh Giá cả
    if (lower.includes("giá") || lower.includes("đắt") || lower.includes("rẻ") || lower.includes("chi phí") || lower.includes("tiền")) {
      const isNeg = lower.includes("đắt") || lower.includes("cao") || lower.includes("chát");
      fallbackResults.push({
        aspect: "Giá cả",
        sentiment: isNeg ? "NEGATIVE" : "POSITIVE",
        confidence: 0.82,
        highlightText: text,
      });
    }

    // Khía cạnh Thời gian
    if (lower.includes("giờ") || lower.includes("trễ") || lower.includes("muộn") || lower.includes("nhanh") || lower.includes("đúng hẹn")) {
      const isNeg = lower.includes("trễ") || lower.includes("muộn") || lower.includes("chậm");
      fallbackResults.push({
        aspect: "Thời gian",
        sentiment: isNeg ? "NEGATIVE" : "POSITIVE",
        confidence: 0.84,
        highlightText: text,
      });
    }

    if (fallbackResults.length === 0) {
      fallbackResults.push({
        aspect: "Chất lượng",
        sentiment: "POSITIVE",
        confidence: 0.75,
        highlightText: text,
      });
    }

    return NextResponse.json({
      success: true,
      source: "rule_fallback",
      predictions: fallbackResults,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi phân tích cảm xúc";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
