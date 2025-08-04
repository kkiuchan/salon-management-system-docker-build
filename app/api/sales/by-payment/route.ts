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

    // 支払い方法別売上データを取得
    const paymentMethodSales = db
      .prepare(
        `
      SELECT 
        COALESCE(payment_method, '未設定') as payment_method,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as transaction_count,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_amount
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY payment_method
      ORDER BY total_sales DESC
    `
      )
      .all(startDate, endDate);

    return NextResponse.json(paymentMethodSales);
  } catch (error) {
    console.error("支払い方法別売上データ取得エラー:", error);
    return NextResponse.json(
      { error: "支払い方法別売上データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
