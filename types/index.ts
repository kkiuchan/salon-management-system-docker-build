// 顧客情報
export interface Customer {
  id: number;
  furigana?: string;
  name: string;
  gender?: string;
  phone?: string;
  emergency_contact?: string;
  date_of_birth?: string;
  age?: number;
  occupation?: string;
  postal_code?: string;
  address?: string;
  visiting_family?: string;
  email?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  notes?: string;
  referral_source1?: string;
  referral_source2?: string;
  referral_source3?: string;
  referral_details?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInsert {
  furigana?: string;
  name: string;
  gender?: string;
  phone?: string;
  emergency_contact?: string;
  date_of_birth?: string;
  age?: number;
  occupation?: string;
  postal_code?: string;
  address?: string;
  visiting_family?: string;
  email?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  notes?: string;
  referral_source1?: string;
  referral_source2?: string;
  referral_source3?: string;
  referral_details?: string;
}

export interface CustomerUpdate extends Partial<CustomerInsert> {
  id: number;
}

export interface CustomerWithTreatments extends Customer {
  treatments: Treatment[];
}

// 施術情報
export interface Treatment {
  id: number;
  customer_id: number;
  treatment_date: string;
  treatment_time?: string;
  stylist_name: string;
  treatment_content1?: string;
  treatment_content2?: string;
  treatment_content3?: string;
  treatment_content4?: string;
  treatment_content5?: string;
  treatment_content6?: string;
  treatment_content7?: string;
  treatment_content8?: string;
  style_memo?: string;
  used_chemicals?: string;
  solution1_time?: string;
  solution2_time?: string;
  color_time1?: string;
  color_time2?: string;
  other_details?: string;
  retail_product1?: string;
  retail_product2?: string;
  retail_product3?: string;
  retail_product1_price?: number;
  retail_product2_price?: number;
  retail_product3_price?: number;
  retail_product1_quantity?: number;
  retail_product2_quantity?: number;
  retail_product3_quantity?: number;
  notes?: string;
  conversation_content?: string;
  treatment_fee?: number;
  treatment_discount_amount?: number;
  treatment_discount_type?: string;
  retail_fee?: number;
  retail_discount_amount?: number;
  retail_discount_type?: string;
  total_amount?: number;
  payment_method?: string;
  next_appointment_date?: string;
  next_appointment_time?: string;
  created_at: string;
  updated_at: string;
  treatment_images?: TreatmentImage[];
}

export interface TreatmentInsert {
  customer_id: number;
  treatment_date: string;
  treatment_time?: string;
  stylist_name: string;
  treatment_content1?: string;
  treatment_content2?: string;
  treatment_content3?: string;
  treatment_content4?: string;
  treatment_content5?: string;
  treatment_content6?: string;
  treatment_content7?: string;
  treatment_content8?: string;
  style_memo?: string;
  used_chemicals?: string;
  solution1_time?: string;
  solution2_time?: string;
  color_time1?: string;
  color_time2?: string;
  other_details?: string;
  retail_product1?: string;
  retail_product2?: string;
  retail_product3?: string;
  retail_product1_price?: number;
  retail_product2_price?: number;
  retail_product3_price?: number;
  retail_product1_quantity?: number;
  retail_product2_quantity?: number;
  retail_product3_quantity?: number;
  notes?: string;
  conversation_content?: string;
  treatment_fee?: number;
  treatment_discount_amount?: number;
  treatment_discount_type?: string;
  retail_fee?: number;
  retail_discount_amount?: number;
  retail_discount_type?: string;
  total_amount?: number;
  payment_method?: string;
  next_appointment_date?: string;
  next_appointment_time?: string;
}

export interface TreatmentUpdate extends Partial<TreatmentInsert> {
  id: number;
}

// 施術画像
export interface TreatmentImage {
  id: number;
  treatment_id: number;
  image_url: string;
  original_filename?: string;
  image_order: number;
  created_at: string;
}

// 新しいAPIレスポンス形式の画像型
export interface TreatmentImageResponse {
  id: number;
  filename: string;
  url: string;
  original_filename: string;
}

export interface TreatmentImageInsert {
  treatment_id: number;
  image_url: string;
  original_filename?: string;
  image_order?: number;
}

export interface TreatmentWithImages extends Treatment {
  images: TreatmentImage[];
}

// スタッフ
export interface Staff {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

// 施術メニュー
export interface TreatmentMenu {
  id: number;
  name: string;
  category?: string;
  price?: number;
  is_active: boolean;
  created_at: string;
}

// 来店きっかけ
export interface ReferralSource {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface DiscountType {
  id: number;
  name: string;
  discount_type: "percentage" | "fixed"; // 'percentage' = 割合, 'fixed' = 固定金額
  discount_value: number; // 割引率(%) または 割引金額(円)
  is_active: boolean;
  created_at: string;
}

export interface RetailProduct {
  id: number;
  name: string;
  category?: string;
  price?: number;
  is_active: boolean;
  created_at: string;
}

// 定数
export const GENDER_OPTIONS = [
  { value: "男性", label: "男性" },
  { value: "女性", label: "女性" },
  { value: "その他", label: "その他" },
];

export const BLOOD_TYPE_OPTIONS = [
  { value: "A型", label: "A型" },
  { value: "B型", label: "B型" },
  { value: "O型", label: "O型" },
  { value: "AB型", label: "AB型" },
  { value: "不明", label: "不明" },
];

export const REFERRAL_SOURCES = [
  { value: "顧客紹介", label: "顧客紹介" },
  { value: "Instagram", label: "Instagram" },
  { value: "web検索", label: "web検索" },
  { value: "Facebook", label: "Facebook" },
  { value: "Twitter", label: "Twitter" },
  { value: "チラシ", label: "チラシ" },
  { value: "看板", label: "看板" },
  { value: "その他", label: "その他" },
];

export const TREATMENT_MENUS = [
  { value: "カット", label: "カット" },
  { value: "カラー", label: "カラー" },
  { value: "パーマ", label: "パーマ" },
  { value: "トリートメント", label: "トリートメント" },
  { value: "ヘッドスパ", label: "ヘッドスパ" },
  { value: "シャンプー", label: "シャンプー" },
  { value: "ブロー", label: "ブロー" },
  { value: "セット", label: "セット" },
  { value: "その他", label: "その他" },
];

export const DISCOUNT_TYPES = [
  { value: "クーポン割引", label: "クーポン割引" },
  { value: "会員割引", label: "会員割引" },
  { value: "紹介割引", label: "紹介割引" },
  { value: "季節割引", label: "季節割引" },
  { value: "固定割引", label: "固定割引" },
  { value: "初回割引", label: "初回割引" },
  { value: "その他", label: "その他" },
];

export const PAYMENT_METHODS = [
  { value: "現金", label: "現金" },
  { value: "クレジットカード", label: "クレジットカード" },
  { value: "電子マネー", label: "電子マネー" },
  { value: "その他", label: "その他" },
];
