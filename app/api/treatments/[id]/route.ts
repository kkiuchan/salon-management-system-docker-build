import db, { deleteImageFile, imageFileExists } from "@/lib/database";
import { TreatmentUpdate } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// GET: 特定の施術データを取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const treatmentId = parseInt(params.id);
    if (isNaN(treatmentId)) {
      return NextResponse.json({ error: "無効な施術IDです" }, { status: 400 });
    }

    const treatment = db
      .prepare(
        `
      SELECT t.*, c.name as customer_name 
      FROM treatments t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `
      )
      .get(treatmentId);

    if (!treatment) {
      return NextResponse.json(
        { error: "施術が見つかりません" },
        { status: 404 }
      );
    }

    // 関連する画像データを取得
    const treatmentImages = db
      .prepare(
        `
      SELECT id, treatment_id, image_url, original_filename, image_order, created_at
      FROM treatment_images 
      WHERE treatment_id = ? 
      ORDER BY image_order ASC, created_at ASC
    `
      )
      .all(treatmentId);

    // 施術データと画像データを結合
    const treatmentWithImages = {
      ...(treatment as any),
      treatment_images: treatmentImages,
    };

    return NextResponse.json(treatmentWithImages);
  } catch (error) {
    console.error("施術データ取得エラー:", error);
    return NextResponse.json(
      { error: "施術データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 施術データの更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const treatmentId = parseInt(params.id);
    if (isNaN(treatmentId)) {
      return NextResponse.json({ error: "無効な施術IDです" }, { status: 400 });
    }

    const body: TreatmentUpdate = await request.json();

    // 施術の存在確認
    const existingTreatment = db
      .prepare("SELECT * FROM treatments WHERE id = ?")
      .get(treatmentId);
    if (!existingTreatment) {
      return NextResponse.json(
        { error: "施術が見つかりません" },
        { status: 404 }
      );
    }

    // 更新可能なフィールドのリスト
    const updateFields = [
      "customer_id",
      "treatment_date",
      "treatment_time",
      "treatment_end_time",
      "customer_name",
      "stylist_name",
      "treatment_content1",
      "treatment_content2",
      "treatment_content3",
      "treatment_content4",
      "treatment_content5",
      "treatment_content6",
      "treatment_content7",
      "treatment_content8",
      "treatment_content_other",
      "style_memo",
      "used_chemicals",
      "solution1_time",
      "solution2_time",
      "color_time1",
      "color_time2",
      "other_details",
      "retail_product1",
      "retail_product1_quantity",
      "retail_product1_price",
      "retail_product2",
      "retail_product2_quantity",
      "retail_product2_price",
      "retail_product3",
      "retail_product3_quantity",
      "retail_product3_price",
      "retail_product_other",
      "notes",
      "conversation_content",
      "treatment_fee",
      "treatment_adjustment",
      "treatment_discount_amount",
      "treatment_discount_type",
      "retail_fee",
      "retail_adjustment",
      "retail_discount_amount",
      "retail_discount_type",
      "total_amount",
      "payment_method",
      "next_appointment_date",
      "next_appointment_time",
    ];

    // 更新するフィールドを動的に構築
    const setClause = updateFields
      .filter((field) => body[field as keyof TreatmentUpdate] !== undefined)
      .map((field) => `${field} = ?`)
      .join(", ");

    if (!setClause) {
      return NextResponse.json(
        { error: "更新するデータがありません" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE treatments 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const updateParams = updateFields
      .filter((field) => body[field as keyof TreatmentUpdate] !== undefined)
      .map((field) => body[field as keyof TreatmentUpdate]);

    db.prepare(query).run(...updateParams, treatmentId);

    const updatedTreatment = db
      .prepare("SELECT * FROM treatments WHERE id = ?")
      .get(treatmentId);
    return NextResponse.json(updatedTreatment);
  } catch (error) {
    console.error("施術更新エラー:", error);
    return NextResponse.json(
      { error: "施術の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 施術データの削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const treatmentId = parseInt(params.id);
    if (isNaN(treatmentId)) {
      return NextResponse.json({ error: "無効な施術IDです" }, { status: 400 });
    }

    // 施術の存在確認
    const existingTreatment = db
      .prepare("SELECT * FROM treatments WHERE id = ?")
      .get(treatmentId);
    if (!existingTreatment) {
      return NextResponse.json(
        { error: "施術が見つかりません" },
        { status: 404 }
      );
    }

    // 物理画像ファイルを先に削除
    const images = db
      .prepare(`SELECT image_url FROM treatment_images WHERE treatment_id = ?`)
      .all(treatmentId) as Array<{ image_url: string }>;

    for (const row of images) {
      if (row.image_url) {
        try {
          if (imageFileExists(row.image_url)) {
            deleteImageFile(row.image_url);
          }
        } catch (_) {}
      }
    }

    // DBレコードも安全に削除（CASCADEが効かないDBでも確実に）
    const remove = db.transaction((tid: number) => {
      db.prepare(`DELETE FROM treatment_images WHERE treatment_id = ?`).run(
        tid
      );
      db.prepare(`DELETE FROM treatments WHERE id = ?`).run(tid);
    });
    remove(treatmentId);

    return NextResponse.json({ message: "施術が正常に削除されました" });
  } catch (error) {
    console.error("施術削除エラー:", error);
    return NextResponse.json(
      { error: "施術の削除に失敗しました" },
      { status: 500 }
    );
  }
}
