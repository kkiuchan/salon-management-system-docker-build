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
      return NextResponse.json({ error: "商品名は必須です" }, { status: 400 });
    }

    const result = db
      .prepare(
        "UPDATE retail_products SET name = ?, category = ?, price = ?, is_active = ? WHERE id = ?"
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
        { error: "店販商品が見つかりません" },
        { status: 404 }
      );
    }

    const updatedProduct = db
      .prepare("SELECT * FROM retail_products WHERE id = ?")
      .get(idNum);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("店販商品更新エラー:", error);
    return NextResponse.json(
      { error: "店販商品の更新に失敗しました" },
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
      .prepare("DELETE FROM retail_products WHERE id = ?")
      .run(idNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "店販商品が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "店販商品を削除しました" });
  } catch (error) {
    console.error("店販商品削除エラー:", error);
    return NextResponse.json(
      { error: "店販商品の削除に失敗しました" },
      { status: 500 }
    );
  }
}
