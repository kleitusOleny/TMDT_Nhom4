import fs from "fs";
import path from "path";

/**
 * Lưu chuỗi base64 ảnh thành file trong public/uploads/reviews/
 * và trả về đường dẫn URL công khai (vd: /uploads/reviews/rev-12345.jpg)
 */
export async function saveBase64Image(base64Data: string, prefix = "rev"): Promise<string> {
  // Nếu đã là link URL bình thường (bắt đầu bằng http hoặc /), giữ nguyên
  if (!base64Data.startsWith("data:image/")) {
    return base64Data;
  }

  // Tách MIME type và phần base64 content
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    return base64Data;
  }

  let ext = matches[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  if (ext.includes("+xml")) ext = "svg";

  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, "base64");

  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/reviews/${fileName}`;
}
