"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, ADMIN_SESSION_MAX_AGE } from "@/lib/admin-session";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password) {
    return { error: "Şifre gereklidir" };
  }

  // Şifreyi kontrol et
  if (password !== adminPassword) {
    return { error: "Hatalı Şifre" };
  }

  // Başarılı giriş - İmzalı, süresi dolan oturum token'ını cookie'ye yaz
  const cookieStore = await cookies();
  cookieStore.set("admin_session", createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });

  // Admin paneline yönlendir
  redirect("/admin");
}
