import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 顧客データのエクスポート
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");
    const format = searchParams.get("format") || "csv";

    let query = `
      SELECT 
        c.id, c.furigana, c.name, c.gender, c.phone, c.emergency_contact,
        c.date_of_birth, c.age, c.occupation, c.postal_code, c.address,
        c.visiting_family, c.email, c.blood_type, c.allergies, c.medical_history,
        c.notes, c.referral_source1, c.referral_source2, c.referral_source3,
        c.referral_details, c.created_at, c.updated_at
      FROM customers c
    `;

    const params: (string | number)[] = [];

    if (customerId) {
      query += ` WHERE c.id = ?`;
      params.push(parseInt(customerId));
    }

    query += ` ORDER BY c.created_at DESC`;

    const customers = db.prepare(query).all(...params);

    if (format === "json") {
      return NextResponse.json(customers);
    }

    // CSV形式でエクスポート
    const headers = [
      "ID",
      "フリガナ",
      "名前",
      "性別",
      "電話番号",
      "緊急連絡先",
      "生年月日",
      "年齢",
      "職業",
      "郵便番号",
      "住所",
      "家族来店",
      "メールアドレス",
      "血液型",
      "アレルギー",
      "既往歴",
      "備考",
      "紹介元1",
      "紹介元2",
      "紹介元3",
      "紹介詳細",
      "登録日時",
      "更新日時",
    ];

    const csvContent = [
      headers.join(","),
      ...customers.map((customer: any) =>
        [
          customer.id,
          `"${(customer.furigana || "").replace(/"/g, '""')}"`,
          `"${(customer.name || "").replace(/"/g, '""')}"`,
          `"${(customer.gender || "").replace(/"/g, '""')}"`,
          `"${(customer.phone || "").replace(/"/g, '""')}"`,
          `"${(customer.emergency_contact || "").replace(/"/g, '""')}"`,
          `"${(customer.date_of_birth || "").replace(/"/g, '""')}"`,
          customer.age || "",
          `"${(customer.occupation || "").replace(/"/g, '""')}"`,
          `"${(customer.postal_code || "").replace(/"/g, '""')}"`,
          `"${(customer.address || "").replace(/"/g, '""')}"`,
          `"${(customer.visiting_family || "").replace(/"/g, '""')}"`,
          `"${(customer.email || "").replace(/"/g, '""')}"`,
          `"${(customer.blood_type || "").replace(/"/g, '""')}"`,
          `"${(customer.allergies || "").replace(/"/g, '""')}"`,
          `"${(customer.medical_history || "").replace(/"/g, '""')}"`,
          `"${(customer.notes || "").replace(/"/g, '""')}"`,
          `"${(customer.referral_source1 || "").replace(/"/g, '""')}"`,
          `"${(customer.referral_source2 || "").replace(/"/g, '""')}"`,
          `"${(customer.referral_source3 || "").replace(/"/g, '""')}"`,
          `"${(customer.referral_details || "").replace(/"/g, '""')}"`,
          `"${(customer.created_at || "").replace(/"/g, '""')}"`,
          `"${(customer.updated_at || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const fileName = customerId
      ? `customer_${customerId}_${new Date().toISOString().split("T")[0]}.csv`
      : `customers_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(`\uFEFF${csvContent}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          fileName
        )}`,
      },
    });
  } catch (error) {
    console.error("顧客データエクスポートエラー:", error);
    return NextResponse.json(
      { error: "顧客データのエクスポートに失敗しました" },
      { status: 500 }
    );
  }
}
