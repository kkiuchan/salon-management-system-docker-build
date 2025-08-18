import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    console.log("売上サマリーAPI呼び出し:", {
      period,
      customStartDate,
      customEndDate,
    });

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

    console.log("日付範囲:", { startDate, endDate });

    // データベース接続確認
    if (!db) {
      console.error("データベース接続が確立されていません");
      return NextResponse.json(
        { error: "データベース接続エラー" },
        { status: 500 }
      );
    }

    // 売上サマリーを取得
    const summary = db
      .prepare(
        `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(treatment_fee), 0) as total_treatment_fee,
        COALESCE(SUM(retail_fee), 0) as total_retail_fee,
        COUNT(*) as total_treatments,
        COUNT(DISTINCT customer_id) as unique_customers,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_amount
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
    `
      )
      .get(startDate, endDate);

    console.log("売上サマリー結果:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("売上サマリー取得エラー:", error);
    return NextResponse.json(
      {
        error: "売上サマリーの取得に失敗しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
