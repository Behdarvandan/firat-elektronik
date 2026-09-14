import * as XLSX from "xlsx";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/admin-session";

// ----------------------------------------------------------------------------
// Excel içe aktarma şablonu indirme ucu (GET /admin/import/template)
// Admin'e, doğru sütun başlıklarıyla boş bir .xlsx şablonu üretir.
// proxy.ts /admin'i zaten korur; burada savunma derinliği için tekrar doğrularız.
// ----------------------------------------------------------------------------
export async function GET() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get("admin_session")?.value)) {
    return new Response("Yetkisiz erişim", { status: 401 });
  }

  // Örnek satırlar: gerçek verilerinizin yerine geçin.
  const productsHeader = ["id", "name", "box_code", "category_id", "description"];
  const productsRows = [
    [1001, "Örnek Ekran Koruyucu", "UNIPRO H999", 1, "Örnek açıklama"],
  ];

  const modelsHeader = ["id", "model_name", "product_id", "sort_order", "is_new"];
  const modelsRows = [
    ["1001_0", "IPHONE 15", 1001, 1, false],
    ["1001_1", "IPHONE 15 PRO", 1001, 2, true],
  ];

  const workbook = XLSX.utils.book_new();
  const wsProducts = XLSX.utils.aoa_to_sheet([productsHeader, ...productsRows]);
  const wsModels = XLSX.utils.aoa_to_sheet([modelsHeader, ...modelsRows]);
  XLSX.utils.book_append_sheet(workbook, wsProducts, "products");
  XLSX.utils.book_append_sheet(workbook, wsModels, "models");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="urun-import-sablonu.xlsx"',
    },
  });
}
