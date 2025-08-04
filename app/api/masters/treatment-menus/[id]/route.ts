import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, category, price, is_active } = await request.json();
    const { id } = await params;
    const idNum = parseInt(id);

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "メニュー名は必須です" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        "UPDATE treatment_menus SET name = ?, category = ?, price = ?, is_active = ? WHERE id = ?"
      )
      .run(
        name.trim(),
        category,
        price,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        idNum
      );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "施術メニューが見つかりません" },
        { status: 404 }
      );
    }

    const updatedMenu = db
      .prepare("SELECT * FROM treatment_menus WHERE id = ?")
      .get(idNum);

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error("施術メニュー更新エラー:", error);
    return NextResponse.json(
      { error: "施術メニューの更新に失敗しました" },
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

    const result = db
      .prepare("DELETE FROM treatment_menus WHERE id = ?")
      .run(idNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "施術メニューが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "施術メニューを削除しました" });
  } catch (error) {
    console.error("施術メニュー削除エラー:", error);
    return NextResponse.json(
      { error: "施術メニューの削除に失敗しました" },
      { status: 500 }
    );
  }
}
