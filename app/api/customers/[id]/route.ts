import db from "@/lib/database";
import { CustomerUpdate } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// GET: 特定の顧客データを取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { error: "IDが指定されていません" },
        { status: 400 }
      );
    }

    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "無効な顧客IDです" }, { status: 400 });
    }

    const customer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customerId);

    if (!customer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("顧客データ取得エラー:", error);
    return NextResponse.json(
      { error: "顧客データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 顧客データの更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { error: "IDが指定されていません" },
        { status: 400 }
      );
    }

    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "無効な顧客IDです" }, { status: 400 });
    }

    const body: CustomerUpdate = await request.json();

    // 顧客の存在確認
    const existingCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customerId);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    // 更新可能なフィールドのリスト
    const updateFields = [
      "furigana",
      "name",
      "gender",
      "phone",
      "emergency_contact",
      "date_of_birth",
      "age",
      "occupation",
      "postal_code",
      "address",
      "visiting_family",
      "email",
      "blood_type",
      "allergies",
      "medical_history",
      "notes",
      "referral_source1",
      "referral_source2",
      "referral_source3",
      "referral_details",
    ];

    // 更新するフィールドを動的に構築
    const setClause = updateFields
      .filter((field) => body[field as keyof CustomerUpdate] !== undefined)
      .map((field) => `${field} = ?`)
      .join(", ");

    if (!setClause) {
      return NextResponse.json(
        { error: "更新するデータがありません" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE customers 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const updateParams = updateFields
      .filter((field) => body[field as keyof CustomerUpdate] !== undefined)
      .map((field) => body[field as keyof CustomerUpdate]);

    db.prepare(query).run(...updateParams, customerId);

    const updatedCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customerId);
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("顧客更新エラー:", error);
    return NextResponse.json(
      { error: "顧客の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 顧客データの削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { error: "IDが指定されていません" },
        { status: 400 }
      );
    }

    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "無効な顧客IDです" }, { status: 400 });
    }

    // 顧客の存在確認
    const existingCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customerId);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: "顧客が見つかりません" },
        { status: 404 }
      );
    }

    // 関連する施術データも削除される（CASCADE制約により）
    db.prepare("DELETE FROM customers WHERE id = ?").run(customerId);

    return NextResponse.json({ message: "顧客が正常に削除されました" });
  } catch (error) {
    console.error("顧客削除エラー:", error);
    return NextResponse.json(
      { error: "顧客の削除に失敗しました" },
      { status: 500 }
    );
  }
}
