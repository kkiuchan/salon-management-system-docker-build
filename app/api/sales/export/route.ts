import db from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

interface SalesDataRow {
  treatment_date: string;
  customer_name: string | null;
  stylist_name: string | null;
  treatment_fee: number | null;
  retail_fee: number | null;
  total_amount: number | null;
  payment_method: string | null;
  treatment_content1: string | null;
  treatment_content2: string | null;
  treatment_content3: string | null;
  retail_product1: string | null;
  retail_product1_quantity: number | null;
  retail_product1_price: number | null;
  retail_product2: string | null;
  retail_product2_quantity: number | null;
  retail_product2_price: number | null;
  retail_product3: string | null;
  retail_product3_quantity: number | null;
  retail_product3_price: number | null;
  treatment_discount_amount: number | null;
  retail_discount_amount: number | null;
  treatment_discount_type: string | null;
  retail_discount_type: string | null;
}

interface SummaryData {
  period: string;
  total_sales: number;
  total_treatments: number;
  total_customers: number;
  average_sales: number;
  treatment_sales: number;
  retail_sales: number;
  discount_amount: number;
}

interface StaffRanking {
  stylist_name: string;
  total_sales: number;
  treatment_count: number;
  average_sales: number;
  customer_count: number;
}

interface TreatmentRanking {
  treatment_name: string;
  count: number;
  total_sales: number;
  average_price: number;
}

interface PaymentAnalysis {
  payment_method: string;
  count: number;
  total_amount: number;
  percentage: number;
}

interface DailyTrend {
  date: string;
  sales: number;
  treatments: number;
  customers: number;
}

interface CustomerAnalysis {
  customer_name: string;
  visit_count: number;
  total_spent: number;
  average_spent: number;
  last_visit: string;
}

interface ProductAnalysis {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  average_price: number;
}

interface DiscountAnalysis {
  discount_type: string;
  count: number;
  total_discount: number;
  average_discount: number;
}

// OPTIONSメソッドのハンドラー
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log("エクスポートAPI呼び出し開始");

    const body = await request.json();
    console.log("リクエストボディ:", body);

    const { startDate, endDate, format = "csv" } = body;

    if (!startDate || !endDate) {
      console.error("開始日または終了日が指定されていません");
      return NextResponse.json(
        { error: "開始日と終了日を指定してください" },
        { status: 400 }
      );
    }

    console.log("日付範囲:", { startDate, endDate, format });

    // データベース接続確認
    if (!db) {
      console.error("データベース接続が確立されていません");
      return NextResponse.json(
        { error: "データベース接続エラー" },
        { status: 500 }
      );
    }

    // 1. 売上サマリーを取得
    const summary = db
      .prepare(
        `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_treatments,
        COUNT(DISTINCT customer_id) as total_customers,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_sales,
        COALESCE(SUM(treatment_fee), 0) as treatment_sales,
        COALESCE(SUM(retail_fee), 0) as retail_sales,
        COALESCE(SUM(treatment_discount_amount + retail_discount_amount), 0) as discount_amount
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
    `
      )
      .get(startDate, endDate) as SummaryData;

    // 2. スタッフ別売上ランキング
    const staffRanking = db
      .prepare(
        `
      SELECT 
        COALESCE(stylist_name, '未設定') as stylist_name,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as treatment_count,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_sales,
        COUNT(DISTINCT customer_id) as customer_count
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY stylist_name
      ORDER BY total_sales DESC
    `
      )
      .all(startDate, endDate) as StaffRanking[];

    // 3. 施術メニューランキング
    const treatmentRanking = db
      .prepare(
        `
      SELECT 
        treatment_content1 as treatment_name,
        COUNT(*) as count,
        COALESCE(SUM(treatment_fee), 0) as total_sales,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(treatment_fee), 0) / COUNT(*)
          ELSE 0 
        END as average_price
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ? 
        AND treatment_content1 IS NOT NULL 
        AND treatment_content1 != ''
      GROUP BY treatment_content1
      ORDER BY count DESC
      LIMIT 10
    `
      )
      .all(startDate, endDate) as TreatmentRanking[];

    // 4. 支払い方法別分析
    const paymentAnalysis = db
      .prepare(
        `
      SELECT 
        COALESCE(payment_method, '未設定') as payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        CASE 
          WHEN (SELECT COUNT(*) FROM treatments WHERE treatment_date >= ? AND treatment_date <= ?) > 0 
          THEN (COUNT(*) * 100.0) / (SELECT COUNT(*) FROM treatments WHERE treatment_date >= ? AND treatment_date <= ?)
          ELSE 0 
        END as percentage
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `
      )
      .all(
        startDate,
        endDate,
        startDate,
        endDate,
        startDate,
        endDate
      ) as PaymentAnalysis[];

    // 5. 日別売上推移
    const dailyTrend = db
      .prepare(
        `
      SELECT 
        treatment_date as date,
        COALESCE(SUM(total_amount), 0) as sales,
        COUNT(*) as treatments,
        COUNT(DISTINCT customer_id) as customers
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY treatment_date
      ORDER BY treatment_date
    `
      )
      .all(startDate, endDate) as DailyTrend[];

    // 6. 顧客別分析
    const customerAnalysis = db
      .prepare(
        `
      SELECT 
        c.name as customer_name,
        COUNT(*) as visit_count,
        COALESCE(SUM(t.total_amount), 0) as total_spent,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(t.total_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_spent,
        MAX(t.treatment_date) as last_visit
      FROM treatments t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.treatment_date >= ? AND t.treatment_date <= ?
      GROUP BY t.customer_id, c.name
      ORDER BY total_spent DESC
      LIMIT 20
    `
      )
      .all(startDate, endDate) as CustomerAnalysis[];

    // 7. 商品販売分析
    const productAnalysis = db
      .prepare(
        `
      SELECT 
        retail_product1 as product_name,
        COALESCE(SUM(retail_product1_quantity), 0) as quantity_sold,
        COALESCE(SUM(retail_product1_quantity * retail_product1_price), 0) as total_revenue,
        CASE 
          WHEN COALESCE(SUM(retail_product1_quantity), 0) > 0 
          THEN COALESCE(SUM(retail_product1_quantity * retail_product1_price), 0) / COALESCE(SUM(retail_product1_quantity), 0)
          ELSE 0 
        END as average_price
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ? 
        AND retail_product1 IS NOT NULL 
        AND retail_product1 != ''
      GROUP BY retail_product1
      ORDER BY total_revenue DESC
    `
      )
      .all(startDate, endDate) as ProductAnalysis[];

    // 8. 割引分析
    const discountAnalysis = db
      .prepare(
        `
      SELECT 
        COALESCE(treatment_discount_type, '割引なし') as discount_type,
        COUNT(*) as count,
        COALESCE(SUM(treatment_discount_amount + retail_discount_amount), 0) as total_discount,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(treatment_discount_amount + retail_discount_amount), 0) / COUNT(*)
          ELSE 0 
        END as average_discount
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY treatment_discount_type
      ORDER BY total_discount DESC
    `
      )
      .all(startDate, endDate) as DiscountAnalysis[];

    // 9. 詳細売上データ
    const salesData = db
      .prepare(
        `
      SELECT 
        t.treatment_date,
        c.name as customer_name,
        t.stylist_name,
        t.treatment_fee,
        t.retail_fee,
        t.total_amount,
        t.payment_method,
        t.treatment_content1,
        t.treatment_content2,
        t.treatment_content3,
        t.retail_product1,
        t.retail_product1_quantity,
        t.retail_product1_price,
        t.retail_product2,
        t.retail_product2_quantity,
        t.retail_product2_price,
        t.retail_product3,
        t.retail_product3_quantity,
        t.retail_product3_price,
        t.treatment_discount_amount,
        t.retail_discount_amount,
        t.treatment_discount_type,
        t.retail_discount_type
      FROM treatments t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.treatment_date >= ? AND t.treatment_date <= ?
      ORDER BY t.treatment_date DESC, t.id DESC
    `
      )
      .all(startDate, endDate);

    if (format === "csv") {
      console.log("CSV形式でエクスポート開始");

      // 詳細売上データのみをCSV形式で出力（Excelで開きやすい）
      const csvContent = generateDetailedSalesCSV(salesData as SalesDataRow[]);

      // BOMを追加してUTF-8エンコーディングを明示
      const bom = "\uFEFF";
      const csvWithBom = bom + csvContent;

      // ファイル名を生成
      const fileName = `sales_report_${startDate}_${endDate}.csv`;

      console.log("CSVファイル生成完了:", fileName);

      return new NextResponse(csvWithBom, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
            fileName
          )}`,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 統計情報として整理されたデータを返す
    const statisticsData = {
      // レポート基本情報
      reportInfo: {
        title: "売上統計レポート",
        period: `${startDate} ～ ${endDate}`,
        generatedAt: new Date().toISOString(),
        totalRecords: salesData.length,
      },

      // 基本統計
      basicStats: {
        totalSales: summary.total_sales,
        totalTreatments: summary.total_treatments,
        totalCustomers: summary.total_customers,
        averageSales: summary.average_sales,
        treatmentSales: summary.treatment_sales,
        retailSales: summary.retail_sales,
        totalDiscount: summary.discount_amount,
        salesPerCustomer:
          summary.total_customers > 0
            ? summary.total_sales / summary.total_customers
            : 0,
        salesPerTreatment:
          summary.total_treatments > 0
            ? summary.total_sales / summary.total_treatments
            : 0,
      },

      // スタッフ統計
      staffStats: {
        totalStaff: staffRanking.length,
        topPerformer: staffRanking[0] || null,
        averageSalesPerStaff:
          staffRanking.length > 0
            ? staffRanking.reduce((sum, staff) => sum + staff.total_sales, 0) /
              staffRanking.length
            : 0,
        ranking: staffRanking.map((staff, index) => ({
          rank: index + 1,
          name: staff.stylist_name,
          totalSales: staff.total_sales,
          treatmentCount: staff.treatment_count,
          averageSales: staff.average_sales,
          customerCount: staff.customer_count,
          percentageOfTotal:
            summary.total_sales > 0
              ? (staff.total_sales / summary.total_sales) * 100
              : 0,
        })),
      },

      // 施術統計
      treatmentStats: {
        totalTreatmentTypes: treatmentRanking.length,
        mostPopular: treatmentRanking[0] || null,
        averagePrice:
          treatmentRanking.length > 0
            ? treatmentRanking.reduce(
                (sum, treatment) => sum + treatment.average_price,
                0
              ) / treatmentRanking.length
            : 0,
        ranking: treatmentRanking.map((treatment, index) => ({
          rank: index + 1,
          name: treatment.treatment_name,
          count: treatment.count,
          totalSales: treatment.total_sales,
          averagePrice: treatment.average_price,
          percentageOfTotal:
            summary.total_treatments > 0
              ? (treatment.count / summary.total_treatments) * 100
              : 0,
        })),
      },

      // 支払い方法統計
      paymentStats: {
        totalPaymentMethods: paymentAnalysis.length,
        mostUsed: paymentAnalysis[0] || null,
        cashPercentage:
          paymentAnalysis.find((p) => p.payment_method === "現金")
            ?.percentage || 0,
        cardPercentage:
          paymentAnalysis.find((p) => p.payment_method === "クレジットカード")
            ?.percentage || 0,
        methods: paymentAnalysis.map((payment) => ({
          method: payment.payment_method,
          count: payment.count,
          totalAmount: payment.total_amount,
          percentage: payment.percentage,
          averageAmount:
            payment.count > 0 ? payment.total_amount / payment.count : 0,
        })),
      },

      // 日別統計
      dailyStats: {
        totalDays: dailyTrend.length,
        highestSalesDay: dailyTrend.reduce(
          (max, day) => (day.sales > max.sales ? day : max),
          dailyTrend[0] || { sales: 0, date: "" }
        ),
        lowestSalesDay: dailyTrend.reduce(
          (min, day) => (day.sales < min.sales ? day : min),
          dailyTrend[0] || { sales: 0, date: "" }
        ),
        averageDailySales:
          dailyTrend.length > 0
            ? dailyTrend.reduce((sum, day) => sum + day.sales, 0) /
              dailyTrend.length
            : 0,
        averageDailyTreatments:
          dailyTrend.length > 0
            ? dailyTrend.reduce((sum, day) => sum + day.treatments, 0) /
              dailyTrend.length
            : 0,
        averageDailyCustomers:
          dailyTrend.length > 0
            ? dailyTrend.reduce((sum, day) => sum + day.customers, 0) /
              dailyTrend.length
            : 0,
        trend: dailyTrend.map((day) => ({
          date: day.date,
          sales: day.sales,
          treatments: day.treatments,
          customers: day.customers,
          salesPerCustomer: day.customers > 0 ? day.sales / day.customers : 0,
          salesPerTreatment:
            day.treatments > 0 ? day.sales / day.treatments : 0,
        })),
      },

      // 顧客統計
      customerStats: {
        totalCustomers: customerAnalysis.length,
        topCustomer: customerAnalysis[0] || null,
        averageVisits:
          customerAnalysis.length > 0
            ? customerAnalysis.reduce(
                (sum, customer) => sum + customer.visit_count,
                0
              ) / customerAnalysis.length
            : 0,
        averageSpent:
          customerAnalysis.length > 0
            ? customerAnalysis.reduce(
                (sum, customer) => sum + customer.total_spent,
                0
              ) / customerAnalysis.length
            : 0,
        topCustomers: customerAnalysis.slice(0, 10).map((customer, index) => ({
          rank: index + 1,
          name: customer.customer_name || "未設定",
          visits: customer.visit_count,
          totalSpent: customer.total_spent,
          averageSpent: customer.average_spent,
          lastVisit: customer.last_visit,
          percentageOfTotal:
            summary.total_sales > 0
              ? (customer.total_spent / summary.total_sales) * 100
              : 0,
        })),
      },

      // 商品統計
      productStats: {
        totalProducts: productAnalysis.length,
        bestSeller: productAnalysis[0] || null,
        totalQuantitySold: productAnalysis.reduce(
          (sum, product) => sum + product.quantity_sold,
          0
        ),
        totalProductRevenue: productAnalysis.reduce(
          (sum, product) => sum + product.total_revenue,
          0
        ),
        averageProductPrice:
          productAnalysis.length > 0
            ? productAnalysis.reduce(
                (sum, product) => sum + product.average_price,
                0
              ) / productAnalysis.length
            : 0,
        products: productAnalysis.map((product, index) => ({
          rank: index + 1,
          name: product.product_name || "未設定",
          quantitySold: product.quantity_sold,
          totalRevenue: product.total_revenue,
          averagePrice: product.average_price,
          percentageOfTotal:
            summary.retail_sales > 0
              ? (product.total_revenue / summary.retail_sales) * 100
              : 0,
        })),
      },

      // 割引統計
      discountStats: {
        totalDiscountTypes: discountAnalysis.length,
        totalDiscountAmount: discountAnalysis.reduce(
          (sum, discount) => sum + discount.total_discount,
          0
        ),
        totalDiscountedTransactions: discountAnalysis.reduce(
          (sum, discount) => sum + discount.count,
          0
        ),
        averageDiscount:
          discountAnalysis.length > 0
            ? discountAnalysis.reduce(
                (sum, discount) => sum + discount.average_discount,
                0
              ) / discountAnalysis.length
            : 0,
        discountRate:
          summary.total_sales > 0
            ? (discountAnalysis.reduce(
                (sum, discount) => sum + discount.total_discount,
                0
              ) /
                summary.total_sales) *
              100
            : 0,
        discounts: discountAnalysis.map((discount) => ({
          type: discount.discount_type,
          count: discount.count,
          totalAmount: discount.total_discount,
          averageAmount: discount.average_discount,
          percentageOfTotal:
            summary.total_sales > 0
              ? (discount.total_discount / summary.total_sales) * 100
              : 0,
        })),
      },

      // 月別比較（過去3ヶ月）
      monthlyComparison: [],

      // パフォーマンス指標
      performanceMetrics: {
        customerRetentionRate: 0,
        averageTreatmentDuration: 90,
        salesGrowthRate: 0,
        customerSatisfactionScore: 0,
      },
    };

    // BOMを追加してUTF-8エンコーディングを明示
    const bom = "\uFEFF";
    const jsonContent = JSON.stringify(statisticsData, null, 2);
    const jsonWithBom = bom + jsonContent;

    // ファイル名を生成
    const fileName = `sales_statistics_report_${startDate}_${endDate}.json`;

    console.log("売上統計レポートJSON形式でエクスポート完了");
    return new NextResponse(jsonWithBom, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          fileName
        )}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("売上レポート出力エラー:", error);
    return NextResponse.json(
      {
        error: "売上レポートの出力に失敗しました",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

// CSV生成ヘルパー関数
function generateSummaryCSV(
  summary: SummaryData,
  startDate: string,
  endDate: string
): string {
  const headers = ["項目", "値", "期間"];

  const rows = [
    [
      "総売上",
      summary.total_sales.toLocaleString(),
      `${startDate} ～ ${endDate}`,
    ],
    [
      "総施術数",
      summary.total_treatments.toString(),
      `${startDate} ～ ${endDate}`,
    ],
    [
      "総顧客数",
      summary.total_customers.toString(),
      `${startDate} ～ ${endDate}`,
    ],
    [
      "平均売上",
      summary.average_sales.toLocaleString(),
      `${startDate} ～ ${endDate}`,
    ],
    [
      "施術売上",
      summary.treatment_sales.toLocaleString(),
      `${startDate} ～ ${endDate}`,
    ],
    [
      "商品売上",
      summary.retail_sales.toLocaleString(),
      `${startDate} ～ ${endDate}`,
    ],
    [
      "総割引額",
      summary.discount_amount.toLocaleString(),
      `${startDate} ～ ${endDate}`,
    ],
  ];

  return generateCSV(headers, rows);
}

function generateStaffRankingCSV(staffRanking: StaffRanking[]): string {
  const headers = [
    "順位",
    "スタッフ名",
    "総売上",
    "施術数",
    "平均売上",
    "顧客数",
  ];

  const rows = staffRanking.map((staff, index) => [
    (index + 1).toString(),
    staff.stylist_name,
    staff.total_sales.toLocaleString(),
    staff.treatment_count.toString(),
    staff.average_sales.toLocaleString(),
    staff.customer_count.toString(),
  ]);

  return generateCSV(headers, rows);
}

function generateTreatmentRankingCSV(
  treatmentRanking: TreatmentRanking[]
): string {
  const headers = ["順位", "施術メニュー", "実施回数", "総売上", "平均価格"];

  const rows = treatmentRanking.map((treatment, index) => [
    (index + 1).toString(),
    treatment.treatment_name,
    treatment.count.toString(),
    treatment.total_sales.toLocaleString(),
    treatment.average_price.toLocaleString(),
  ]);

  return generateCSV(headers, rows);
}

function generatePaymentAnalysisCSV(
  paymentAnalysis: PaymentAnalysis[]
): string {
  const headers = ["支払い方法", "件数", "総額", "割合(%)"];

  const rows = paymentAnalysis.map((payment) => [
    payment.payment_method,
    payment.count.toString(),
    payment.total_amount.toLocaleString(),
    payment.percentage.toFixed(1),
  ]);

  return generateCSV(headers, rows);
}

function generateDailyTrendCSV(dailyTrend: DailyTrend[]): string {
  const headers = ["日付", "売上", "施術数", "顧客数"];

  const rows = dailyTrend.map((day) => [
    day.date,
    day.sales.toLocaleString(),
    day.treatments.toString(),
    day.customers.toString(),
  ]);

  return generateCSV(headers, rows);
}

function generateCustomerAnalysisCSV(
  customerAnalysis: CustomerAnalysis[]
): string {
  const headers = [
    "順位",
    "顧客名",
    "来店回数",
    "総利用額",
    "平均利用額",
    "最終来店日",
  ];

  const rows = customerAnalysis.map((customer, index) => [
    (index + 1).toString(),
    customer.customer_name || "未設定",
    customer.visit_count.toString(),
    customer.total_spent.toLocaleString(),
    customer.average_spent.toLocaleString(),
    customer.last_visit,
  ]);

  return generateCSV(headers, rows);
}

function generateProductAnalysisCSV(
  productAnalysis: ProductAnalysis[]
): string {
  const headers = ["順位", "商品名", "販売数量", "総売上", "平均価格"];

  const rows = productAnalysis.map((product, index) => [
    (index + 1).toString(),
    product.product_name || "未設定",
    product.quantity_sold.toString(),
    product.total_revenue.toLocaleString(),
    product.average_price.toLocaleString(),
  ]);

  return generateCSV(headers, rows);
}

function generateDiscountAnalysisCSV(
  discountAnalysis: DiscountAnalysis[]
): string {
  const headers = ["割引種別", "適用件数", "総割引額", "平均割引額"];

  const rows = discountAnalysis.map((discount) => [
    discount.discount_type,
    discount.count.toString(),
    discount.total_discount.toLocaleString(),
    discount.average_discount.toLocaleString(),
  ]);

  return generateCSV(headers, rows);
}

function generateDetailedSalesCSV(salesData: SalesDataRow[]): string {
  const headers = [
    "施術日",
    "顧客名",
    "スタッフ名",
    "施術料",
    "商品販売額",
    "合計金額",
    "支払い方法",
    "施術内容1",
    "施術内容2",
    "施術内容3",
    "商品1",
    "商品1数量",
    "商品1価格",
    "商品2",
    "商品2数量",
    "商品2価格",
    "商品3",
    "商品3数量",
    "商品3価格",
    "施術割引額",
    "商品割引額",
    "施術割引種別",
    "商品割引種別",
  ];

  const rows = salesData.map((row) => [
    row.treatment_date,
    (row.customer_name || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    (row.stylist_name || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    row.treatment_fee || 0,
    row.retail_fee || 0,
    row.total_amount || 0,
    (row.payment_method || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    (row.treatment_content1 || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    (row.treatment_content2 || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    (row.treatment_content3 || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    (row.retail_product1 || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    row.retail_product1_quantity || 0,
    row.retail_product1_price || 0,
    (row.retail_product2 || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    row.retail_product2_quantity || 0,
    row.retail_product2_price || 0,
    (row.retail_product3 || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    row.retail_product3_quantity || 0,
    row.retail_product3_price || 0,
    row.treatment_discount_amount || 0,
    row.retail_discount_amount || 0,
    (row.treatment_discount_type || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
    (row.retail_discount_type || "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
  ]);

  return generateCSV(headers, rows);
}

function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const csvRows = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ];
  return csvRows.join("\n");
}

// 月別比較データを生成
function generateMonthlyComparison(startDate: string, endDate: string) {
  try {
    const monthlyData = db
      .prepare(
        `
      SELECT 
        strftime('%Y-%m', treatment_date) as month,
        SUM(total_amount) as total_sales,
        COUNT(*) as treatment_count,
        COUNT(DISTINCT customer_id) as customer_count
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
      GROUP BY strftime('%Y-%m', treatment_date)
      ORDER BY month DESC
      LIMIT 3
    `
      )
      .all(startDate, endDate) as {
      month: string;
      total_sales: number;
      treatment_count: number;
      customer_count: number;
    }[];

    return monthlyData.map((month) => ({
      month: month.month,
      totalSales: month.total_sales,
      treatmentCount: month.treatment_count,
      customerCount: month.customer_count,
      averageSales:
        month.treatment_count > 0
          ? month.total_sales / month.treatment_count
          : 0,
    }));
  } catch (error) {
    console.error("月別比較データ取得エラー:", error);
    return [];
  }
}

// 顧客リテンション率を計算
function calculateCustomerRetentionRate(
  startDate: string,
  endDate: string
): number {
  try {
    const retentionData = db
      .prepare(
        `
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN visit_count > 1 THEN customer_id END) as returning_customers
      FROM (
        SELECT 
          customer_id,
          COUNT(*) as visit_count
        FROM treatments 
        WHERE treatment_date >= ? AND treatment_date <= ?
        GROUP BY customer_id
      )
    `
      )
      .get(startDate, endDate) as
      | {
          total_customers: number;
          returning_customers: number;
        }
      | undefined;

    if (retentionData && retentionData.total_customers > 0) {
      return (
        (retentionData.returning_customers / retentionData.total_customers) *
        100
      );
    }
    return 0;
  } catch (error) {
    console.error("顧客リテンション率計算エラー:", error);
    return 0;
  }
}

// 平均施術時間を計算（概算）
function calculateAverageTreatmentDuration(
  startDate: string,
  endDate: string
): number {
  try {
    const durationData = db
      .prepare(
        `
      SELECT 
        AVG(
          CASE 
            WHEN treatment_time IS NOT NULL AND treatment_time != '' 
            THEN CAST(SUBSTR(treatment_time, 1, 2) AS INTEGER) * 60 + CAST(SUBSTR(treatment_time, 4, 2) AS INTEGER)
            ELSE 90 
          END
        ) as average_duration_minutes
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
    `
      )
      .get(startDate, endDate) as
      | {
          average_duration_minutes: number;
        }
      | undefined;

    return durationData?.average_duration_minutes || 90;
  } catch (error) {
    console.error("平均施術時間計算エラー:", error);
    return 90;
  }
}

// 売上成長率を計算
function calculateSalesGrowthRate(startDate: string, endDate: string): number {
  try {
    // 現在期間の売上
    const currentSales = db
      .prepare(
        `
      SELECT COALESCE(SUM(total_amount), 0) as total_sales
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
    `
      )
      .get(startDate, endDate) as
      | {
          total_sales: number;
        }
      | undefined;

    // 前回期間の売上（同じ期間の前回）
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const periodDays = Math.ceil(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    const previousStartDate = new Date(
      startDateObj.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const previousEndDate = new Date(
      startDateObj.getTime() - 24 * 60 * 60 * 1000
    );

    const previousSales = db
      .prepare(
        `
      SELECT COALESCE(SUM(total_amount), 0) as total_sales
      FROM treatments 
      WHERE treatment_date >= ? AND treatment_date <= ?
    `
      )
      .get(
        previousStartDate.toISOString().split("T")[0],
        previousEndDate.toISOString().split("T")[0]
      ) as
      | {
          total_sales: number;
        }
      | undefined;

    if (previousSales?.total_sales && previousSales.total_sales > 0) {
      return (
        (((currentSales?.total_sales || 0) - previousSales.total_sales) /
          previousSales.total_sales) *
        100
      );
    }
    return 0;
  } catch (error) {
    console.error("売上成長率計算エラー:", error);
    return 0;
  }
}

// 顧客満足度スコアを計算（概算）
function calculateCustomerSatisfactionScore(
  startDate: string,
  endDate: string
): number {
  try {
    const satisfactionData = db
      .prepare(
        `
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN visit_count > 1 THEN customer_id END) as returning_customers,
        AVG(total_amount) as avg_spent
      FROM (
        SELECT 
          customer_id,
          COUNT(*) as visit_count,
          AVG(total_amount) as total_amount
        FROM treatments 
        WHERE treatment_date >= ? AND treatment_date <= ?
        GROUP BY customer_id
      )
    `
      )
      .get(startDate, endDate) as
      | {
          total_customers: number;
          returning_customers: number;
          avg_spent: number;
        }
      | undefined;

    if (
      satisfactionData?.total_customers &&
      satisfactionData.total_customers > 0
    ) {
      const retentionRate =
        (satisfactionData.returning_customers /
          satisfactionData.total_customers) *
        100;
      const avgSpent = satisfactionData.avg_spent || 0;

      // 簡易的な満足度スコア計算（リテンション率と平均支出額を組み合わせ）
      return Math.min(
        100,
        (retentionRate * 0.7 + Math.min(avgSpent / 1000, 30)) * 0.3
      );
    }
    return 0;
  } catch (error) {
    console.error("顧客満足度スコア計算エラー:", error);
    return 0;
  }
}
