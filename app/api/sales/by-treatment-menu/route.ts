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

    console.log("施術メニュー別統計取得開始:", { period, startDate, endDate });

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

    // 施術メニュー別の統計を取得
    const treatmentMenuStats = db
      .prepare(
        `
      SELECT 
        treatment_content1 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content1 IS NOT NULL 
      AND treatment_content1 != ''
      GROUP BY treatment_content1
      `
      )
      .all(params);

    const treatmentMenuStats2 = db
      .prepare(
        `
      SELECT 
        treatment_content2 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content2 IS NOT NULL 
      AND treatment_content2 != ''
      GROUP BY treatment_content2
      `
      )
      .all(params);

    const treatmentMenuStats3 = db
      .prepare(
        `
      SELECT 
        treatment_content3 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content3 IS NOT NULL 
      AND treatment_content3 != ''
      GROUP BY treatment_content3
      `
      )
      .all(params);

    const treatmentMenuStats4 = db
      .prepare(
        `
      SELECT 
        treatment_content4 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content4 IS NOT NULL 
      AND treatment_content4 != ''
      GROUP BY treatment_content4
      `
      )
      .all(params);

    const treatmentMenuStats5 = db
      .prepare(
        `
      SELECT 
        treatment_content5 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content5 IS NOT NULL 
      AND treatment_content5 != ''
      GROUP BY treatment_content5
      `
      )
      .all(params);

    const treatmentMenuStats6 = db
      .prepare(
        `
      SELECT 
        treatment_content6 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content6 IS NOT NULL 
      AND treatment_content6 != ''
      GROUP BY treatment_content6
      `
      )
      .all(params);

    const treatmentMenuStats7 = db
      .prepare(
        `
      SELECT 
        treatment_content7 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content7 IS NOT NULL 
      AND treatment_content7 != ''
      GROUP BY treatment_content7
      `
      )
      .all(params);

    const treatmentMenuStats8 = db
      .prepare(
        `
      SELECT 
        treatment_content8 as menu_name,
        COUNT(*) as treatment_count,
        SUM(treatment_fee) as total_fee
      FROM treatments 
      ${dateCondition}
      AND treatment_content8 IS NOT NULL 
      AND treatment_content8 != ''
      GROUP BY treatment_content8
      `
      )
      .all(params);

    // 結果を結合（その他施術は除外）
    const allStats = [
      ...treatmentMenuStats,
      ...treatmentMenuStats2,
      ...treatmentMenuStats3,
      ...treatmentMenuStats4,
      ...treatmentMenuStats5,
      ...treatmentMenuStats6,
      ...treatmentMenuStats7,
      ...treatmentMenuStats8,
    ];

    // メニュー名を整形（ID部分を除去）
    const formattedStats = allStats.map((stat: any) => ({
      ...stat,
      menu_name: stat.menu_name.includes("-")
        ? stat.menu_name.split("-").slice(0, -1).join("-")
        : stat.menu_name,
      total_fee: stat.total_fee || 0,
    }));

    // 同じメニュー名のものを集計
    const aggregatedStats = formattedStats.reduce((acc: any[], stat: any) => {
      const existing = acc.find((item) => item.menu_name === stat.menu_name);
      if (existing) {
        existing.treatment_count += stat.treatment_count;
        existing.total_fee += stat.total_fee;
      } else {
        acc.push({
          menu_name: stat.menu_name,
          treatment_count: stat.treatment_count,
          total_fee: stat.total_fee,
        });
      }
      return acc;
    }, [] as any[]);

    // 施術数でソート
    aggregatedStats.sort((a, b) => b.treatment_count - a.treatment_count);

    db.close();

    return NextResponse.json(aggregatedStats);
  } catch (error) {
    console.error("施術メニュー別統計取得エラー:", error);
    return NextResponse.json(
      { error: "施術メニュー別統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}
