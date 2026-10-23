/**
 * Tiện ích định dạng ngày tháng theo chuẩn Việt Nam dd/mm/yyyy cho toàn bộ dự án
 */

export function formatDateVN(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTimeVN(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}
