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

    // スタッフ別売上データを取得
    const staffSales = db
      .prepare(
        `
      SELECT 
        COALESCE(stylist_name, '未設定') as stylist_name,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as treatment_count,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_sales
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY stylist_name
      ORDER BY total_sales DESC
    `
      )
      .all(startDate, endDate);

    return NextResponse.json(staffSales);
  } catch (error) {
    console.error("スタッフ別売上データ取得エラー:", error);
    return NextResponse.json(
      { error: "スタッフ別売上データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
