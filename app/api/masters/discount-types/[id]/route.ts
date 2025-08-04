import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, discount_type, discount_value, is_active } =
      await request.json();
    const { id } = await params;
    const idNum = parseInt(id);

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "割引種別名は必須です" },
        { status: 400 }
      );
    }

    if (!discount_type || !["percentage", "fixed"].includes(discount_type)) {
      return NextResponse.json(
        {
          error:
            "割引タイプは 'percentage' または 'fixed' である必要があります",
        },
        { status: 400 }
      );
    }

    if (discount_value === undefined || discount_value < 0) {
      return NextResponse.json(
        { error: "割引値は0以上の数値である必要があります" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        "UPDATE discount_types SET name = ?, discount_type = ?, discount_value = ?, is_active = ? WHERE id = ?"
      )
      .run(
        name.trim(),
        discount_type,
        discount_value,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        idNum
      );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "割引種別が見つかりません" },
        { status: 404 }
      );
    }

    const updatedDiscountType = db
      .prepare("SELECT * FROM discount_types WHERE id = ?")
      .get(idNum);

    return NextResponse.json(updatedDiscountType);
  } catch (error) {
    console.error("割引種別更新エラー:", error);
    return NextResponse.json(
      { error: "割引種別の更新に失敗しました" },
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
        WHERE treatment_discount_type = (SELECT name FROM discount_types WHERE id = ?)
        OR retail_discount_type = (SELECT name FROM discount_types WHERE id = ?)
      `
      )
      .get(idNum, idNum);

    if ((usageCheck as { count: number }).count > 0) {
      return NextResponse.json(
        { error: "この割引種別は使用中のため削除できません" },
        { status: 400 }
      );
    }

    const result = db
      .prepare("DELETE FROM discount_types WHERE id = ?")
      .run(idNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "割引種別が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "割引種別を削除しました" });
  } catch (error) {
    console.error("割引種別削除エラー:", error);
    return NextResponse.json(
      { error: "割引種別の削除に失敗しました" },
      { status: 500 }
    );
  }
}
