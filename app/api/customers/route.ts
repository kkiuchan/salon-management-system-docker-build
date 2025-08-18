import db from "@/lib/database";
import { CustomerInsert } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// GET: 全顧客データの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const phone = searchParams.get("phone");
    const gender = searchParams.get("gender");
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const occupation = searchParams.get("occupation");
    const referralSource = searchParams.get("referralSource");
    const hasAllergies = searchParams.get("hasAllergies");
    const address = searchParams.get("address");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "created_desc";

    let query = `
      SELECT * FROM customers 
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    // 検索条件の追加
    if (search) {
      query += ` AND (name LIKE ? OR furigana LIKE ? OR phone LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (phone) {
      query += ` AND phone LIKE ?`;
      params.push(`%${phone}%`);
    }

    if (gender && gender !== "all") {
      query += ` AND gender = ?`;
      params.push(gender);
    }

    if (minAge) {
      query += ` AND age >= ?`;
      params.push(parseInt(minAge));
    }

    if (maxAge) {
      query += ` AND age <= ?`;
      params.push(parseInt(maxAge));
    }

    if (occupation && occupation !== "all") {
      query += ` AND occupation = ?`;
      params.push(occupation);
    }

    if (referralSource && referralSource !== "all") {
      query += ` AND (referral_source1 = ? OR referral_source2 = ? OR referral_source3 = ?)`;
      params.push(referralSource, referralSource, referralSource);
    }

    if (hasAllergies && hasAllergies !== "all") {
      if (hasAllergies === "yes") {
        query += ` AND (allergies IS NOT NULL AND allergies != '')`;
      } else {
        query += ` AND (allergies IS NULL OR allergies = '')`;
      }
    }

    if (address) {
      query += ` AND address LIKE ?`;
      params.push(`%${address}%`);
    }

    if (dateFrom) {
      query += ` AND created_at >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND created_at <= ?`;
      params.push(dateTo);
    }

    // ソート条件
    switch (sortBy) {
      case "name_asc":
        query += ` ORDER BY name ASC`;
        break;
      case "name_desc":
        query += ` ORDER BY name DESC`;
        break;
      case "created_asc":
        query += ` ORDER BY created_at ASC`;
        break;
      case "created_desc":
      default:
        query += ` ORDER BY created_at DESC`;
        break;
    }

    const customers = db.prepare(query).all(...params);
    return NextResponse.json(customers);
  } catch (error) {
    console.error("顧客データ取得エラー:", error);
    return NextResponse.json(
      { error: "顧客データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規顧客の作成
export async function POST(request: NextRequest) {
  try {
    const body: CustomerInsert = await request.json();

    const result = db
      .prepare(
        `
      INSERT INTO customers (
        furigana, name, gender, phone, phone2, emergency_contact, date_of_birth, age,
        occupation, postal_code, address, visiting_family, email, blood_type,
        allergies, medical_history, notes, referral_source1, referral_source2,
        referral_source3, referral_details, first_visit_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        body.furigana || null,
        body.name,
        body.gender || null,
        body.phone || null,
        body.phone2 || null,
        body.emergency_contact || null,
        body.date_of_birth || null,
        body.age || null,
        body.occupation || null,
        body.postal_code || null,
        body.address || null,
        body.visiting_family || null,
        body.email || null,
        body.blood_type || null,
        body.allergies || null,
        body.medical_history || null,
        body.notes || null,
        body.referral_source1 || null,
        body.referral_source2 || null,
        body.referral_source3 || null,
        body.referral_details || null,
        body.first_visit_date || null
      );

    const newCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(result.lastInsertRowid);
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("顧客作成エラー:", error);
    return NextResponse.json(
      { error: "顧客の作成に失敗しました" },
      { status: 500 }
    );
  }
}
