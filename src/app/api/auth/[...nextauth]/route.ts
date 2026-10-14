import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/src/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Nếu chưa có User thì tạo mới khớp đúng Schema của bạn
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                fullName: user.name,
                image: user.image ?? null,
                role: "CUSTOMER",
                isActive: true,
              },
            });
          } else {
            // Nếu tài khoản bị khóa thì không cho phép đăng nhập
            if (!existingUser.isActive) {
              return false;
            }

            // Đồng bộ ảnh đại diện hoặc họ tên nếu trước đó chưa có
            if ((!existingUser.image && user.image) || (!existingUser.fullName && user.name)) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: existingUser.image ?? user.image ?? null,
                  fullName: existingUser.fullName ?? user.name ?? undefined,
                },
              });
            }
          }
          return true;
        } catch (error) {
          console.error("Lỗi khi lưu/đồng bộ Google User vào DB:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const emailToLookup = user?.email || token.email;
      if (emailToLookup) {
        const dbUser = await prisma.user.findUnique({
          where: { email: emailToLookup },
        });
        if (dbUser) {
          token.sub = String(dbUser.id);
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };