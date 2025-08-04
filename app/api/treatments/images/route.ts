import db, { getImageStoragePath, saveImageFile } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

// POST: 施術画像のアップロード
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const treatmentId = formData.get("treatmentId") as string;
    const customerId = formData.get("customerId") as string;
    const customerName = formData.get("customerName") as string;
    const treatmentDate = formData.get("treatmentDate") as string;
    const files = formData.getAll("files") as File[];

    if (
      !treatmentId ||
      !customerId ||
      !customerName ||
      !treatmentDate ||
      !files.length
    ) {
      return NextResponse.json(
        { error: "必要なパラメータが不足しています" },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const { filePath, relativePath } = getImageStoragePath(
        parseInt(customerId),
        customerName,
        treatmentDate,
        parseInt(treatmentId),
        file.name
      );

      // ファイルを保存
      await saveImageFile(file, filePath);

      // データベースに画像情報を保存
      const result = db
        .prepare(
          `
        INSERT INTO treatment_images (treatment_id, image_url, original_filename, image_order)
        VALUES (?, ?, ?, ?)
      `
        )
        .run(
          parseInt(treatmentId),
          relativePath,
          file.name,
          uploadedImages.length
        );

      uploadedImages.push({
        id: result.lastInsertRowid,
        treatment_id: parseInt(treatmentId),
        image_url: relativePath,
        original_filename: file.name,
        image_order: uploadedImages.length,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message: `${uploadedImages.length}個の画像がアップロードされました`,
        images: uploadedImages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    return NextResponse.json(
      { error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
