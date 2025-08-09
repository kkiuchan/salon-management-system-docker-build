import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

// GET: バックアップの検証
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupPath = searchParams.get("backup_path");

    if (!backupPath) {
      return NextResponse.json(
        { error: "バックアップパスが指定されていません" },
        { status: 400 }
      );
    }

    console.log("検証リクエスト - backupPath:", backupPath);
    console.log("検証リクエスト - isAbsolute:", path.isAbsolute(backupPath));

    // backupPathが完全なパスの場合はそのまま使用、相対パスの場合は data/backups を基準に結合
    let backupDir;
    if (path.isAbsolute(backupPath)) {
      backupDir = backupPath;
    } else {
      backupDir = path.join(process.cwd(), "data", "backups", backupPath);
    }

    console.log("検証リクエスト - backupDir:", backupDir);
    console.log("検証リクエスト - exists:", fs.existsSync(backupDir));

    const backupDbPath = path.join(backupDir, "database", "salon.db");
    const metadataPath = path.join(backupDir, "metadata.json");

    // バックアップディレクトリの存在確認
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        valid: false,
        error: "バックアップディレクトリが見つかりません",
        debug: {
          backupPath,
          backupDir,
          isAbsolute: path.isAbsolute(backupPath),
          cwd: process.cwd(),
        },
      });
    }

    // データベースファイルの存在確認
    if (!fs.existsSync(backupDbPath)) {
      return NextResponse.json({
        valid: false,
        error: "バックアップデータベースファイルが見つかりません",
        debug: {
          backupDbPath,
          backupDir,
        },
      });
    }

    // メタデータファイルの存在確認
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json({
        valid: false,
        error: "バックアップメタデータファイルが見つかりません",
        debug: {
          metadataPath,
          backupDir,
        },
      });
    }

    // メタデータの読み込み
    let metadata;
    try {
      const metadataContent = fs.readFileSync(metadataPath, "utf-8");
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      return NextResponse.json({
        valid: false,
        error: "バックアップメタデータの読み込みに失敗しました",
        debug: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    // 画像ディレクトリの確認
    const imagesDir = path.join(backupDir, "images");
    const hasImages = fs.existsSync(imagesDir);

    // バックアップサイズを計算（ディレクトリ全体のサイズ）
    let backupSize = 0;
    try {
      const calculateDirSize = (dirPath: string): number => {
        let size = 0;
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            size += calculateDirSize(itemPath);
          } else {
            size += stat.size;
          }
        }
        return size;
      };
      backupSize = calculateDirSize(backupDir);
    } catch (error) {
      console.error("バックアップサイズ計算エラー:", error);
      backupSize = 0;
    }

    return NextResponse.json({
      valid: true,
      backupPath,
      metadata,
      hasImages,
      backupSize,
      createdAt: metadata.created_at,
    });
  } catch (error) {
    console.error("バックアップ検証エラー:", error);
    return NextResponse.json(
      { error: "バックアップの検証に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: バックアップからの復元
export async function POST(request: NextRequest) {
  try {
    let backupPath: string | null = null;
    let restoreMode: string = "full";
    let includeImages: boolean = true;
    let includeMasters: boolean = true;

    // Content-Typeを確認して、FormDataかJSONかを判定
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      // JSON形式の場合
      const body = await request.json();
      backupPath = body.backupPath;
      restoreMode = body.restoreMode || "full";
      includeImages = body.includeImages !== false;
      includeMasters = body.includeMasters !== false;
    } else {
      // FormData形式の場合
      const formData = await request.formData();
      backupPath = formData.get("backup_path") as string;
      restoreMode = (formData.get("restore_mode") as string) || "full";
      includeImages = formData.get("include_images") === "true";
      includeMasters = formData.get("include_masters") === "true";
    }

    console.log("復元リクエスト - 受信データ:", {
      backupPath,
      restoreMode,
      includeImages,
      includeMasters,
      contentType,
    });

    if (!backupPath) {
      return NextResponse.json(
        { error: "バックアップパスが指定されていません" },
        { status: 400 }
      );
    }

    console.log("復元リクエスト - backupPath:", backupPath);
    console.log("復元リクエスト - isAbsolute:", path.isAbsolute(backupPath));

    // backupPathが完全なパスの場合はそのまま使用、相対パスの場合は data/backups を基準に結合
    let backupDir;
    if (path.isAbsolute(backupPath)) {
      backupDir = backupPath;
    } else {
      backupDir = path.join(process.cwd(), "data", "backups", backupPath);
    }

    console.log("復元リクエスト - backupDir:", backupDir);

    const backupDbPath = path.join(backupDir, "database", "salon.db");

    if (!fs.existsSync(backupDbPath)) {
      return NextResponse.json(
        { error: "バックアップデータベースファイルが見つかりません" },
        { status: 404 }
      );
    }

    // 現在のデータベースをバックアップ
    const currentDbPath = path.join(process.cwd(), "data", "salon.db");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupCurrentPath = path.join(
      process.cwd(),
      "data",
      `salon_backup_before_restore_${timestamp}.db`
    );

    console.log("復元処理開始 - 現在のDBパス:", currentDbPath);
    console.log("復元処理開始 - バックアップDBパス:", backupDbPath);

    console.log("復元処理 - 現在のDB存在確認:", fs.existsSync(currentDbPath));
    console.log(
      "復元処理 - バックアップDB存在確認:",
      fs.existsSync(backupDbPath)
    );

    if (fs.existsSync(currentDbPath)) {
      console.log("復元処理 - 現在のDBをバックアップ中:", backupCurrentPath);
      fs.copyFileSync(currentDbPath, backupCurrentPath);
      console.log("復元処理 - 現在のDBバックアップ完了");
    }

    // バックアップデータベースを復元
    console.log("復元処理 - バックアップDBを復元中");
    fs.copyFileSync(backupDbPath, currentDbPath);
    console.log("復元処理 - バックアップDB復元完了");

    // 画像ファイルも復元（存在する場合）
    if (includeImages) {
      const backupImagesDir = path.join(backupDir, "images");
      const currentImagesDir = path.join(process.cwd(), "data", "uploads");

      console.log("復元処理 - バックアップ画像ディレクトリ:", backupImagesDir);
      console.log("復元処理 - 現在の画像ディレクトリ:", currentImagesDir);
      console.log(
        "復元処理 - バックアップ画像ディレクトリ存在:",
        fs.existsSync(backupImagesDir)
      );
      console.log(
        "復元処理 - 現在の画像ディレクトリ存在:",
        fs.existsSync(currentImagesDir)
      );

      if (fs.existsSync(backupImagesDir)) {
        console.log("復元処理 - 画像復元開始");

        if (restoreMode === "full") {
          // 完全上書きモードの場合、現在の画像ディレクトリをバックアップ
          if (fs.existsSync(currentImagesDir)) {
            const backupCurrentImagesPath = path.join(
              process.cwd(),
              "data",
              `uploads_backup_before_restore_${timestamp}`
            );
            console.log(
              "復元処理 - 現在の画像ディレクトリをバックアップ中:",
              backupCurrentImagesPath
            );
            fs.renameSync(currentImagesDir, backupCurrentImagesPath);
            console.log("復元処理 - 現在の画像ディレクトリバックアップ完了");
          }

          // バックアップ画像を復元
          console.log("復元処理 - バックアップ画像を復元中");
          fs.cpSync(backupImagesDir, currentImagesDir, { recursive: true });
          console.log("復元処理 - バックアップ画像復元完了");
        } else {
          // 統合モードの場合、既存の画像を保持して追加
          console.log("復元処理 - 統合モードで画像を復元中");
          if (!fs.existsSync(currentImagesDir)) {
            fs.mkdirSync(currentImagesDir, { recursive: true });
          }
          fs.cpSync(backupImagesDir, currentImagesDir, { recursive: true });
          console.log("復元処理 - 統合モード画像復元完了");
        }
      } else {
        console.log(
          "復元処理 - バックアップ画像ディレクトリが存在しないため、画像復元をスキップ"
        );
      }
    } else {
      console.log("復元処理 - 画像復元が無効化されているため、スキップ");
    }

    // トランザクションでDBレコードをバックアップDBから上書き（顧客と施術データの整合性確保）
    try {
      const sqlite3 = require("better-sqlite3");
      const liveDb = new sqlite3(path.join(process.cwd(), "data", "salon.db"));
      const backupDb = new sqlite3(backupDbPath, { readonly: true });

      // テーブル毎に入れ替え（既存データは削除→挿入）
      const copyTable = (table: string) => {
        const rows = backupDb.prepare(`SELECT * FROM ${table}`).all();
        const columns = rows.length
          ? Object.keys(rows[0])
          : (backupDb
              .prepare(`PRAGMA table_info(${table})`)
              .all()
              .map((r: any) => r.name) as string[]);

        const placeholders = columns.map(() => "?").join(",");

        liveDb.prepare(`DELETE FROM ${table}`).run();
        const stmt = liveDb.prepare(
          `INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`
        );
        const tx = liveDb.transaction((rs: any[]) => {
          for (const r of rs) stmt.run(columns.map((c) => (r as any)[c]));
        });
        tx(rows);
      };

      liveDb.pragma("foreign_keys = OFF");
      const txAll = liveDb.transaction(() => {
        copyTable("customers");
        copyTable("treatments");
        copyTable("treatment_images");
        copyTable("staff");
        copyTable("treatment_menus");
        copyTable("retail_products");
        copyTable("referral_sources");
        copyTable("payment_methods");
        copyTable("discount_types");
      });
      txAll();
      liveDb.pragma("foreign_keys = ON");

      liveDb.close();
      backupDb.close();
      console.log("復元処理 - DBレコードの上書き完了");
    } catch (e) {
      console.warn(
        "復元処理 - DBレコードの上書きに失敗しました（スキップ）:",
        e
      );
    }

    console.log("復元処理 - 復元完了");

    // SQLite WAL/SHM を削除してクリーンな状態にする
    try {
      const walPath = path.join(process.cwd(), "data", "salon.db-wal");
      const shmPath = path.join(process.cwd(), "data", "salon.db-shm");
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
        console.log("復元後クリーンアップ - WAL を削除:", walPath);
      }
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath);
        console.log("復元後クリーンアップ - SHM を削除:", shmPath);
      }
    } catch (e) {
      console.warn("復元後クリーンアップ中に警告:", e);
    }

    const response = NextResponse.json({
      message: "バックアップからの復元が完了しました",
      backupPath,
      restoredAt: new Date().toISOString(),
      note: "数秒後にアプリが再起動して変更が反映されます",
    });

    // 少し待ってからプロセスを終了し、Docker の restart policy で自動再起動させる
    setTimeout(() => {
      try {
        console.log("復元後の再起動のためプロセスを終了します");
        // 正常終了コード
        process.exit(0);
      } catch (_) {
        // 何もしない
      }
    }, 500);

    return response;
  } catch (error) {
    console.error("復元エラー:", error);
    console.error("復元エラーの詳細:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
    });
    return NextResponse.json(
      {
        error: "バックアップからの復元に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
