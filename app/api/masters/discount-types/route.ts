import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 割引タイプの一覧を取得
export async function GET() {
  try {
    console.log("割引タイプ取得開始");

    const discountTypes = db
      .prepare(
        `
      SELECT * FROM discount_types 
      WHERE is_active = 1
      ORDER BY name
    `
      )
      .all();

    console.log("取得された割引タイプ:", discountTypes);

    return NextResponse.json(discountTypes);
  } catch (error) {
    console.error("割引タイプ取得エラー:", error);
    return NextResponse.json(
      {
        error: "割引タイプの取得に失敗しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: 新しい割引タイプを作成
export async function POST(request: NextRequest) {
  try {
    console.log("割引タイプ作成開始");

    const body = await request.json();
    console.log("リクエストボディ:", body);

    const { name, discount_type = "percentage", discount_value = 0 } = body;

    console.log("解析されたデータ:", { name, discount_type, discount_value });

    if (!name) {
      console.error("割引タイプ名が指定されていません");
      return NextResponse.json(
        { error: "割引タイプ名は必須です" },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = db
      .prepare("SELECT * FROM discount_types WHERE name = ? AND is_active = 1")
      .get(name);

    console.log("重複チェック結果:", existing);

    if (existing) {
      console.error("重複する割引タイプが存在します:", existing);
      return NextResponse.json(
        { error: "同じ名前の割引タイプが既に存在します" },
        { status: 400 }
      );
    }

    console.log("データベース挿入開始");

    const result = db
      .prepare(
        `
      INSERT INTO discount_types (name, discount_type, discount_value, is_active, created_at)
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    `
      )
      .run(name, discount_type, discount_value);

    console.log("挿入結果:", result);

    const newDiscountType = db
      .prepare("SELECT * FROM discount_types WHERE id = ?")
      .get(result.lastInsertRowid);

    console.log("作成された割引タイプ:", newDiscountType);

    return NextResponse.json(newDiscountType, { status: 201 });
  } catch (error) {
    console.error("割引タイプ作成エラー:", error);
    console.error(
      "エラースタック:",
      error instanceof Error ? error.stack : "スタックトレースなし"
    );
    return NextResponse.json(
      {
        error: "割引タイプの作成に失敗しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
