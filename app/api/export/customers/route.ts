import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

interface CustomerWithTreatments {
  // 顧客情報
  customer_id: number;
  furigana: string | null;
  customer_name: string | null;
  gender: string | null;
  phone: string | null;
  emergency_contact: string | null;
  date_of_birth: string | null;
  age: number | null;
  occupation: string | null;
  postal_code: string | null;
  address: string | null;
  visiting_family: string | null;
  email: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_history: string | null;
  notes: string | null;
  referral_source1: string | null;
  referral_source2: string | null;
  referral_source3: string | null;
  referral_details: string | null;
  customer_created_at: string | null;
  customer_updated_at: string | null;
  // 施術情報
  treatment_id: number | null;
  treatment_date: string | null;
  treatment_time: string | null;
  treatment_end_time: string | null;
  treatment_customer_name: string | null;
  stylist_name: string | null;
  treatment_fee: number | null;
  retail_fee: number | null;
  total_amount: number | null;
  payment_method: string | null;
  treatment_content1: string | null;
  treatment_content2: string | null;
  treatment_content3: string | null;
  treatment_content4: string | null;
  treatment_content5: string | null;
  treatment_content6: string | null;
  treatment_content7: string | null;
  treatment_content8: string | null;
  treatment_content_other: string | null;
  retail_product1: string | null;
  retail_product1_quantity: number | null;
  retail_product1_price: number | null;
  retail_product2: string | null;
  retail_product2_quantity: number | null;
  retail_product2_price: number | null;
  retail_product3: string | null;
  retail_product3_quantity: number | null;
  retail_product3_price: number | null;
  retail_product_other: string | null;
  treatment_adjustment: number | null;
  retail_adjustment: number | null;
  treatment_discount_amount: number | null;
  retail_discount_amount: number | null;
  treatment_discount_type: string | null;
  retail_discount_type: string | null;
  treatment_created_at: string | null;
}

// GET: 顧客データと施術データのエクスポート
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");
    const format = searchParams.get("format") || "csv";

    // 顧客と施術データを結合したクエリ
    let query = `
      SELECT 
        c.id as customer_id,
        c.furigana,
        c.name as customer_name,
        c.gender,
        c.phone,
        c.emergency_contact,
        c.date_of_birth,
        c.age,
        c.occupation,
        c.postal_code,
        c.address,
        c.visiting_family,
        c.email,
        c.blood_type,
        c.allergies,
        c.medical_history,
        c.notes,
        c.referral_source1,
        c.referral_source2,
        c.referral_source3,
        c.referral_details,
        c.created_at as customer_created_at,
        c.updated_at as customer_updated_at,
        t.id as treatment_id,
        t.treatment_date,
        t.treatment_time,
        t.treatment_end_time,
        t.customer_name as treatment_customer_name,
        t.stylist_name,
        t.treatment_fee,
        t.retail_fee,
        t.total_amount,
        t.payment_method,
        t.treatment_content1,
        t.treatment_content2,
        t.treatment_content3,
        t.treatment_content4,
        t.treatment_content5,
        t.treatment_content6,
        t.treatment_content7,
        t.treatment_content8,
        t.treatment_content_other,
        t.retail_product1,
        t.retail_product1_quantity,
        t.retail_product1_price,
        t.retail_product2,
        t.retail_product2_quantity,
        t.retail_product2_price,
        t.retail_product3,
        t.retail_product3_quantity,
        t.retail_product3_price,
        t.retail_product_other,
        t.treatment_adjustment,
        t.retail_adjustment,
        t.treatment_discount_amount,
        t.retail_discount_amount,
        t.treatment_discount_type,
        t.retail_discount_type,
        t.created_at as treatment_created_at
      FROM customers c
      LEFT JOIN treatments t ON c.id = t.customer_id
    `;

    const params: (string | number)[] = [];

    if (customerId) {
      query += ` WHERE c.id = ?`;
      params.push(parseInt(customerId));
    }

    query += ` ORDER BY c.created_at DESC, t.treatment_date DESC, t.id DESC`;

    const customerWithTreatments = db
      .prepare(query)
      .all(...params) as CustomerWithTreatments[];

    if (format === "json") {
      return NextResponse.json(customerWithTreatments);
    }

    // CSV形式でエクスポート
    const headers = [
      // 顧客情報
      "顧客ID",
      "フリガナ",
      "顧客名",
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
      "顧客登録日時",
      "顧客更新日時",
      // 施術情報
      "施術ID",
      "施術日",
      "施術開始時間",
      "施術終了時間",
      "施術時顧客名",
      "スタッフ名",
      "施術料",
      "商品販売額",
      "合計金額",
      "支払い方法",
      "施術内容1",
      "施術内容2",
      "施術内容3",
      "施術内容4",
      "施術内容5",
      "施術内容6",
      "施術内容7",
      "施術内容8",
      "その他施術内容",
      "商品1",
      "商品1数量",
      "商品1価格",
      "商品2",
      "商品2数量",
      "商品2価格",
      "商品3",
      "商品3数量",
      "商品3価格",
      "その他商品",
      "施術料金調整",
      "商品料金調整",
      "施術割引額",
      "商品割引額",
      "施術割引種別",
      "商品割引種別",
      "施術登録日時",
    ];

    const csvContent = [
      headers.join(","),
      ...customerWithTreatments.map((row: CustomerWithTreatments) =>
        [
          row.customer_id,
          `"${(row.furigana || "").replace(/"/g, '""')}"`,
          `"${(row.customer_name || "").replace(/"/g, '""')}"`,
          `"${(row.gender || "").replace(/"/g, '""')}"`,
          `"${(row.phone || "").replace(/"/g, '""')}"`,
          `"${(row.emergency_contact || "").replace(/"/g, '""')}"`,
          `"${(row.date_of_birth || "").replace(/"/g, '""')}"`,
          row.age || "",
          `"${(row.occupation || "").replace(/"/g, '""')}"`,
          `"${(row.postal_code || "").replace(/"/g, '""')}"`,
          `"${(row.address || "").replace(/"/g, '""')}"`,
          `"${(row.visiting_family || "").replace(/"/g, '""')}"`,
          `"${(row.email || "").replace(/"/g, '""')}"`,
          `"${(row.blood_type || "").replace(/"/g, '""')}"`,
          `"${(row.allergies || "").replace(/"/g, '""')}"`,
          `"${(row.medical_history || "").replace(/"/g, '""')}"`,
          `"${(row.notes || "").replace(/"/g, '""')}"`,
          `"${(row.referral_source1 || "").replace(/"/g, '""')}"`,
          `"${(row.referral_source2 || "").replace(/"/g, '""')}"`,
          `"${(row.referral_source3 || "").replace(/"/g, '""')}"`,
          `"${(row.referral_details || "").replace(/"/g, '""')}"`,
          `"${(row.customer_created_at || "").replace(/"/g, '""')}"`,
          `"${(row.customer_updated_at || "").replace(/"/g, '""')}"`,
          row.treatment_id || "",
          `"${(row.treatment_date || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_time || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_end_time || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_customer_name || "").replace(/"/g, '""')}"`,
          `"${(row.stylist_name || "").replace(/"/g, '""')}"`,
          row.treatment_fee || 0,
          row.retail_fee || 0,
          row.total_amount || 0,
          `"${(row.payment_method || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content1 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content2 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content3 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content4 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content5 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content6 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content7 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content8 || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_content_other || "").replace(/"/g, '""')}"`,
          `"${(row.retail_product1 || "").replace(/"/g, '""')}"`,
          row.retail_product1_quantity || 0,
          row.retail_product1_price || 0,
          `"${(row.retail_product2 || "").replace(/"/g, '""')}"`,
          row.retail_product2_quantity || 0,
          row.retail_product2_price || 0,
          `"${(row.retail_product3 || "").replace(/"/g, '""')}"`,
          row.retail_product3_quantity || 0,
          row.retail_product3_price || 0,
          `"${(row.retail_product_other || "").replace(/"/g, '""')}"`,
          row.treatment_adjustment || 0,
          row.retail_adjustment || 0,
          row.treatment_discount_amount || 0,
          row.retail_discount_amount || 0,
          `"${(row.treatment_discount_type || "").replace(/"/g, '""')}"`,
          `"${(row.retail_discount_type || "").replace(/"/g, '""')}"`,
          `"${(row.treatment_created_at || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const fileName = customerId
      ? `customer_${customerId}_with_treatments_${
          new Date().toISOString().split("T")[0]
        }.csv`
      : `customers_with_treatments_${
          new Date().toISOString().split("T")[0]
        }.csv`;

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
