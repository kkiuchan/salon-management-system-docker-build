import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 支払い方法の一覧を取得
export async function GET() {
  try {
    const paymentMethods = db
      .prepare(
        `
      SELECT * FROM payment_methods 
      ORDER BY name
    `
      )
      .all();

    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error("支払い方法取得エラー:", error);
    return NextResponse.json(
      { error: "支払い方法の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新しい支払い方法を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "支払い方法名は必須です" },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = db
      .prepare("SELECT * FROM payment_methods WHERE name = ?")
      .get(name);

    if (existing) {
      return NextResponse.json(
        { error: "同じ名前の支払い方法が既に存在します" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        `
      INSERT INTO payment_methods (name) VALUES (?)
    `
      )
      .run(name);

    const newPaymentMethod = db
      .prepare("SELECT * FROM payment_methods WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json(newPaymentMethod, { status: 201 });
  } catch (error) {
    console.error("支払い方法作成エラー:", error);
    return NextResponse.json(
      { error: "支払い方法の作成に失敗しました" },
      { status: 500 }
    );
  }
}
