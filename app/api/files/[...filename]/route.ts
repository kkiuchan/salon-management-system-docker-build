import { getImageFilePath } from "@/lib/database";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

// GET: 画像ファイルの配信
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string[] }> }
) {
  try {
    const params = await context.params;
    const filename = params.filename.join("/");
    const filePath = getImageFilePath(filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = filename.split(".").pop()?.toLowerCase();

    let contentType = "application/octet-stream";
    switch (fileExtension) {
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // 1年間キャッシュ
      },
    });
  } catch (error) {
    console.error("ファイル配信エラー:", error);
    return NextResponse.json(
      { error: "ファイルの配信に失敗しました" },
      { status: 500 }
    );
  }
}
