const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

console.log("🗄️ データベースを初期化中...");

// データディレクトリの作成
const dataDir = path.join(__dirname, "../data");
const uploadsDir = path.join(dataDir, "uploads");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ データディレクトリを作成しました");
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ アップロードディレクトリを作成しました");
}

// データベース接続
const dbPath = path.join(dataDir, "salon.db");
const db = new Database(dbPath);

// 既存のテーブルを削除（スキーマ更新のため）
console.log("📊 テーブルを作成中...");
db.exec(`
  DROP TABLE IF EXISTS treatment_images;
  DROP TABLE IF EXISTS treatments;
  DROP TABLE IF EXISTS customers;
  DROP TABLE IF EXISTS staff;
  DROP TABLE IF EXISTS treatment_menus;
  DROP TABLE IF EXISTS referral_sources;
  DROP TABLE IF EXISTS payment_methods;
  DROP TABLE IF EXISTS discount_types;
  DROP TABLE IF EXISTS retail_products;
`);

// テーブル作成
db.exec(`
  -- 顧客テーブル（拡張版）
  CREATE TABLE customers (
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
  CREATE TABLE treatments (
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
  CREATE TABLE treatment_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treatment_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    original_filename TEXT,
    image_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treatment_id) REFERENCES treatments (id) ON DELETE CASCADE
  );

  -- スタッフテーブル
  CREATE TABLE staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 施術メニューテーブル
  CREATE TABLE treatment_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 来店きっかけマスターテーブル
  CREATE TABLE referral_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 支払い方法マスターテーブル
  CREATE TABLE payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 割引種別テーブル
  CREATE TABLE discount_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 店頭販売商品テーブル
  CREATE TABLE retail_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price INTEGER,
    quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- インデックス作成
  CREATE INDEX idx_treatments_customer_id ON treatments(customer_id);
  CREATE INDEX idx_treatment_images_treatment_id ON treatment_images(treatment_id);
  CREATE INDEX idx_treatment_images_order ON treatment_images(image_order);
`);

// 既存のデータを更新（既存のデータがある場合）
db.exec(`
  UPDATE discount_types 
  SET discount_type = 'percentage', discount_value = 10 
  WHERE discount_type IS NULL OR discount_value IS NULL;
`);

console.log("✅ テーブルを作成しました");

// サンプルデータを追加
console.log("📝 サンプルデータを追加中...");

// スタッフデータ
const staffData = [
  { name: "下井優太" },
  { name: "田中花子" },
  { name: "佐藤太郎" },
];

staffData.forEach((staff) => {
  db.prepare("INSERT INTO staff (name) VALUES (?)").run(staff.name);
});

// 施術メニューデータ（料金付き）
const menuData = [
  // カットメニュー
  { name: "カット", category: "カットメニュー", price: 3000 },
  { name: "前髪カット", category: "カットメニュー", price: 1000 },

  // 顔そりメニュー
  { name: "メンズシェービング", category: "顔そりメニュー", price: 2000 },
  { name: "レディースシェービング", category: "顔そりメニュー", price: 1500 },

  // シャンプーメニュー
  { name: "シャンプー・ブロー", category: "シャンプーメニュー", price: 2000 },

  // カラーメニュー
  { name: "Sカラー", category: "カラーメニュー", price: 4000 },
  { name: "Mカラー", category: "カラーメニュー", price: 6000 },
  { name: "Lカラー", category: "カラーメニュー", price: 8000 },
  { name: "リタッチカラー", category: "カラーメニュー", price: 3000 },
  { name: "デザインカラー", category: "カラーメニュー", price: 5000 },
  { name: "白髪ぼかし", category: "カラーメニュー", price: 3500 },

  // トーンアップメニュー
  { name: "トーンアップ", category: "トーンアップメニュー", price: 3000 },
  { name: "ブリーチ1回", category: "トーンアップメニュー", price: 4000 },
  { name: "ブリーチ複数回", category: "トーンアップメニュー", price: 6000 },

  // パーマメニュー
  { name: "パーマ", category: "パーマメニュー", price: 8000 },
  { name: "セクション", category: "パーマメニュー", price: 5000 },
  { name: "ポイントパーマ", category: "パーマメニュー", price: 4000 },
  { name: "デザインパーマ", category: "パーマメニュー", price: 6000 },
  { name: "ストレートパーマ", category: "パーマメニュー", price: 10000 },
  { name: "ツイストパーマ", category: "パーマメニュー", price: 7000 },
  { name: "セクションツイスト", category: "パーマメニュー", price: 6000 },
  { name: "コテパーマ", category: "パーマメニュー", price: 5000 },
  { name: "セクションコテ", category: "パーマメニュー", price: 4000 },

  // 縮毛矯正メニュー
  { name: "S縮毛矯正", category: "縮毛矯正メニュー", price: 8000 },
  { name: "M縮毛矯正", category: "縮毛矯正メニュー", price: 12000 },
  { name: "L縮毛矯正", category: "縮毛矯正メニュー", price: 15000 },
  { name: "セクション縮毛矯正", category: "縮毛矯正メニュー", price: 6000 },
  { name: "ポイント縮毛矯正", category: "縮毛矯正メニュー", price: 4000 },

  // トリートメントメニュー
  { name: "トリートメント", category: "トリートメントメニュー", price: 2000 },

  // その他メニュー
  { name: "ヘッドスパ", category: "その他メニュー", price: 1500 },
];

menuData.forEach((menu) => {
  db.prepare(
    "INSERT INTO treatment_menus (name, category, price) VALUES (?, ?, ?)"
  ).run(menu.name, menu.category, menu.price);
});

// 来店きっかけデータ
const referralData = [
  { name: "顧客紹介" },
  { name: "Instagram" },
  { name: "web検索" },
  { name: "Facebook" },
  { name: "Twitter" },
  { name: "チラシ" },
  { name: "看板" },
  { name: "その他" },
];

referralData.forEach((referral) => {
  db.prepare("INSERT INTO referral_sources (name) VALUES (?)").run(
    referral.name
  );
});

// 支払い方法データ（美容室で実際に使用される方法に修正）
const paymentMethodData = [
  { name: "現金" },
  { name: "クレジットカード" },
  { name: "電子マネー" },
  { name: "その他" },
];

paymentMethodData.forEach((method) => {
  db.prepare("INSERT INTO payment_methods (name) VALUES (?)").run(method.name);
});

// 割引種別データ（percentageとfixedの両方を含む）
const discountTypeData = [
  { name: "クーポン割引", discount_type: "percentage", discount_value: 10 },
  { name: "会員割引", discount_type: "percentage", discount_value: 15 },
  { name: "紹介割引", discount_type: "percentage", discount_value: 20 },
  { name: "季節割引", discount_type: "percentage", discount_value: 5 },
  { name: "固定割引", discount_type: "fixed", discount_value: 500 },
  { name: "初回割引", discount_type: "fixed", discount_value: 1000 },
  { name: "その他", discount_type: "percentage", discount_value: 0 },
];

discountTypeData.forEach((type) => {
  db.prepare(
    "INSERT INTO discount_types (name, discount_type, discount_value) VALUES (?, ?, ?)"
  ).run(type.name, type.discount_type, type.discount_value);
});

// 店頭販売商品データ（価格を統一）
const retailProductData = [
  { name: "シャンプー", category: "ヘアケア", price: 2000 },
  { name: "コンディショナー", category: "ヘアケア", price: 1800 },
  { name: "トリートメント", category: "ヘアケア", price: 2500 },
  { name: "スタイリング剤", category: "スタイリング", price: 1500 },
  { name: "ブラシ", category: "ツール", price: 800 },
  { name: "ドライヤー", category: "ツール", price: 5000 },
];

retailProductData.forEach((product) => {
  db.prepare(
    "INSERT INTO retail_products (name, category, price) VALUES (?, ?, ?)"
  ).run(product.name, product.category, product.price);
});

// 顧客データ
const customerData = [
  {
    furigana: "タナカハナコ",
    name: "田中花子",
    gender: "女性",
    phone: "090-1234-5678",
    emergency_contact: "090-8765-4321",
    date_of_birth: "1990-05-15",
    age: 33,
    occupation: "会社員",
    postal_code: "100-0001",
    address: "東京都千代田区千代田1-1-1",
    visiting_family: "母",
    notes: "初回来店時はカットのみ希望",
    referral_source1: "Instagram",
    referral_source2: "顧客紹介",
    referral_source3: "",
    referral_details: "友人の田中さんから紹介",
  },
  {
    furigana: "サトウタロウ",
    name: "佐藤太郎",
    gender: "男性",
    phone: "080-9876-5432",
    emergency_contact: "080-1111-2222",
    date_of_birth: "1985-10-20",
    age: 38,
    occupation: "ビジネスマン",
    postal_code: "200-0001",
    address: "東京都中央区銀座1-1-1",
    visiting_family: "",
    notes: "ビジネスマン、短時間での施術を希望",
    referral_source1: "web検索",
    referral_source2: "",
    referral_source3: "",
    referral_details: "Googleで検索して来店",
  },
];

customerData.forEach((customer) => {
  db.prepare(
    `
    INSERT INTO customers (
      furigana, name, gender, phone, emergency_contact,
      date_of_birth, age, occupation, postal_code, address, visiting_family,
      notes, referral_source1, referral_source2, referral_source3, referral_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    customer.furigana,
    customer.name,
    customer.gender,
    customer.phone,
    customer.emergency_contact,
    customer.date_of_birth,
    customer.age,
    customer.occupation,
    customer.postal_code,
    customer.address,
    customer.visiting_family,
    customer.notes,
    customer.referral_source1,
    customer.referral_source2,
    customer.referral_source3,
    customer.referral_details
  );
});

// 施術データ（マスタデータと対応、料金計算を正確に）
const treatmentData = [
  {
    customer_id: 1,
    treatment_date: "2024-01-15",
    treatment_time: "14:00",
    stylist_name: "下井優太",
    treatment_content1: "カット",
    treatment_content2: "Mカラー",
    style_memo: "ショートボブ、明るいブラウン",
    used_chemicals: "L'OREAL プロフェッショナル",
    solution1_time: "20分",
    color_time1: "30分",
    notes: "初回カラー、満足度高い",
    conversation_content: "仕事の話、趣味の話",
    treatment_fee: 9000, // カット(3000) + Mカラー(6000)
    treatment_discount_amount: 900, // 10%割引 (9000 * 0.1)
    treatment_discount_type: "クーポン割引",
    retail_product1: "シャンプー",
    retail_product1_quantity: 2,
    retail_product1_price: 2000,
    retail_fee: 4000, // シャンプー(2000) × 2
    retail_discount_amount: 0,
    retail_discount_type: "",
    total_amount: 12100, // (9000 - 900) + 4000
    payment_method: "現金",
  },
  {
    customer_id: 2,
    treatment_date: "2024-01-20",
    treatment_time: "10:00",
    stylist_name: "田中花子",
    treatment_content1: "カット",
    treatment_content2: "トリートメント",
    style_memo: "ビジネスカット、清潔感重視",
    used_chemicals: "資生堂 プロフェッショナル",
    solution1_time: "15分",
    notes: "ビジネス向け、短時間で完了",
    conversation_content: "仕事の話",
    treatment_fee: 5000, // カット(3000) + トリートメント(2000)
    treatment_discount_amount: 0,
    treatment_discount_type: "",
    retail_product1: "コンディショナー",
    retail_product1_quantity: 1,
    retail_product1_price: 1800,
    retail_fee: 1800, // コンディショナー(1800) × 1
    retail_discount_amount: 0,
    retail_discount_type: "",
    total_amount: 6800, // 5000 + 1800
    payment_method: "クレジットカード",
  },
  {
    customer_id: 1,
    treatment_date: "2024-02-01",
    treatment_time: "16:00",
    stylist_name: "佐藤太郎",
    treatment_content1: "パーマ",
    treatment_content2: "Sカラー",
    treatment_content3: "ヘッドスパ",
    style_memo: "ロングヘア、ナチュラルウェーブ",
    used_chemicals: "Wella プロフェッショナル",
    solution1_time: "25分",
    solution2_time: "15分",
    color_time1: "35分",
    notes: "結婚式前の特別ケア、大変満足",
    conversation_content: "結婚式の準備について",
    treatment_fee: 13500, // パーマ(8000) + Sカラー(4000) + ヘッドスパ(1500)
    treatment_discount_amount: 2700, // 20%割引 (13500 * 0.2)
    treatment_discount_type: "紹介割引",
    retail_product1: "シャンプー",
    retail_product1_quantity: 1,
    retail_product1_price: 2000,
    retail_product2: "コンディショナー",
    retail_product2_quantity: 1,
    retail_product2_price: 1800,
    retail_fee: 3800, // シャンプー(2000) + コンディショナー(1800)
    retail_discount_amount: 0,
    retail_discount_type: "",
    total_amount: 14600, // (13500 - 2700) + 3800
    payment_method: "クレジットカード",
  },
  {
    customer_id: 2,
    treatment_date: "2024-02-10",
    treatment_time: "13:00",
    stylist_name: "下井優太",
    treatment_content1: "カット",
    treatment_content2: "前髪カット",
    style_memo: "ミディアムボブ、前髪調整",
    used_chemicals: "資生堂 プロフェッショナル",
    solution1_time: "10分",
    notes: "定期的なカット、前髪の調整",
    conversation_content: "最近の流行について",
    treatment_fee: 4000, // カット(3000) + 前髪カット(1000)
    treatment_discount_amount: 500, // 固定割引
    treatment_discount_type: "固定割引",
    retail_product1: "スタイリング剤",
    retail_product1_quantity: 1,
    retail_product1_price: 1500,
    retail_fee: 1500, // スタイリング剤(1500) × 1
    retail_discount_amount: 0,
    retail_discount_type: "",
    total_amount: 5000, // (4000 - 500) + 1500
    payment_method: "電子マネー",
  },
];

treatmentData.forEach((treatment) => {
  db.prepare(
    `
    INSERT INTO treatments (
      customer_id, treatment_date, treatment_time, stylist_name,
      treatment_content1, treatment_content2, treatment_content3, treatment_content4, treatment_content5, treatment_content6, treatment_content7, treatment_content8,
      style_memo, used_chemicals, solution1_time, solution2_time, color_time1, color_time2, other_details,
      notes, conversation_content,
      treatment_fee, treatment_discount_amount, treatment_discount_type,
      retail_fee, retail_discount_amount, retail_discount_type, total_amount, payment_method,
      retail_product1, retail_product1_quantity, retail_product1_price,
      retail_product2, retail_product2_quantity, retail_product2_price,
      retail_product3, retail_product3_quantity, retail_product3_price,
      next_appointment_date, next_appointment_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    treatment.customer_id,
    treatment.treatment_date,
    treatment.treatment_time,
    treatment.stylist_name,
    treatment.treatment_content1 || "",
    treatment.treatment_content2 || "",
    treatment.treatment_content3 || "",
    treatment.treatment_content4 || "",
    treatment.treatment_content5 || "",
    treatment.treatment_content6 || "",
    treatment.treatment_content7 || "",
    treatment.treatment_content8 || "",
    treatment.style_memo || "",
    treatment.used_chemicals || "",
    treatment.solution1_time || "",
    treatment.solution2_time || "",
    treatment.color_time1 || "",
    treatment.color_time2 || "",
    treatment.other_details || "",
    treatment.notes || "",
    treatment.conversation_content || "",
    treatment.treatment_fee || 0,
    treatment.treatment_discount_amount || 0,
    treatment.treatment_discount_type || "",
    treatment.retail_fee || 0,
    treatment.retail_discount_amount || 0,
    treatment.retail_discount_type || "",
    treatment.total_amount || 0,
    treatment.payment_method || "",
    treatment.retail_product1 || "",
    treatment.retail_product1_quantity || 0,
    treatment.retail_product1_price || 0,
    treatment.retail_product2 || "",
    treatment.retail_product2_quantity || 0,
    treatment.retail_product2_price || 0,
    treatment.retail_product3 || "",
    treatment.retail_product3_quantity || 0,
    treatment.retail_product3_price || 0,
    treatment.next_appointment_date || "",
    treatment.next_appointment_time || ""
  );
});

console.log("✅ サンプルデータを追加しました");
console.log("🎉 データベース初期化が完了しました！");

db.close();
