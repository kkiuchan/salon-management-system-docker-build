import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 全施術メニューデータの取得
export async function GET() {
  try {
    const menus = db
      .prepare("SELECT * FROM treatment_menus ORDER BY category, name")
      .all();
    return NextResponse.json(menus);
  } catch (error) {
    console.error("施術メニューデータ取得エラー:", error);
    return NextResponse.json(
      { error: "施術メニューデータの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規施術メニューの作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price } = body;

    if (!name) {
      return NextResponse.json(
        { error: "メニュー名は必須です" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        `
      INSERT INTO treatment_menus (name, category, price) 
      VALUES (?, ?, ?)
    `
      )
      .run(name, category || null, price || null);

    const newMenu = db
      .prepare("SELECT * FROM treatment_menus WHERE id = ?")
      .get(result.lastInsertRowid);
    return NextResponse.json(newMenu, { status: 201 });
  } catch (error) {
    console.error("施術メニュー作成エラー:", error);
    return NextResponse.json(
      { error: "施術メニューの作成に失敗しました" },
      { status: 500 }
    );
  }
}
