"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();

  // admin_session cookie'sini sil
  cookieStore.delete("admin_session");

  // Ana sayfaya yönlendir
  redirect("/");
}
