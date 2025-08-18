"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  DollarSign,
  FileText,
  Home,
  Percent,
  Scissors,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

interface TreatmentMenuStats {
  menu_name: string;
  treatment_count: number;
  total_fee: number;
}

interface RetailProductStats {
  product_name: string;
  sale_count: number;
  total_sales: number;
  total_quantity: number;
}

export default function SalesDashboard() {
  const router = useRouter();
  // 現在の月の最初の日と最後の日を取得
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // タイムゾーンを考慮して日付を取得
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(lastDay),
    };
  };

  const { startDate: defaultStartDate, endDate: defaultEndDate } =
    getCurrentMonthRange();

  const [customStartDate, setCustomStartDate] =
    useState<string>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultEndDate);
  const [activeTab, setActiveTab] = useState("summary");
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [paymentMethodSales, setPaymentMethodSales] = useState<
    PaymentMethodSales[]
  >([]);
  const [staffSales, setStaffSales] = useState<StaffSales[]>([]);
  const [discountData, setDiscountData] = useState<DiscountData | null>(null);
  const [treatmentMenuStats, setTreatmentMenuStats] = useState<
    TreatmentMenuStats[]
  >([]);
  const [retailProductStats, setRetailProductStats] = useState<
    RetailProductStats[]
  >([]);
  const [loading, setLoading] = useState(false);

  // 初期データ取得は行わない（ユーザーが手動でデータ取得ボタンを押すまで）

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      console.log("売上データ取得開始:", {
        customStartDate,
        customEndDate,
      });

      // 日付パラメータを追加
      const customParams =
        customStartDate && customEndDate
          ? `&startDate=${customStartDate}&endDate=${customEndDate}`
          : "";

      const [
        summaryRes,
        dailyRes,
        paymentRes,
        staffRes,
        discountRes,
        treatmentMenuRes,
        retailProductRes,
      ] = await Promise.all([
        fetch(`/api/sales/summary?period=custom${customParams}`),
        fetch(`/api/sales/daily?period=custom${customParams}`),
        fetch(`/api/sales/by-payment?period=custom${customParams}`),
        fetch(`/api/sales/by-staff?period=custom${customParams}`),
        fetch(`/api/sales/by-discount?period=custom${customParams}`),
        fetch(`/api/sales/by-treatment-menu?period=custom${customParams}`),
        fetch(`/api/sales/by-retail-product?period=custom${customParams}`),
      ]);

      console.log("APIレスポンス状況:", {
        summary: { ok: summaryRes.ok, status: summaryRes.status },
        daily: { ok: dailyRes.ok, status: dailyRes.status },
        payment: { ok: paymentRes.ok, status: paymentRes.status },
        staff: { ok: staffRes.ok, status: staffRes.status },
        discount: { ok: discountRes.ok, status: discountRes.status },
        treatmentMenu: {
          ok: treatmentMenuRes.ok,
          status: treatmentMenuRes.status,
        },
        retailProduct: {
          ok: retailProductRes.ok,
          status: retailProductRes.status,
        },
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

      if (treatmentMenuRes.ok) {
        const treatmentMenuData = await treatmentMenuRes.json();
        console.log("施術メニュー別データ:", treatmentMenuData);
        setTreatmentMenuStats(treatmentMenuData);
      } else {
        console.error(
          "施術メニュー別APIエラー:",
          treatmentMenuRes.status,
          treatmentMenuRes.statusText
        );
        const errorText = await treatmentMenuRes.text();
        console.error("エラー詳細:", errorText);
      }

      if (retailProductRes.ok) {
        const retailProductData = await retailProductRes.json();
        console.log("店販商品別データ:", retailProductData);
        setRetailProductStats(retailProductData);
      } else {
        console.error(
          "店販商品別APIエラー:",
          retailProductRes.status,
          retailProductRes.statusText
        );
        const errorText = await retailProductRes.text();
        console.error("エラー詳細:", errorText);
      }
    } catch (error) {
      console.error("売上データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  // 売上データエクスポート機能
  const handleExportSalesData = async () => {
    try {
      const response = await fetch("/api/sales/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: customStartDate,
          endDate: customEndDate,
          format: "csv",
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename = `sales_report_${customStartDate}_${customEndDate}.csv`;

        // ファイルダウンロード
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await response.text();
        console.error("エクスポートエラーレスポンス:", errorText);
        alert(
          `エクスポートに失敗しました: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("売上データエクスポートエラー:", error);
      alert(
        `エクスポートエラー: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getPeriodLabel = () => {
    return customStartDate && customEndDate
      ? `${customStartDate} 〜 ${customEndDate}`
      : "期間を選択してください";
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
        <div className="space-y-4">
          {/* カスタム期間選択 */}
          <div className="flex gap-4 items-center p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                開始日:
              </label>
              <input
                id="startDate"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                終了日:
              </label>
              <input
                id="endDate"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={fetchSalesData}
              disabled={!customStartDate || !customEndDate}
              className="ml-4"
            >
              データ取得
            </Button>
            <Button
              size="sm"
              onClick={handleExportSalesData}
              disabled={!customStartDate || !customEndDate}
              className="ml-4 bg-green-600 hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              エクセル出力
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger
              value="treatment-menu"
              className="flex items-center gap-2"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden md:inline">施術メニュー別</span>
            </TabsTrigger>
            <TabsTrigger
              value="retail-product"
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden md:inline">店販商品別</span>
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

          {/* 施術メニュー別タブ */}
          <TabsContent value="treatment-menu">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    施術メニュー別統計
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {treatmentMenuStats.length > 0 ? (
                    <div className="space-y-4">
                      {treatmentMenuStats.map((menu) => (
                        <div
                          key={menu.menu_name}
                          className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium text-lg">
                              {menu.menu_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {menu.treatment_count}回の施術
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600 text-lg">
                              {formatCurrency(menu.total_fee)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        施術メニューデータがありません
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 店販商品別タブ */}
          <TabsContent value="retail-product">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    店販商品別統計
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {retailProductStats.length > 0 ? (
                    <div className="space-y-4">
                      {retailProductStats.map((product) => (
                        <div
                          key={product.product_name}
                          className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium text-lg">
                              {product.product_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {product.sale_count}回の販売・
                              {product.total_quantity}個
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-blue-600 text-lg">
                              {formatCurrency(product.total_sales)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        店販商品データがありません
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
