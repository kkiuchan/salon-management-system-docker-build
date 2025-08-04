import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 全店販商品データの取得
export async function GET() {
  try {
    const products = db
      .prepare("SELECT * FROM retail_products ORDER BY category, name")
      .all();
    return NextResponse.json(products);
  } catch (error) {
    console.error("店販商品データ取得エラー:", error);
    return NextResponse.json(
      { error: "店販商品データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規店販商品の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price } = body;

    if (!name) {
      return NextResponse.json({ error: "商品名は必須です" }, { status: 400 });
    }

    const result = db
      .prepare(
        `
      INSERT INTO retail_products (name, category, price) 
      VALUES (?, ?, ?)
    `
      )
      .run(name, category || null, price || null);

    const newProduct = db
      .prepare("SELECT * FROM retail_products WHERE id = ?")
      .get(result.lastInsertRowid);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("店販商品作成エラー:", error);
    return NextResponse.json(
      { error: "店販商品の作成に失敗しました" },
      { status: 500 }
    );
  }
}
