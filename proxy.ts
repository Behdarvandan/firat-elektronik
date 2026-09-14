import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/admin-session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sadece /admin ile başlayan rotaları kontrol et
  if (pathname.startsWith("/admin")) {
    // /admin/login sayfasını hariç tut
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // admin_session cookie'sini imzasına ve süresine göre doğrula
    const adminSession = request.cookies.get("admin_session");

    if (!verifySessionToken(adminSession?.value)) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Cookie geçerliyse devam et
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Proxy'nin çalışacağı rotaları belirt
export const config = {
  matcher: "/admin/:path*",
};
