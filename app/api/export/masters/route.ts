import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: マスターデータのエクスポート
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    // 各マスターデータを取得
    const staff = db.prepare("SELECT * FROM staff ORDER BY name").all();
    const treatmentMenus = db
      .prepare("SELECT * FROM treatment_menus ORDER BY category, name")
      .all();
    const referralSources = db
      .prepare("SELECT * FROM referral_sources ORDER BY name")
      .all();
    const paymentMethods = db
      .prepare("SELECT * FROM payment_methods ORDER BY name")
      .all();
    const discountTypes = db
      .prepare("SELECT * FROM discount_types ORDER BY name")
      .all();
    const retailProducts = db
      .prepare("SELECT * FROM retail_products ORDER BY category, name")
      .all();

    const mastersData = {
      staff,
      treatmentMenus,
      referralSources,
      paymentMethods,
      discountTypes,
      retailProducts,
    };

    if (format === "json") {
      return NextResponse.json(mastersData);
    }

    // CSV形式でエクスポート
    const csvContent = [];

    // スタッフデータ
    csvContent.push("=== スタッフ ===");
    csvContent.push("ID,名前,アクティブ,作成日時");
    staff.forEach((s: any) => {
      csvContent.push(
        `${s.id},"${(s.name || "").replace(/"/g, '""')}",${
          s.is_active ? "有効" : "無効"
        },"${s.created_at}"`
      );
    });
    csvContent.push("");

    // 施術メニューデータ
    csvContent.push("=== 施術メニュー ===");
    csvContent.push("ID,名前,カテゴリ,価格,アクティブ,作成日時");
    treatmentMenus.forEach((m: any) => {
      csvContent.push(
        `${m.id},"${(m.name || "").replace(/"/g, '""')}","${(
          m.category || ""
        ).replace(/"/g, '""')}",${m.price || ""},${
          m.is_active ? "有効" : "無効"
        },"${m.created_at}"`
      );
    });
    csvContent.push("");

    // 紹介元データ
    csvContent.push("=== 紹介元 ===");
    csvContent.push("ID,名前,アクティブ,作成日時");
    referralSources.forEach((r: any) => {
      csvContent.push(
        `${r.id},"${(r.name || "").replace(/"/g, '""')}",${
          r.is_active ? "有効" : "無効"
        },"${r.created_at}"`
      );
    });
    csvContent.push("");

    // 支払い方法データ
    csvContent.push("=== 支払い方法 ===");
    csvContent.push("ID,名前,アクティブ,作成日時");
    paymentMethods.forEach((p: any) => {
      csvContent.push(
        `${p.id},"${(p.name || "").replace(/"/g, '""')}",${
          p.is_active ? "有効" : "無効"
        },"${p.created_at}"`
      );
    });
    csvContent.push("");

    // 割引種別データ
    csvContent.push("=== 割引種別 ===");
    csvContent.push("ID,名前,割引タイプ,割引値,アクティブ,作成日時");
    discountTypes.forEach((d: any) => {
      csvContent.push(
        `${d.id},"${(d.name || "").replace(/"/g, '""')}","${
          d.discount_type
        }","${d.discount_value}",${d.is_active ? "有効" : "無効"},"${
          d.created_at
        }"`
      );
    });
    csvContent.push("");

    // 店販商品データ
    csvContent.push("=== 店販商品 ===");
    csvContent.push("ID,名前,カテゴリ,価格,アクティブ,作成日時");
    retailProducts.forEach((p: any) => {
      csvContent.push(
        `${p.id},"${(p.name || "").replace(/"/g, '""')}","${(
          p.category || ""
        ).replace(/"/g, '""')}",${p.price || ""},${
          p.is_active ? "有効" : "無効"
        },"${p.created_at}"`
      );
    });

    const fileName = `masters_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(`\uFEFF${csvContent.join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          fileName
        )}`,
      },
    });
  } catch (error) {
    console.error("マスターデータエクスポートエラー:", error);
    return NextResponse.json(
      { error: "マスターデータのエクスポートに失敗しました" },
      { status: 500 }
    );
  }
}
