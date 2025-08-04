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
        { error: "来店きっかけ名は必須です" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        "UPDATE referral_sources SET name = ?, is_active = ? WHERE id = ?"
      )
      .run(
        name.trim(),
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        idNum
      );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "来店きっかけが見つかりません" },
        { status: 404 }
      );
    }

    const updatedReferralSource = db
      .prepare("SELECT * FROM referral_sources WHERE id = ?")
      .get(idNum);

    return NextResponse.json(updatedReferralSource);
  } catch (error) {
    console.error("来店きっかけ更新エラー:", error);
    return NextResponse.json(
      { error: "来店きっかけの更新に失敗しました" },
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
      .prepare("DELETE FROM referral_sources WHERE id = ?")
      .run(idNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "来店きっかけが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "来店きっかけを削除しました" });
  } catch (error) {
    console.error("来店きっかけ削除エラー:", error);
    return NextResponse.json(
      { error: "来店きっかけの削除に失敗しました" },
      { status: 500 }
    );
  }
}
