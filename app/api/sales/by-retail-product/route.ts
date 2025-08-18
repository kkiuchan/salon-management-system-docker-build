import Database from "better-sqlite3";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "salon.db");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const db = new Database(dbPath);

    let dateCondition = "";
    let params: any[] = [];

    if (startDate && endDate) {
      dateCondition = "WHERE treatment_date BETWEEN ? AND ?";
      params = [startDate, endDate];
    } else {
      // 期間指定がない場合はデフォルトの期間を使用
      const now = new Date();
      let startDateStr = "";

      switch (period) {
        case "today":
          startDateStr = now.toISOString().split("T")[0];
          dateCondition = "WHERE treatment_date = ?";
          params = [startDateStr];
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDateStr = weekAgo.toISOString().split("T")[0];
          dateCondition = "WHERE treatment_date >= ?";
          params = [startDateStr];
          break;
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          startDateStr = monthAgo.toISOString().split("T")[0];
          dateCondition = "WHERE treatment_date >= ?";
          params = [startDateStr];
          break;
        case "year":
          const yearAgo = new Date(now.getFullYear(), 0, 1);
          startDateStr = yearAgo.toISOString().split("T")[0];
          dateCondition = "WHERE treatment_date >= ?";
          params = [startDateStr];
          break;
        default:
          const defaultMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          startDateStr = defaultMonthAgo.toISOString().split("T")[0];
          dateCondition = "WHERE treatment_date >= ?";
          params = [startDateStr];
      }
    }

    // 店販商品別の統計を取得
    const retailProductStats = db
      .prepare(
        `
      SELECT 
        retail_product1 as product_name,
        COUNT(*) as sale_count,
        SUM(retail_product1_price * retail_product1_quantity) as total_sales,
        SUM(retail_product1_quantity) as total_quantity
      FROM treatments 
      ${dateCondition}
      AND retail_product1 IS NOT NULL 
      AND retail_product1 != ''
      AND retail_product1_quantity > 0
      GROUP BY retail_product1
      `
      )
      .all(params);

    const retailProductStats2 = db
      .prepare(
        `
      SELECT 
        retail_product2 as product_name,
        COUNT(*) as sale_count,
        SUM(retail_product2_price * retail_product2_quantity) as total_sales,
        SUM(retail_product2_quantity) as total_quantity
      FROM treatments 
      ${dateCondition}
      AND retail_product2 IS NOT NULL 
      AND retail_product2 != ''
      AND retail_product2_quantity > 0
      GROUP BY retail_product2
      `
      )
      .all(params);

    const retailProductStats3 = db
      .prepare(
        `
      SELECT 
        retail_product3 as product_name,
        COUNT(*) as sale_count,
        SUM(retail_product3_price * retail_product3_quantity) as total_sales,
        SUM(retail_product3_quantity) as total_quantity
      FROM treatments 
      ${dateCondition}
      AND retail_product3 IS NOT NULL 
      AND retail_product3 != ''
      AND retail_product3_quantity > 0
      GROUP BY retail_product3
      `
      )
      .all(params);

    // 結果を結合（その他商品は除外）
    const allStats = [
      ...retailProductStats,
      ...retailProductStats2,
      ...retailProductStats3,
    ];

    // 商品名を整形（ID部分を除去）
    const formattedStats = allStats.map((stat: any) => ({
      ...stat,
      product_name: stat.product_name.includes("-")
        ? stat.product_name.split("-").slice(0, -1).join("-")
        : stat.product_name,
      total_sales: stat.total_sales || 0,
      total_quantity: stat.total_quantity || 0,
    }));

    // 同じ商品名のものを集計
    const aggregatedStats = formattedStats.reduce((acc: any[], stat: any) => {
      const existing = acc.find(
        (item) => item.product_name === stat.product_name
      );
      if (existing) {
        existing.sale_count += stat.sale_count;
        existing.total_sales += stat.total_sales;
        existing.total_quantity += stat.total_quantity;
      } else {
        acc.push({
          product_name: stat.product_name,
          sale_count: stat.sale_count,
          total_sales: stat.total_sales,
          total_quantity: stat.total_quantity,
        });
      }
      return acc;
    }, [] as any[]);

    // 販売数でソート
    aggregatedStats.sort((a, b) => b.sale_count - a.sale_count);

    db.close();

    return NextResponse.json(aggregatedStats);
  } catch (error) {
    console.error("店販商品別統計取得エラー:", error);
    return NextResponse.json(
      { error: "店販商品別統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}
