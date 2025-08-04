import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    // データベースファイルの存在確認
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    const dbExists = fs.existsSync(dbPath);

    // アップロードディレクトリの存在確認
    const uploadsPath = path.join(process.cwd(), "data", "uploads");
    const uploadsExists = fs.existsSync(uploadsPath);

    // システム情報
    const systemInfo = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        exists: dbExists,
        path: dbPath,
      },
      uploads: {
        exists: uploadsExists,
        path: uploadsPath,
      },
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
    };

    return NextResponse.json(systemInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
