import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { B2B_SESSION_COOKIE, verifyB2bSessionToken } from "@/lib/b2b-session";
import CheckoutClient from "./CheckoutClient";

// Oturum cookie'si her istekte okunduğu için dinamik render zorunlu.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const session = verifyB2bSessionToken(
    cookieStore.get(B2B_SESSION_COOKIE)?.value,
  );

  // Bayi girişi yoksa panel girişine yönlendir
  if (!session) {
    redirect("/b2b");
  }

  return (
    <CheckoutClient
      organization={{
        id: session.organizationId,
        name: session.name,
        email: session.email,
      }}
    />
  );
}
