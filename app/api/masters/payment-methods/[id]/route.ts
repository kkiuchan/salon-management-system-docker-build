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
        { error: "支払い方法名は必須です" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        "UPDATE payment_methods SET name = ?, is_active = ? WHERE id = ?"
      )
      .run(
        name.trim(),
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        idNum
      );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "支払い方法が見つかりません" },
        { status: 404 }
      );
    }

    const updatedPaymentMethod = db
      .prepare("SELECT * FROM payment_methods WHERE id = ?")
      .get(idNum);

    return NextResponse.json(updatedPaymentMethod);
  } catch (error) {
    console.error("支払い方法更新エラー:", error);
    return NextResponse.json(
      { error: "支払い方法の更新に失敗しました" },
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
      .prepare("DELETE FROM payment_methods WHERE id = ?")
      .run(idNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "支払い方法が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "支払い方法を削除しました" });
  } catch (error) {
    console.error("支払い方法削除エラー:", error);
    return NextResponse.json(
      { error: "支払い方法の削除に失敗しました" },
      { status: 500 }
    );
  }
}
