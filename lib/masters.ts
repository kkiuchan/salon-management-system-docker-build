import {
  DiscountType,
  PaymentMethod,
  ReferralSource,
  RetailProduct,
  Staff,
  TreatmentMenu,
} from "@/types";

// スタッフ一覧取得
export async function fetchStaff(): Promise<Staff[]> {
  try {
    const response = await fetch("/api/masters/staff");
    if (!response.ok) throw new Error("スタッフの取得に失敗しました");
    const staff = await response.json();
    return staff.filter((item: Staff) => item.is_active);
  } catch (error) {
    console.error("スタッフ取得エラー:", error);
    return [];
  }
}

// 施術メニュー一覧取得
export async function fetchTreatmentMenus(): Promise<TreatmentMenu[]> {
  try {
    const response = await fetch("/api/masters/treatment-menus");
    if (!response.ok) throw new Error("施術メニューの取得に失敗しました");
    const menus = await response.json();
    return menus.filter((item: TreatmentMenu) => item.is_active);
  } catch (error) {
    console.error("施術メニュー取得エラー:", error);
    return [];
  }
}

// 来店きっかけ一覧取得
export async function fetchReferralSources(): Promise<ReferralSource[]> {
  try {
    const response = await fetch("/api/masters/referral-sources");
    if (!response.ok) throw new Error("来店きっかけの取得に失敗しました");
    const sources = await response.json();
    return sources.filter((item: ReferralSource) => item.is_active);
  } catch (error) {
    console.error("来店きっかけ取得エラー:", error);
    return [];
  }
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch("/api/masters/payment-methods");
    if (!response.ok) throw new Error("支払い方法の取得に失敗しました");
    const methods = await response.json();
    return methods.filter((item: PaymentMethod) => item.is_active);
  } catch (error) {
    console.error("支払い方法取得エラー:", error);
    return [];
  }
}

export async function fetchDiscountTypes(): Promise<DiscountType[]> {
  try {
    const response = await fetch("/api/masters/discount-types");
    if (!response.ok) throw new Error("割引種別の取得に失敗しました");
    const types = await response.json();
    return types.filter((item: DiscountType) => item.is_active);
  } catch (error) {
    console.error("割引種別取得エラー:", error);
    return [];
  }
}

export async function fetchRetailProducts(): Promise<RetailProduct[]> {
  try {
    const response = await fetch("/api/masters/retail-products");
    if (!response.ok) throw new Error("店頭販売商品の取得に失敗しました");
    const products = await response.json();
    return products.filter((item: RetailProduct) => item.is_active);
  } catch (error) {
    console.error("店頭販売商品取得エラー:", error);
    return [];
  }
}

// カテゴリ別に施術メニューをグループ化
export function groupMenusByCategory(menus: TreatmentMenu[]) {
  const grouped: { [key: string]: TreatmentMenu[] } = {};

  menus.forEach((menu) => {
    const category = menu.category || "その他";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(menu);
  });

  return grouped;
}
