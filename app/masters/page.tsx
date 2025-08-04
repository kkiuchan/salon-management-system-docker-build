"use client";
import DiscountTypeManagement from "@/components/masters/DiscountTypeManagement";
import PaymentMethodManagement from "@/components/masters/PaymentMethodManagement";
import ReferralSourceManagement from "@/components/masters/ReferralSourceManagement";
import RetailProductManagement from "@/components/masters/RetailProductManagement";
import StaffManagement from "@/components/masters/StaffManagement";
import TreatmentMenuManagement from "@/components/masters/TreatmentMenuManagement";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Home,
  MessageSquare,
  Package,
  Percent,
  Scissors,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function MastersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("staff");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "staff",
        "treatment-menus",
        "referral-sources",
        "payment-methods",
        "discount-types",
        "retail-products",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">マスターデータ管理</h1>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">スタッフ</span>
            </TabsTrigger>
            <TabsTrigger
              value="treatment-menus"
              className="flex items-center gap-2"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden md:inline">施術メニュー</span>
            </TabsTrigger>
            <TabsTrigger
              value="referral-sources"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">来店きっかけ</span>
            </TabsTrigger>
            <TabsTrigger
              value="payment-methods"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">支払い方法</span>
            </TabsTrigger>
            <TabsTrigger
              value="discount-types"
              className="flex items-center gap-2"
            >
              <Percent className="h-4 w-4" />
              <span className="hidden md:inline">割引種別</span>
            </TabsTrigger>
            <TabsTrigger
              value="retail-products"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">店頭販売商品</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="treatment-menus">
            <TreatmentMenuManagement />
          </TabsContent>

          <TabsContent value="referral-sources">
            <ReferralSourceManagement />
          </TabsContent>

          <TabsContent value="payment-methods">
            <PaymentMethodManagement />
          </TabsContent>

          <TabsContent value="discount-types">
            <DiscountTypeManagement />
          </TabsContent>

          <TabsContent value="retail-products">
            <RetailProductManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function MastersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MastersContent />
    </Suspense>
  );
}
