import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import {
  B2B_SESSION_COOKIE,
  verifyB2bSessionToken,
} from "@/lib/b2b-session";
import B2BLogin from "./B2BLogin";
import B2BDashboard from "./B2BDashboard";

// Oturum cookie'si her istekte okunduğu için dinamik render zorunlu.
export const dynamic = "force-dynamic";

export default async function B2BPage() {
  const cookieStore = await cookies();
  const session = verifyB2bSessionToken(
    cookieStore.get(B2B_SESSION_COOKIE)?.value,
  );

  // Oturum yoksa giriş formunu göster
  if (!session) {
    return <B2BLogin />;
  }

  // Bayi paneline ürün listesini çek (iskelet: ilk 50 ürün, sayfalama sonra)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, box_code, category_id")
    .order("id", { ascending: true })
    .limit(50);

  return (
    <B2BDashboard
      organization={{
        id: session.organizationId,
        name: session.name,
        email: session.email,
      }}
      products={products ?? []}
    />
  );
}
