import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 全スタッフデータの取得
export async function GET() {
  try {
    const staff = db.prepare("SELECT * FROM staff ORDER BY name").all();
    return NextResponse.json(staff);
  } catch (error) {
    console.error("スタッフデータ取得エラー:", error);
    return NextResponse.json(
      { error: "スタッフデータの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規スタッフの作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "スタッフ名は必須です" },
        { status: 400 }
      );
    }

    const result = db.prepare("INSERT INTO staff (name) VALUES (?)").run(name);
    const newStaff = db
      .prepare("SELECT * FROM staff WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error("スタッフ作成エラー:", error);
    return NextResponse.json(
      { error: "スタッフの作成に失敗しました" },
      { status: 500 }
    );
  }
}
