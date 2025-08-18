import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    // 期間に応じた日付範囲を計算
    const now = new Date();
    let startDate: string;
    let endDate: string;

    // カスタム期間の場合は指定された日付を使用
    if (period === "custom" && customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      // デフォルトの期間計算
      endDate = now.toISOString().split("T")[0];

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
    }

    // 日別売上データを取得
    const dailySales = db
      .prepare(
        `
      SELECT 
        treatment_date as date,
        COALESCE(SUM(total_amount), 0) as daily_sales,
        COALESCE(SUM(treatment_fee), 0) as treatment_sales,
        COALESCE(SUM(retail_fee), 0) as retail_sales,
        COUNT(*) as treatment_count,
        COUNT(DISTINCT customer_id) as customer_count
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY treatment_date
      ORDER BY treatment_date DESC
      LIMIT 30
    `
      )
      .all(startDate, endDate);

    return NextResponse.json(dailySales);
  } catch (error) {
    console.error("日別売上データ取得エラー:", error);
    return NextResponse.json(
      { error: "日別売上データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
