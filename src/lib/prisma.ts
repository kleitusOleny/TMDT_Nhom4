import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/cleanmate";
const connectionString = rawUrl.startsWith("mysql://")
  ? rawUrl.replace("mysql://", "mariadb://")
  : rawUrl;

const adapter = new PrismaMariaDb(connectionString);

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// Nếu client trong global cache bị cũ và chưa có model userAddress, tự động khởi tạo lại
export const prisma =
  globalForPrisma.prisma && (globalForPrisma.prisma as unknown as Record<string, unknown>).userAddress
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
