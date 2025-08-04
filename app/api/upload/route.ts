import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

// POST: ファイルアップロード
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが指定されていません" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // アップロードディレクトリの作成
    const uploadDir = path.join(process.cwd(), "data", "uploads", "temp");
    await writeFile(path.join(uploadDir, file.name), buffer);

    return NextResponse.json({
      message: "ファイルがアップロードされました",
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("ファイルアップロードエラー:", error);
    return NextResponse.json(
      { error: "ファイルのアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
