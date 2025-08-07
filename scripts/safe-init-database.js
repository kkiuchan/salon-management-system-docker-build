const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// データディレクトリのパス
const dataDir = path.join(__dirname, '..', 'data');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 データディレクトリを作成しました: ${dataDir}`);
}

// データベース接続（ファイルが存在しない場合は自動作成）
const dbPath = path.join(dataDir, "salon.db");

// 既存のファイルを削除（安全な初期化のため）
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log("🗑️  既存のデータベースファイルを削除しました");
  } catch (error) {
    console.error("既存ファイルの削除に失敗:", error.message);
  }
}

console.log(`🔗 データベースに接続中: ${dbPath}`);

let db;
try {
  // 新しいデータベースファイルを作成
  db = new Database(dbPath);
  console.log("✅ データベース接続成功");
} catch (error) {
  console.error("❌ データベース接続に失敗:", error);
  process.exit(1);
}

// WALモードを有効化（パフォーマンス向上）
try {
  db.pragma('journal_mode = WAL');
  console.log("✅ WALモードを有効化しました");
} catch (error) {
  console.warn("⚠️  WALモード設定に失敗:", error.message);
}

// テーブル作成
console.log("📊 テーブルを作成中...");

try {
  // 顧客テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      furigana TEXT,
      name TEXT NOT NULL,
      gender TEXT,
      phone TEXT,
      emergency_contact TEXT,
      date_of_birth TEXT,
      age INTEGER,
      address TEXT,
      notes TEXT,
      referral_source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 施術テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      treatment_date DATE NOT NULL,
      treatment_time TIME NOT NULL,
      stylist_name TEXT NOT NULL,
      treatment_content1 TEXT,
      treatment_content2 TEXT,
      treatment_content3 TEXT,
      treatment_content4 TEXT,
      treatment_content5 TEXT,
      treatment_content6 TEXT,
      treatment_content7 TEXT,
      treatment_content8 TEXT,
      retail_product1 TEXT,
      retail_product1_quantity INTEGER DEFAULT 0,
      retail_product2 TEXT,
      retail_product2_quantity INTEGER DEFAULT 0,
      retail_product3 TEXT,
      retail_product3_quantity INTEGER DEFAULT 0,
      total_amount INTEGER NOT NULL,
      payment_method TEXT,
      discount_type TEXT,
      discount_amount INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );
  `);

  // 施術画像テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS treatment_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treatment_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      image_type TEXT DEFAULT 'before',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (treatment_id) REFERENCES treatments (id)
    );
  `);

  // スタッフテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 施術メニューテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS treatment_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 支払い方法テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 紹介元テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 割引種別テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS discount_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 小売商品テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS retail_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ テーブル作成完了");

  // サンプルデータの挿入
  console.log("📝 サンプルデータを挿入中...");

  // 顧客データ
  const insertCustomer = db.prepare(`
    INSERT INTO customers (furigana, name, gender, phone, emergency_contact, date_of_birth, age, address, referral_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCustomer.run('タナカハナコ', '田中花子', '女性', '090-1234-5678', '090-8765-4321', '1990-05-15', 33, '東京都渋谷区1-2-3', 'インターネット');
  insertCustomer.run('スズキタロウ', '鈴木太郎', '男性', '080-2345-6789', '080-9876-5432', '1985-08-20', 38, '東京都新宿区4-5-6', '友人紹介');
  insertCustomer.run('', '下井ゆゆと', '', '08011112222', '', '', null, '', '');

  // スタッフデータ
  const insertStaff = db.prepare('INSERT INTO staff (name) VALUES (?)');
  insertStaff.run('佐藤太郎');
  insertStaff.run('田中花子');
  insertStaff.run('下井優太');

  // 施術メニューデータ
  const insertMenu = db.prepare('INSERT INTO treatment_menus (name, category, price) VALUES (?, ?, ?)');
  insertMenu.run('カット', 'カット', 3000);
  insertMenu.run('パーマ', 'パーマ', 8000);
  insertMenu.run('カラー', 'カラー', 6000);
  insertMenu.run('Sカラー', 'カラー', 4000);
  insertMenu.run('トリートメント', 'トリートメント', 2000);
  insertMenu.run('ヘッドスパ', 'ヘッドスパ', 1500);

  // 小売商品データ
  const insertProduct = db.prepare('INSERT INTO retail_products (name, category, price, quantity) VALUES (?, ?, ?, ?)');
  insertProduct.run('シャンプー', 'ヘアケア', 2000, 0);
  insertProduct.run('コンディショナー', 'ヘアケア', 1800, 0);
  insertProduct.run('トリートメント', 'ヘアケア', 2500, 0);
  insertProduct.run('ヘアオイル', 'ヘアケア', 1200, 0);
  insertProduct.run('ワックス', 'スタイリング', 1500, 0);
  insertProduct.run('スプレー', 'スタイリング', 1300, 0);

  // 支払い方法データ
  const insertPayment = db.prepare('INSERT INTO payment_methods (name) VALUES (?)');
  insertPayment.run('現金');
  insertPayment.run('クレジットカード');
  insertPayment.run('PayPay');
  insertPayment.run('交通系IC');

  // 紹介元データ
  const insertReferral = db.prepare('INSERT INTO referral_sources (name) VALUES (?)');
  insertReferral.run('インターネット');
  insertReferral.run('友人紹介');
  insertReferral.run('チラシ');
  insertReferral.run('通りがかり');

  // 割引種別データ
  const insertDiscount = db.prepare('INSERT INTO discount_types (name) VALUES (?)');
  insertDiscount.run('学生割引');
  insertDiscount.run('シニア割引');
  insertDiscount.run('初回割引');
  insertDiscount.run('会員割引');

  console.log("✅ サンプルデータ挿入完了");

  // データベースを閉じる
  db.close();
  console.log("🎉 データベース初期化が完了しました！");

  // ファイル権限を設定
  try {
    fs.chmodSync(dbPath, 0o666);
    console.log("✅ ファイル権限を設定しました");
  } catch (error) {
    console.warn("⚠️  権限設定に失敗:", error.message);
  }

} catch (error) {
  console.error("❌ テーブル作成エラー:", error);
  if (db) db.close();
  process.exit(1);
}