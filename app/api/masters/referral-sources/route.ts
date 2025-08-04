import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// GET: 全紹介元データの取得
export async function GET() {
  try {
    const sources = db
      .prepare("SELECT * FROM referral_sources ORDER BY name")
      .all();
    return NextResponse.json(sources);
  } catch (error) {
    console.error("紹介元データ取得エラー:", error);
    return NextResponse.json(
      { error: "紹介元データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規紹介元の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "紹介元名は必須です" },
        { status: 400 }
      );
    }

    const result = db
      .prepare("INSERT INTO referral_sources (name) VALUES (?)")
      .run(name);
    const newSource = db
      .prepare("SELECT * FROM referral_sources WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json(newSource, { status: 201 });
  } catch (error) {
    console.error("紹介元作成エラー:", error);
    return NextResponse.json(
      { error: "紹介元の作成に失敗しました" },
      { status: 500 }
    );
  }
}
