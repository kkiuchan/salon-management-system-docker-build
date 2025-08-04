// @ts-nocheck
import db, { dataDir, uploadsDir } from "@/lib/database";
import archiver from "archiver";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

// バックアップディレクトリの作成
const createBackupDirectory = (backupName: string) => {
  const backupDir = path.join(process.cwd(), "backups", backupName);
  const databaseDir = path.join(backupDir, "database");
  const imagesDir = path.join(backupDir, "images");
  const exportsDir = path.join(backupDir, "exports");

  // ディレクトリ作成
  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(databaseDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(exportsDir, { recursive: true });

  return { backupDir, databaseDir, imagesDir, exportsDir };
};

// データベースのコピー
const copyDatabase = (databaseDir: string) => {
  const sourceDbPath = path.join(dataDir, "salon.db");
  const targetDbPath = path.join(databaseDir, "salon.db");

  if (fs.existsSync(sourceDbPath)) {
    fs.copyFileSync(sourceDbPath, targetDbPath);
    return true;
  }
  return false;
};

// 画像ファイルのコピー（顧客別・日付別に分類）
const copyImages = (imagesDir: string) => {
  let copiedCount = 0;

  // 新しい構造の画像データを取得
  const treatmentImages = db
    .prepare(
      `
    SELECT 
      ti.id,
      ti.image_url,
      ti.original_filename,
      t.id as treatment_id,
      t.treatment_date,
      c.name as customer_name,
      c.id as customer_id
    FROM treatment_images ti
    JOIN treatments t ON ti.treatment_id = t.id
    JOIN customers c ON t.customer_id = c.id
    WHERE ti.image_url LIKE 'customers/%'
  `
    )
    .all() as Array<{
    id: number;
    image_url: string;
    original_filename: string;
    treatment_id: number;
    treatment_date: string;
    customer_name: string;
    customer_id: number;
  }>;

  // 新しい構造の画像をコピー
  treatmentImages.forEach((image) => {
    // 新しい構造の場合: customers/顧客名/日付/treatment_123_filename.jpg
    const sourcePath = path.join(
      process.cwd(),
      "data",
      "uploads",
      ...image.image_url.split("/")
    );

    if (fs.existsSync(sourcePath)) {
      // 顧客名を安全なディレクトリ名に変換
      const safeCustomerName = image.customer_name.replace(
        /[<>:"/\\|?*]/g,
        "_"
      );

      // 日付をフォーマット
      const treatmentDate = new Date(image.treatment_date);
      const dateStr = treatmentDate.toISOString().split("T")[0]; // YYYY-MM-DD形式

      // ディレクトリ構造: images/customers/{顧客名}/{日付}/
      const customerDir = path.join(imagesDir, "customers", safeCustomerName);
      const dateDir = path.join(customerDir, dateStr);

      // ディレクトリ作成
      fs.mkdirSync(customerDir, { recursive: true });
      fs.mkdirSync(dateDir, { recursive: true });

      // ファイル名を取得（既に新しい構造になっている）
      const fileName = image.image_url.split("/").pop() || "";
      const targetPath = path.join(dateDir, fileName);

      // ファイルコピー
      fs.copyFileSync(sourcePath, targetPath);
      copiedCount++;
    }
  });

  // 古い構造の画像データも処理（後方互換性のため）
  const oldTreatmentImages = db
    .prepare(
      `
    SELECT 
      ti.id,
      ti.image_url,
      ti.original_filename,
      t.id as treatment_id,
      t.treatment_date,
      c.name as customer_name,
      c.id as customer_id
    FROM treatment_images ti
    JOIN treatments t ON ti.treatment_id = t.id
    JOIN customers c ON t.customer_id = c.id
    WHERE ti.image_url LIKE '/api/files/%'
  `
    )
    .all() as Array<{
    id: number;
    image_url: string;
    original_filename: string;
    treatment_id: number;
    treatment_date: string;
    customer_name: string;
    customer_id: number;
  }>;

  // 古い構造の画像をコピー
  oldTreatmentImages.forEach((image) => {
    const fileName = image.image_url.replace("/api/files/", "");
    const sourcePath = path.join(uploadsDir, fileName);

    if (fs.existsSync(sourcePath)) {
      // 顧客名を安全なディレクトリ名に変換
      const safeCustomerName = image.customer_name.replace(
        /[<>:"/\\|?*]/g,
        "_"
      );

      // 日付をフォーマット
      const treatmentDate = new Date(image.treatment_date);
      const dateStr = treatmentDate.toISOString().split("T")[0]; // YYYY-MM-DD形式

      // ディレクトリ構造: images/customers/{顧客名}/{日付}/
      const customerDir = path.join(imagesDir, "customers", safeCustomerName);
      const dateDir = path.join(customerDir, dateStr);

      // ディレクトリ作成
      fs.mkdirSync(customerDir, { recursive: true });
      fs.mkdirSync(dateDir, { recursive: true });

      // ファイル名に施術IDを含める
      const newFileName = `treatment_${image.treatment_id}_${fileName}`;
      const targetPath = path.join(dateDir, newFileName);

      // ファイルコピー
      fs.copyFileSync(sourcePath, targetPath);
      copiedCount++;
    }
  });

  return copiedCount;
};

// CSVエクスポート
const exportToCSV = (exportsDir: string) => {
  // 顧客データエクスポート
  const customersQuery = `
    SELECT 
      c.*,
      t.id as treatment_id,
      t.treatment_date,
      t.treatment_time,
      t.stylist_name,
      t.treatment_content1,
      t.treatment_content2,
      t.treatment_content3,
      t.treatment_content4,
      t.treatment_content5,
      t.treatment_content6,
      t.treatment_content7,
      t.treatment_content8,
      t.style_memo,
      t.used_chemicals,
      t.solution1_time,
      t.solution2_time,
      t.color_time1,
      t.color_time2,
      t.other_details,
      t.retail_product1,
      t.retail_product1_quantity,
      t.retail_product2,
      t.retail_product2_quantity,
      t.retail_product3,
      t.retail_product3_quantity,
      t.retail_product1_price,
      t.retail_product2_price,
      t.retail_product3_price,
      t.notes,
      t.conversation_content,
      t.treatment_fee,
      t.treatment_discount_amount,
      t.treatment_discount_type,
      t.retail_fee,
      t.retail_discount_amount,
      t.retail_discount_type,
      t.total_amount,
      t.payment_method,
      t.next_appointment_date,
      t.next_appointment_time,
      t.created_at as treatment_created_at,
      t.updated_at as treatment_updated_at,
      GROUP_CONCAT(ti.image_url, '|') as image_urls
    FROM customers c
    LEFT JOIN treatments t ON c.id = t.customer_id
    LEFT JOIN treatment_images ti ON t.id = ti.treatment_id
    GROUP BY c.id, t.id 
    ORDER BY c.id, t.treatment_date DESC
  `;

  const customersData = db.prepare(customersQuery).all() as any[];

  // CSVヘッダー
  const headers = [
    "顧客ID",
    "フリガナ",
    "顧客名",
    "性別",
    "電話番号",
    "緊急連絡先",
    "生年月日",
    "年齢",
    "職業",
    "郵便番号",
    "住所",
    "同伴者",
    "メールアドレス",
    "血液型",
    "アレルギー",
    "既往歴",
    "メモ",
    "来店きっかけ1",
    "来店きっかけ2",
    "来店きっかけ3",
    "紹介詳細",
    "顧客登録日",
    "顧客更新日",
    "施術ID",
    "施術日",
    "施術時間",
    "スタイリスト",
    "施術内容1",
    "施術内容2",
    "施術内容3",
    "施術内容4",
    "施術内容5",
    "施術内容6",
    "施術内容7",
    "施術内容8",
    "スタイルメモ",
    "使用薬剤",
    "液1時間",
    "液2時間",
    "カラー時間1",
    "カラー時間2",
    "その他詳細",
    "店販商品1",
    "店販商品1個数",
    "店販商品2",
    "店販商品2個数",
    "店販商品3",
    "店販商品3個数",
    "店販商品1価格",
    "店販商品2価格",
    "店販商品3価格",
    "施術メモ",
    "会話内容",
    "施術料金",
    "施術割引金額",
    "施術割引種別",
    "店販料金",
    "店販割引金額",
    "店販割引種別",
    "合計金額",
    "支払い方法",
    "次回予約日",
    "次回予約時間",
    "施術登録日",
    "施術更新日",
    "画像URL",
  ];

  // BOMを追加してExcel対応
  const bom = "\uFEFF";
  let csv = bom + headers.join(",") + "\n";

  customersData.forEach((row: any) => {
    const values = [
      row.id || "",
      `"${(row.furigana || "").replace(/"/g, '""')}"`,
      `"${(row.name || "").replace(/"/g, '""')}"`,
      row.gender || "",
      row.phone || "",
      row.emergency_contact || "",
      row.date_of_birth || "",
      row.age || "",
      `"${(row.occupation || "").replace(/"/g, '""')}"`,
      row.postal_code || "",
      `"${(row.address || "").replace(/"/g, '""')}"`,
      `"${(row.visiting_family || "").replace(/"/g, '""')}"`,
      row.email || "",
      row.blood_type || "",
      `"${(row.allergies || "").replace(/"/g, '""')}"`,
      `"${(row.medical_history || "").replace(/"/g, '""')}"`,
      `"${(row.notes || "").replace(/"/g, '""')}"`,
      `"${(row.referral_source1 || "").replace(/"/g, '""')}"`,
      `"${(row.referral_source2 || "").replace(/"/g, '""')}"`,
      `"${(row.referral_source3 || "").replace(/"/g, '""')}"`,
      `"${(row.referral_details || "").replace(/"/g, '""')}"`,
      row.created_at || "",
      row.updated_at || "",
      row.treatment_id || "",
      row.treatment_date || "",
      row.treatment_time || "",
      `"${(row.stylist_name || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content1 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content2 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content3 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content4 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content5 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content6 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content7 || "").replace(/"/g, '""')}"`,
      `"${(row.treatment_content8 || "").replace(/"/g, '""')}"`,
      `"${(row.style_memo || "").replace(/"/g, '""')}"`,
      `"${(row.used_chemicals || "").replace(/"/g, '""')}"`,
      row.solution1_time || "",
      row.solution2_time || "",
      row.color_time1 || "",
      row.color_time2 || "",
      `"${(row.other_details || "").replace(/"/g, '""')}"`,
      `"${(row.retail_product1 || "").replace(/"/g, '""')}"`,
      row.retail_product1_quantity || "",
      `"${(row.retail_product2 || "").replace(/"/g, '""')}"`,
      row.retail_product2_quantity || "",
      `"${(row.retail_product3 || "").replace(/"/g, '""')}"`,
      row.retail_product3_quantity || "",
      row.retail_product1_price || "",
      row.retail_product2_price || "",
      row.retail_product3_price || "",
      `"${(row.notes || "").replace(/"/g, '""')}"`,
      `"${(row.conversation_content || "").replace(/"/g, '""')}"`,
      row.treatment_fee || "",
      row.treatment_discount_amount || "",
      `"${(row.treatment_discount_type || "").replace(/"/g, '""')}"`,
      row.retail_fee || "",
      row.retail_discount_amount || "",
      `"${(row.retail_discount_type || "").replace(/"/g, '""')}"`,
      row.total_amount || "",
      `"${(row.payment_method || "").replace(/"/g, '""')}"`,
      row.next_appointment_date || "",
      row.next_appointment_time || "",
      row.treatment_created_at || "",
      row.treatment_updated_at || "",
      `"${(row.image_urls || "").replace(/"/g, '""')}"`,
    ];
    csv += values.join(",") + "\n";
  });

  fs.writeFileSync(path.join(exportsDir, "customers.csv"), csv);

  // マスターデータエクスポート
  const mastersData: any[] = [];

  // 施術メニュー
  const treatmentMenus = db
    .prepare("SELECT * FROM treatment_menus ORDER BY category, name")
    .all() as any[];
  mastersData.push(
    ...treatmentMenus.map((item: any) => ({
      ...item,
      master_type: "treatment_menus",
    }))
  );

  // 店販商品
  const retailProducts = db
    .prepare("SELECT * FROM retail_products ORDER BY category, name")
    .all() as any[];
  mastersData.push(
    ...retailProducts.map((item: any) => ({
      ...item,
      master_type: "retail_products",
    }))
  );

  // スタッフ
  const staff = db.prepare("SELECT * FROM staff ORDER BY name").all() as any[];
  mastersData.push(
    ...staff.map((item: any) => ({ ...item, master_type: "staff" }))
  );

  // 割引種別
  const discountTypes = db
    .prepare("SELECT * FROM discount_types ORDER BY name")
    .all() as any[];
  mastersData.push(
    ...discountTypes.map((item: any) => ({
      ...item,
      master_type: "discount_types",
    }))
  );

  // 支払い方法
  const paymentMethods = db
    .prepare("SELECT * FROM payment_methods ORDER BY name")
    .all() as any[];
  mastersData.push(
    ...paymentMethods.map((item: any) => ({
      ...item,
      master_type: "payment_methods",
    }))
  );

  // 来店きっかけ
  const referralSources = db
    .prepare("SELECT * FROM referral_sources ORDER BY name")
    .all() as any[];
  mastersData.push(
    ...referralSources.map((item: any) => ({
      ...item,
      master_type: "referral_sources",
    }))
  );

  // マスターデータCSV
  const masterHeaders = [
    "マスタータイプ",
    "ID",
    "名前",
    "価格",
    "カテゴリ",
    "説明",
    "割引タイプ",
    "割引値",
    "役職",
    "電話番号",
    "メールアドレス",
    "有効フラグ",
    "作成日",
    "更新日",
  ];

  const masterBom = "\uFEFF";
  let masterCsv = masterBom + masterHeaders.join(",") + "\n";

  mastersData.forEach((row: any) => {
    const values = [
      row.master_type || "",
      row.id || "",
      `"${(row.name || "").replace(/"/g, '""')}"`,
      row.price || "",
      `"${(row.category || "").replace(/"/g, '""')}"`,
      `"${(row.description || "").replace(/"/g, '""')}"`,
      row.discount_type || "",
      row.discount_value || "",
      `"${(row.position || "").replace(/"/g, '""')}"`,
      row.phone || "",
      row.email || "",
      row.is_active ? "1" : "0",
      row.created_at || "",
      row.updated_at || "",
    ];
    masterCsv += values.join(",") + "\n";
  });

  fs.writeFileSync(path.join(exportsDir, "masters.csv"), masterCsv);
};

// メタデータファイルの作成
const createMetadata = (backupDir: string, imageCount: number) => {
  const metadata = {
    backup_info: {
      created_at: new Date().toISOString(),
      version: "1.0.0",
      system: "salon-management-system",
    },
    data_summary: {
      customers: db.prepare("SELECT COUNT(*) as count FROM customers").get()
        .count,
      treatments: db.prepare("SELECT COUNT(*) as count FROM treatments").get()
        .count,
      images: imageCount,
      treatment_menus: db
        .prepare("SELECT COUNT(*) as count FROM treatment_menus")
        .get().count,
      retail_products: db
        .prepare("SELECT COUNT(*) as count FROM retail_products")
        .get().count,
      staff: db.prepare("SELECT COUNT(*) as count FROM staff").get().count,
      discount_types: db
        .prepare("SELECT COUNT(*) as count FROM discount_types")
        .get().count,
      payment_methods: db
        .prepare("SELECT COUNT(*) as count FROM payment_methods")
        .get().count,
      referral_sources: db
        .prepare("SELECT COUNT(*) as count FROM referral_sources")
        .get().count,
    },
    database_info: {
      schema_version: "1.0",
      tables: [
        "customers",
        "treatments",
        "treatment_images",
        "staff",
        "treatment_menus",
        "retail_products",
        "referral_sources",
        "payment_methods",
        "discount_types",
      ],
    },
  };

  fs.writeFileSync(
    path.join(backupDir, "metadata.json"),
    JSON.stringify(metadata, null, 2)
  );
};

// READMEファイルの作成
const createReadme = (backupDir: string) => {
  const readme = `# サロン管理システム バックアップ

このディレクトリはサロン管理システムの完全バックアップです。

## ディレクトリ構造

- \`database/\`: SQLiteデータベースファイル
- \`images/\`: 画像ファイル
  - \`customers/\`: 顧客別・日付別に分類された施術画像
    - \`{顧客名}/\`: 顧客別ディレクトリ
      - \`{YYYY-MM-DD}/\`: 施術日別ディレクトリ
        - \`treatment_{施術ID}_{元ファイル名}\`: 施術画像ファイル
  - \`unclassified/\`: 分類されていない画像ファイル
- \`exports/\`: CSV形式のデータエクスポート
- \`metadata.json\`: バックアップ情報とメタデータ

## 画像ファイルの分類

画像は以下の構造で保存されます：
\`\`\`
images/
├── customers/
│   ├── 田中太郎/
│   │   ├── 2024-01-15/
│   │   │   ├── treatment_123_image1.jpg
│   │   │   └── treatment_123_image2.jpg
│   │   └── 2024-02-20/
│   │       └── treatment_456_image3.jpg
│   └── 佐藤花子/
│       └── 2024-01-10/
│           └── treatment_789_image4.jpg
└── unclassified/
    └── other_image.jpg
\`\`\`

### ファイル名の形式
- \`treatment_{施術ID}_{元ファイル名}\`
- 例: \`treatment_123_1753415784525_kfwgcu4nq2o.png\`

## 復元方法

1. データベースファイルを \`data/salon.db\` にコピー
2. 画像ファイルを \`data/uploads/\` にコピー
   - 顧客別・日付別ディレクトリから自動的に元のファイル名に復元されます
3. システムを再起動

## 注意事項

- 復元前に既存のデータをバックアップしてください
- 復元後はデータの整合性を確認してください
- このバックアップは顧客別・日付別の構造で画像を管理します

作成日時: ${new Date().toLocaleString("ja-JP")}
`;

  fs.writeFileSync(path.join(backupDir, "README.txt"), readme);
};

// GET /api/backup - バックアップ作成
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "directory"; // "directory" or "zip"

    const timestamp =
      new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
      "_" +
      new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[1]
        .split(".")[0];
    const backupName = `salon-backup-${timestamp}`;

    // バックアップディレクトリ作成
    const { backupDir, databaseDir, imagesDir, exportsDir } =
      createBackupDirectory(backupName);

    // データベースコピー
    const dbCopied = copyDatabase(databaseDir);
    if (!dbCopied) {
      return NextResponse.json(
        { error: "データベースファイルが見つかりません" },
        { status: 404 }
      );
    }

    // 画像ファイルコピー
    const imageCount = copyImages(imagesDir);

    // CSVエクスポート
    exportToCSV(exportsDir);

    // メタデータ作成
    createMetadata(backupDir, imageCount);

    // README作成
    createReadme(backupDir);

    if (format === "zip") {
      // ZIPファイル作成
      const zipPath = path.join(process.cwd(), "backups", `${backupName}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      return new Promise<NextResponse>((resolve, reject) => {
        output.on("close", () => {
          // 一時ディレクトリを削除
          fs.rmSync(backupDir, { recursive: true, force: true });

          const zipBuffer = fs.readFileSync(zipPath);
          fs.unlinkSync(zipPath); // ZIPファイルを削除

          resolve(
            new NextResponse(zipBuffer, {
              headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${backupName}.zip"`,
              },
            })
          );
        });

        archive.on("error", (err) => {
          reject(
            NextResponse.json(
              { error: "ZIPファイルの作成に失敗しました" },
              { status: 500 }
            )
          );
        });

        archive.pipe(output);
        archive.directory(backupDir, false);
        archive.finalize();
      });
    } else {
      // ディレクトリパスを返す
      return NextResponse.json({
        success: true,
        backup_path: backupDir,
        message: "バックアップが正常に作成されました",
        data_summary: {
          database_copied: dbCopied,
          images_copied: imageCount,
          backup_size: getDirectorySize(backupDir),
        },
      });
    }
  } catch (error) {
    console.error("バックアップ作成エラー:", error);
    return NextResponse.json(
      { error: "バックアップの作成に失敗しました" },
      { status: 500 }
    );
  }
}

// ディレクトリサイズ計算
const getDirectorySize = (dirPath: string): number => {
  let totalSize = 0;

  const calculateSize = (currentPath: string) => {
    const stats = fs.statSync(currentPath);
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        calculateSize(path.join(currentPath, file));
      });
    }
  };

  calculateSize(dirPath);
  return totalSize;
};
