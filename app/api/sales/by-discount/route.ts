import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    // 期間に応じた日付範囲を計算
    const now = new Date();
    let startDate: string;
    const endDate: string = now.toISOString().split("T")[0];

    switch (period) {
      case "today":
        startDate = now.toISOString().split("T")[0];
        break;
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        startDate = yearAgo.toISOString().split("T")[0];
        break;
      default:
        const defaultMonthAgo = new Date(now);
        defaultMonthAgo.setMonth(now.getMonth() - 1);
        startDate = defaultMonthAgo.toISOString().split("T")[0];
    }

    // 割引別売上データを取得（割引がある場合のみ）
    const discountSales = db
      .prepare(
        `
      SELECT 
        COALESCE(treatment_discount_type, 'なし') as discount_type,
        COALESCE(SUM(treatment_discount_amount), 0) as total_discount_amount,
        COUNT(*) as transaction_count,
        COALESCE(SUM(total_amount), 0) as total_sales,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(treatment_discount_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_discount
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
        AND (treatment_discount_amount > 0 OR (treatment_discount_type IS NOT NULL AND treatment_discount_type != ''))
      GROUP BY treatment_discount_type
      ORDER BY total_discount_amount DESC
    `
      )
      .all(startDate, endDate);

    // 商品割引のデータも取得（割引がある場合のみ）
    const retailDiscountSales = db
      .prepare(
        `
      SELECT 
        COALESCE(retail_discount_type, 'なし') as discount_type,
        COALESCE(SUM(retail_discount_amount), 0) as total_discount_amount,
        COUNT(*) as transaction_count,
        COALESCE(SUM(total_amount), 0) as total_sales,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(retail_discount_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_discount
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
        AND (retail_discount_amount > 0 OR (retail_discount_type IS NOT NULL AND retail_discount_type != ''))
      GROUP BY retail_discount_type
      ORDER BY total_discount_amount DESC
    `
      )
      .all(startDate, endDate);

    // 合計割引情報を取得
    const totalDiscountInfo = db
      .prepare(
        `
      SELECT 
        COALESCE(SUM(treatment_discount_amount), 0) as total_treatment_discount,
        COALESCE(SUM(retail_discount_amount), 0) as total_retail_discount,
        COALESCE(SUM(treatment_discount_amount + retail_discount_amount), 0) as total_discount,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN treatment_discount_amount > 0 OR retail_discount_amount > 0 THEN 1 END) as discounted_transactions
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
    `
      )
      .get(startDate, endDate);

    return NextResponse.json({
      treatmentDiscounts: discountSales,
      retailDiscounts: retailDiscountSales,
      totalDiscountInfo,
    });
  } catch (error) {
    console.error("割引別売上データ取得エラー:", error);
    return NextResponse.json(
      { error: "割引別売上データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
