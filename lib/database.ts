import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// データベースファイルのパス
export const dataDir = path.join(process.cwd(), "data");
export const uploadsDir = path.join(dataDir, "uploads");

// データディレクトリの作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// データベースインスタンス
const db = new Database(path.join(dataDir, "salon.db"));
// 外部キー制約とカスケード削除を有効化
try {
  // better-sqlite3 では pragma は同期で実行される
  db.pragma("foreign_keys = ON");
} catch (_) {
  // 失敗しても致命的ではないため、ログだけに留める
  // console.warn("PRAGMA foreign_keys=ON を適用できませんでした");
}

// テーブル作成
db.exec(`
  -- 顧客テーブル（拡張版）
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    furigana TEXT,
    name TEXT NOT NULL,
    gender TEXT,
    phone TEXT,
    emergency_contact TEXT,
    date_of_birth TEXT,
    age INTEGER,
    occupation TEXT,
    postal_code TEXT,
    address TEXT,
    visiting_family TEXT,
    email TEXT,
    blood_type TEXT,
    allergies TEXT,
    medical_history TEXT,
    notes TEXT,
    referral_source1 TEXT,
    referral_source2 TEXT,
    referral_source3 TEXT,
    referral_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 施術テーブル（拡張版）
  CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    treatment_date TEXT NOT NULL,
    treatment_time TEXT,
    stylist_name TEXT NOT NULL,
    treatment_content1 TEXT,
    treatment_content2 TEXT,
    treatment_content3 TEXT,
    treatment_content4 TEXT,
    treatment_content5 TEXT,
    treatment_content6 TEXT,
    treatment_content7 TEXT,
    treatment_content8 TEXT,
    style_memo TEXT,
    used_chemicals TEXT,
    solution1_time TEXT,
    solution2_time TEXT,
    color_time1 TEXT,
    color_time2 TEXT,
    other_details TEXT,
    retail_product1 TEXT,
    retail_product1_quantity INTEGER,
    retail_product1_price INTEGER,
    retail_product2 TEXT,
    retail_product2_quantity INTEGER,
    retail_product2_price INTEGER,
    retail_product3 TEXT,
    retail_product3_quantity INTEGER,
    retail_product3_price INTEGER,
    notes TEXT,
    conversation_content TEXT,
    treatment_fee INTEGER,
    treatment_discount_amount INTEGER,
    treatment_discount_type TEXT,
    retail_fee INTEGER,
    retail_discount_amount INTEGER,
    retail_discount_type TEXT,
    total_amount INTEGER,
    payment_method TEXT,
    next_appointment_date TEXT,
    next_appointment_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
  );

  -- 施術画像テーブル
  CREATE TABLE IF NOT EXISTS treatment_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treatment_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    original_filename TEXT,
    image_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treatment_id) REFERENCES treatments (id) ON DELETE CASCADE
  );

  -- スタッフテーブル
  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 施術メニューテーブル
  CREATE TABLE IF NOT EXISTS treatment_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 店頭販売商品マスターテーブル
  CREATE TABLE IF NOT EXISTS retail_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 来店きっかけマスターテーブル
  CREATE TABLE IF NOT EXISTS referral_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 支払い方法マスターテーブル
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 割引種別マスターテーブル
  CREATE TABLE IF NOT EXISTS discount_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    discount_value INTEGER NOT NULL DEFAULT 0, -- 割引率(%) または 割引金額(円)
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- インデックス作成
  CREATE INDEX IF NOT EXISTS idx_treatments_customer_id ON treatments(customer_id);
  CREATE INDEX IF NOT EXISTS idx_treatment_images_treatment_id ON treatment_images(treatment_id);
  CREATE INDEX IF NOT EXISTS idx_treatment_images_order ON treatment_images(image_order);
`);

// 画像保存用のユーティリティ関数
export const getImageStoragePath = (
  customerId: number,
  customerName: string,
  treatmentDate: string,
  treatmentId: number,
  filename: string
) => {
  // 顧客名を安全なディレクトリ名に変換
  const safeCustomerName = customerName.replace(/[<>:"/\\|?*]/g, "_");

  // 日付をフォーマット
  const dateStr = new Date(treatmentDate).toISOString().split("T")[0]; // YYYY-MM-DD形式

  // ディレクトリ構造: data/uploads/customers/{顧客名}/{日付}/
  const customerDir = path.join(uploadsDir, "customers", safeCustomerName);
  const dateDir = path.join(customerDir, dateStr);

  // ディレクトリ作成
  fs.mkdirSync(customerDir, { recursive: true });
  fs.mkdirSync(dateDir, { recursive: true });

  // ファイル名に施術IDを含める
  const newFileName = `treatment_${treatmentId}_${filename}`;
  const filePath = path.join(dateDir, newFileName);

  // 相対パスを常にフォワードスラッシュで生成（URL用）
  const relativePath = `customers/${safeCustomerName}/${dateStr}/${newFileName}`;

  return {
    filePath,
    relativePath,
    customerDir,
    dateDir,
  };
};

// 画像ファイルの保存
export const saveImageFile = async (file: File, storagePath: string) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(storagePath, buffer);
};

// 画像ファイルの削除
export const deleteImageFile = (imageUrl: string) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "uploads",
      ...imageUrl.split("/")
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("画像ファイル削除エラー:", error);
    return false;
  }
};

// 画像ファイルの存在確認
export const imageFileExists = (imageUrl: string) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "uploads",
      ...imageUrl.split("/")
    );
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// 画像ファイルのパス取得
export const getImageFilePath = (imageUrl: string) => {
  // URLデコードされたパスをファイルシステムパスに変換
  const decodedPath = decodeURIComponent(imageUrl);
  const filePath = path.join(
    process.cwd(),
    "data",
    "uploads",
    ...decodedPath.split("/")
  );

  return filePath;
};

export default db;
