import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, is_active } = await request.json();
    const { id } = await params;
    const idNum = parseInt(id);

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "スタッフ名は必須です" },
        { status: 400 }
      );
    }

    const result = db
      .prepare("UPDATE staff SET name = ?, is_active = ? WHERE id = ?")
      .run(
        name.trim(),
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        idNum
      );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "スタッフが見つかりません" },
        { status: 404 }
      );
    }

    const updatedStaff = db
      .prepare("SELECT * FROM staff WHERE id = ?")
      .get(idNum);

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("スタッフ更新エラー:", error);
    return NextResponse.json(
      { error: "スタッフの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);

    // 使用中かチェック
    const usageCheck = db
      .prepare(
        `
        SELECT COUNT(*) as count FROM treatments 
        WHERE stylist_name = (SELECT name FROM staff WHERE id = ?)
      `
      )
      .get(idNum);

    if ((usageCheck as { count: number }).count > 0) {
      return NextResponse.json(
        { error: "このスタッフは使用中のため削除できません" },
        { status: 400 }
      );
    }

    const result = db.prepare("DELETE FROM staff WHERE id = ?").run(idNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "スタッフが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "スタッフを削除しました" });
  } catch (error) {
    console.error("スタッフ削除エラー:", error);
    return NextResponse.json(
      { error: "スタッフの削除に失敗しました" },
      { status: 500 }
    );
  }
}
