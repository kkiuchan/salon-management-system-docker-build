import db from "@/lib/database";
import { TreatmentInsert } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// GET: 施術データの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const stylistName = searchParams.get("stylistName");

    let query = `
      SELECT t.*, c.name as customer_name 
      FROM treatments t
      JOIN customers c ON t.customer_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (customerId) {
      query += ` AND t.customer_id = ?`;
      params.push(parseInt(customerId));
    }

    if (dateFrom) {
      query += ` AND t.treatment_date >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND t.treatment_date <= ?`;
      params.push(dateTo);
    }

    if (stylistName) {
      query += ` AND t.stylist_name LIKE ?`;
      params.push(`%${stylistName}%`);
    }

    query += ` ORDER BY t.treatment_date DESC, t.treatment_time DESC`;

    const treatments = db.prepare(query).all(...params);
    return NextResponse.json(treatments);
  } catch (error) {
    console.error("施術データ取得エラー:", error);
    return NextResponse.json(
      { error: "施術データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規施術の作成
export async function POST(request: NextRequest) {
  try {
    const body: TreatmentInsert = await request.json();
    console.log("受信した施術データ:", body);

    // 必須フィールドの検証
    if (!body.customer_id) {
      console.error("customer_idが不足しています");
      return NextResponse.json({ error: "顧客IDは必須です" }, { status: 400 });
    }

    if (!body.treatment_date) {
      console.error("treatment_dateが不足しています");
      return NextResponse.json({ error: "施術日は必須です" }, { status: 400 });
    }

    if (!body.stylist_name) {
      console.error("stylist_nameが不足しています");
      return NextResponse.json(
        { error: "スタイリスト名は必須です" },
        { status: 400 }
      );
    }

    const params = [
      body.customer_id,
      body.treatment_date,
      body.treatment_time !== undefined ? body.treatment_time : null,
      body.treatment_end_time !== undefined ? body.treatment_end_time : null,
      body.customer_name !== undefined ? body.customer_name : null,
      body.stylist_name,
      body.treatment_content1 !== undefined ? body.treatment_content1 : null,
      body.treatment_content2 !== undefined ? body.treatment_content2 : null,
      body.treatment_content3 !== undefined ? body.treatment_content3 : null,
      body.treatment_content4 !== undefined ? body.treatment_content4 : null,
      body.treatment_content5 !== undefined ? body.treatment_content5 : null,
      body.treatment_content6 !== undefined ? body.treatment_content6 : null,
      body.treatment_content7 !== undefined ? body.treatment_content7 : null,
      body.treatment_content8 !== undefined ? body.treatment_content8 : null,
      body.treatment_content_other !== undefined
        ? body.treatment_content_other
        : null,
      body.style_memo !== undefined ? body.style_memo : null,
      body.used_chemicals !== undefined ? body.used_chemicals : null,
      body.solution1_time !== undefined ? body.solution1_time : null,
      body.solution2_time !== undefined ? body.solution2_time : null,
      body.color_time1 !== undefined ? body.color_time1 : null,
      body.color_time2 !== undefined ? body.color_time2 : null,
      body.other_details !== undefined ? body.other_details : null,
      body.retail_product1 !== undefined ? body.retail_product1 : null,
      body.retail_product1_quantity !== undefined
        ? body.retail_product1_quantity
        : null,
      body.retail_product1_price !== undefined
        ? body.retail_product1_price
        : null,
      body.retail_product2 !== undefined ? body.retail_product2 : null,
      body.retail_product2_quantity !== undefined
        ? body.retail_product2_quantity
        : null,
      body.retail_product2_price !== undefined
        ? body.retail_product2_price
        : null,
      body.retail_product3 !== undefined ? body.retail_product3 : null,
      body.retail_product3_quantity !== undefined
        ? body.retail_product3_quantity
        : null,
      body.retail_product3_price !== undefined
        ? body.retail_product3_price
        : null,
      body.retail_product_other !== undefined
        ? body.retail_product_other
        : null,
      body.notes !== undefined ? body.notes : null,
      body.conversation_content !== undefined
        ? body.conversation_content
        : null,
      body.treatment_fee !== undefined ? body.treatment_fee : null,
      body.treatment_adjustment !== undefined
        ? body.treatment_adjustment
        : null,
      body.treatment_discount_amount !== undefined
        ? body.treatment_discount_amount
        : null,
      body.treatment_discount_type !== undefined
        ? body.treatment_discount_type
        : null,
      body.retail_fee !== undefined ? body.retail_fee : null,
      body.retail_adjustment !== undefined ? body.retail_adjustment : null,
      body.retail_discount_amount !== undefined
        ? body.retail_discount_amount
        : null,
      body.retail_discount_type !== undefined
        ? body.retail_discount_type
        : null,
      body.total_amount !== undefined ? body.total_amount : null,
      body.payment_method !== undefined ? body.payment_method : null,
      body.next_appointment_date !== undefined
        ? body.next_appointment_date
        : null,
      body.next_appointment_time !== undefined
        ? body.next_appointment_time
        : null,
    ];

    console.log("データベース挿入パラメータ:", params);

    let result;
    try {
      result = db
        .prepare(
          `
        INSERT INTO treatments (
          customer_id, treatment_date, treatment_time, treatment_end_time, customer_name, stylist_name,
          treatment_content1, treatment_content2, treatment_content3, treatment_content4,
          treatment_content5, treatment_content6, treatment_content7, treatment_content8, treatment_content_other,
          style_memo, used_chemicals, solution1_time, solution2_time, color_time1, color_time2,
          other_details, retail_product1, retail_product1_quantity, retail_product1_price,
          retail_product2, retail_product2_quantity, retail_product2_price,
          retail_product3, retail_product3_quantity, retail_product3_price, retail_product_other,
          notes, conversation_content, treatment_fee, treatment_adjustment, treatment_discount_amount,
          treatment_discount_type, retail_fee, retail_adjustment, retail_discount_amount, retail_discount_type,
          total_amount, payment_method, next_appointment_date, next_appointment_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(...params);

      console.log("データベース挿入成功:", result);
    } catch (dbError) {
      console.error("データベース挿入エラー:", dbError);
      throw dbError;
    }

    const newTreatment = db
      .prepare("SELECT * FROM treatments WHERE id = ?")
      .get(result.lastInsertRowid);
    return NextResponse.json(newTreatment, { status: 201 });
  } catch (error) {
    console.error("施術作成エラー:", error);
    console.error("エラーの詳細:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "施術の作成に失敗しました" },
      { status: 500 }
    );
  }
}
