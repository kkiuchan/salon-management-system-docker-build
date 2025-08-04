"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  DollarSign,
  Home,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SalesSummary {
  total_sales: number;
  total_treatment_fee: number;
  total_retail_fee: number;
  total_treatments: number;
  unique_customers: number;
  average_amount: number;
}

interface DailySales {
  date: string;
  daily_sales: number;
  treatment_sales: number;
  retail_sales: number;
  treatment_count: number;
  customer_count: number;
}

interface PaymentMethodSales {
  payment_method: string;
  total_sales: number;
  transaction_count: number;
  average_amount: number;
}

interface StaffSales {
  stylist_name: string;
  total_sales: number;
  treatment_count: number;
  average_sales: number;
}

interface DiscountSales {
  discount_type: string;
  total_discount_amount: number;
  transaction_count: number;
  total_sales: number;
  average_discount: number;
}

interface TotalDiscountInfo {
  total_treatment_discount: number;
  total_retail_discount: number;
  total_discount: number;
  total_transactions: number;
  discounted_transactions: number;
}

interface DiscountData {
  treatmentDiscounts: DiscountSales[];
  retailDiscounts: DiscountSales[];
  totalDiscountInfo: TotalDiscountInfo;
}

export default function SalesDashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">(
    "month"
  );
  const [activeTab, setActiveTab] = useState("summary");
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [paymentMethodSales, setPaymentMethodSales] = useState<
    PaymentMethodSales[]
  >([]);
  const [staffSales, setStaffSales] = useState<StaffSales[]>([]);
  const [discountData, setDiscountData] = useState<DiscountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      console.log("売上データ取得開始:", { period });

      const [summaryRes, dailyRes, paymentRes, staffRes, discountRes] =
        await Promise.all([
          fetch(`/api/sales/summary?period=${period}`),
          fetch(`/api/sales/daily?period=${period}`),
          fetch(`/api/sales/by-payment?period=${period}`),
          fetch(`/api/sales/by-staff?period=${period}`),
          fetch(`/api/sales/by-discount?period=${period}`),
        ]);

      console.log("APIレスポンス状況:", {
        summary: { ok: summaryRes.ok, status: summaryRes.status },
        daily: { ok: dailyRes.ok, status: dailyRes.status },
        payment: { ok: paymentRes.ok, status: paymentRes.status },
        staff: { ok: staffRes.ok, status: staffRes.status },
        discount: { ok: discountRes.ok, status: discountRes.status },
      });

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        console.log("売上サマリーデータ:", summaryData);
        setSalesSummary(summaryData);
      } else {
        console.error(
          "売上サマリーAPIエラー:",
          summaryRes.status,
          summaryRes.statusText
        );
        const errorText = await summaryRes.text();
        console.error("エラー詳細:", errorText);
      }

      if (dailyRes.ok) {
        const dailyData = await dailyRes.json();
        console.log("日別売上データ:", dailyData);
        setDailySales(dailyData);
      } else {
        console.error(
          "日別売上APIエラー:",
          dailyRes.status,
          dailyRes.statusText
        );
        const errorText = await dailyRes.text();
        console.error("エラー詳細:", errorText);
      }

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        console.log("支払い方法別データ:", paymentData);
        setPaymentMethodSales(paymentData);
      } else {
        console.error(
          "支払い方法別APIエラー:",
          paymentRes.status,
          paymentRes.statusText
        );
        const errorText = await paymentRes.text();
        console.error("エラー詳細:", errorText);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        console.log("スタッフ別データ:", staffData);
        setStaffSales(staffData);
      } else {
        console.error(
          "スタッフ別APIエラー:",
          staffRes.status,
          staffRes.statusText
        );
        const errorText = await staffRes.text();
        console.error("エラー詳細:", errorText);
      }

      if (discountRes.ok) {
        const discountData = await discountRes.json();
        console.log("割引データ:", discountData);
        setDiscountData(discountData);
      } else {
        console.error(
          "割引APIエラー:",
          discountRes.status,
          discountRes.statusText
        );
        const errorText = await discountRes.text();
        console.error("エラー詳細:", errorText);
      }
    } catch (error) {
      console.error("売上データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "今日";
      case "week":
        return "今週";
      case "month":
        return "今月";
      case "year":
        return "今年";
      default:
        return "今月";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">売上管理</h1>
        </div>
        <Button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          ダッシュボード
        </Button>
      </div>

      <div className="space-y-6">
        {/* 期間選択とレポート出力 */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {(["today", "week", "month", "year"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "today" && "今日"}
                {p === "week" && "今週"}
                {p === "month" && "今月"}
                {p === "year" && "今年"}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">売上サマリー</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">日別売上</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">支払い方法別</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">スタッフ別</span>
            </TabsTrigger>
            <TabsTrigger value="discount" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              <span className="hidden md:inline">割引情報</span>
            </TabsTrigger>
          </TabsList>

          {/* 売上サマリータブ */}
          <TabsContent value="summary">
            {salesSummary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        総売上
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesSummary.total_sales)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getPeriodLabel()}の総売上
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        施術料
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesSummary.total_treatment_fee)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        施術による売上
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        商品販売
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesSummary.total_retail_fee)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        商品による売上
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        平均客単価
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesSummary.average_amount)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        1回あたりの平均
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 割引サマリー */}
                {discountData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          総割引額
                        </CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(
                            discountData.totalDiscountInfo.total_discount
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          施術:{" "}
                          {formatCurrency(
                            discountData.totalDiscountInfo
                              .total_treatment_discount
                          )}{" "}
                          / 商品:{" "}
                          {formatCurrency(
                            discountData.totalDiscountInfo.total_retail_discount
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          割引適用率
                        </CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {discountData.totalDiscountInfo.total_transactions > 0
                            ? `${Math.round(
                                (discountData.totalDiscountInfo
                                  .discounted_transactions /
                                  discountData.totalDiscountInfo
                                    .total_transactions) *
                                  100
                              )}%`
                            : "0%"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {
                            discountData.totalDiscountInfo
                              .discounted_transactions
                          }
                          件 /{" "}
                          {discountData.totalDiscountInfo.total_transactions}件
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          平均割引額
                        </CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {discountData.totalDiscountInfo
                            .discounted_transactions > 0
                            ? formatCurrency(
                                Math.round(
                                  discountData.totalDiscountInfo
                                    .total_discount /
                                    discountData.totalDiscountInfo
                                      .discounted_transactions
                                )
                              )
                            : formatCurrency(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          割引適用取引の平均
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 日別売上タブ */}
          <TabsContent value="daily">
            {dailySales.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>日別売上推移</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailySales.slice(0, 20).map((day) => (
                      <div
                        key={day.date}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {new Date(day.date).toLocaleDateString("ja-JP")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {day.customer_count}名の顧客 / {day.treatment_count}
                            件の施術
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(day.daily_sales)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            施術: {formatCurrency(day.treatment_sales)} / 商品:{" "}
                            {formatCurrency(day.retail_sales)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">データがありません</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 支払い方法別タブ */}
          <TabsContent value="payment">
            {paymentMethodSales.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>支払い方法別売上</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentMethodSales.map((payment) => (
                      <div
                        key={payment.payment_method}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {payment.payment_method}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.transaction_count}件の取引
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(payment.total_sales)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            平均 {formatCurrency(payment.average_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">データがありません</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* スタッフ別タブ */}
          <TabsContent value="staff">
            {staffSales.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>スタッフ別売上</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffSales.map((staff) => (
                      <div
                        key={staff.stylist_name}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {staff.stylist_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {staff.treatment_count}件の施術
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(staff.total_sales)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            平均 {formatCurrency(staff.average_sales)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">データがありません</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 割引情報タブ */}
          <TabsContent value="discount">
            {discountData ? (
              <div className="space-y-6">
                {/* 施術割引 */}
                <Card>
                  <CardHeader>
                    <CardTitle>施術割引別売上</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {discountData.treatmentDiscounts.filter(
                      (d) =>
                        d.discount_type &&
                        d.discount_type !== "なし" &&
                        d.total_discount_amount > 0
                    ).length > 0 ? (
                      <div className="space-y-3">
                        {discountData.treatmentDiscounts
                          .filter(
                            (d) =>
                              d.discount_type &&
                              d.discount_type !== "なし" &&
                              d.total_discount_amount > 0
                          )
                          .map((discount) => (
                            <div
                              key={discount.discount_type}
                              className="flex justify-between items-center p-3 border rounded-lg"
                            >
                              <div>
                                <div className="font-medium">
                                  {discount.discount_type}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {discount.transaction_count}件の取引
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-red-600">
                                  -
                                  {formatCurrency(
                                    discount.total_discount_amount
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  平均 -
                                  {formatCurrency(discount.average_discount)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          施術割引データがありません
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 商品割引 */}
                <Card>
                  <CardHeader>
                    <CardTitle>商品割引別売上</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {discountData.retailDiscounts.filter(
                      (d) =>
                        d.discount_type &&
                        d.discount_type !== "なし" &&
                        d.total_discount_amount > 0
                    ).length > 0 ? (
                      <div className="space-y-3">
                        {discountData.retailDiscounts
                          .filter(
                            (d) =>
                              d.discount_type &&
                              d.discount_type !== "なし" &&
                              d.total_discount_amount > 0
                          )
                          .map((discount) => (
                            <div
                              key={discount.discount_type}
                              className="flex justify-between items-center p-3 border rounded-lg"
                            >
                              <div>
                                <div className="font-medium">
                                  {discount.discount_type}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {discount.transaction_count}件の取引
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-red-600">
                                  -
                                  {formatCurrency(
                                    discount.total_discount_amount
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  平均 -
                                  {formatCurrency(discount.average_discount)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          商品割引データがありません
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    割引データがありません
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
