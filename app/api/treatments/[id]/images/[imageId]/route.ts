import db, { deleteImageFile } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: treatmentId, imageId } = await params;
    const treatmentIdNum = parseInt(treatmentId);
    const imageIdNum = parseInt(imageId);

    // 画像情報を取得
    const image = db
      .prepare(
        "SELECT * FROM treatment_images WHERE id = ? AND treatment_id = ?"
      )
      .get(imageIdNum, treatmentIdNum) as
      | {
          id: number;
          treatment_id: number;
          image_url: string;
          original_filename?: string;
          image_order: number;
          created_at: string;
        }
      | undefined;

    if (!image) {
      return NextResponse.json(
        { error: "画像が見つかりません" },
        { status: 404 }
      );
    }

    // 画像ファイルを削除
    const imageUrl = image.image_url;
    const fileDeleted = deleteImageFile(imageUrl);

    if (!fileDeleted) {
      console.warn(`画像ファイルが見つかりません: ${imageUrl}`);
    }

    // データベースから画像レコードを削除
    const result = db
      .prepare("DELETE FROM treatment_images WHERE id = ? AND treatment_id = ?")
      .run(imageIdNum, treatmentIdNum);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "画像の削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "画像を削除しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("画像削除エラー:", error);
    return NextResponse.json(
      { error: "画像の削除に失敗しました" },
      { status: 500 }
    );
  }
}
