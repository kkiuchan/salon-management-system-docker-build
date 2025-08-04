"use client";

import CategoryMenuSelect from "@/components/masters/CategoryMenuSelect";
import MasterDataSelect from "@/components/masters/MasterDataSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TreatmentInsert, TreatmentWithImages } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Clipboard,
  DollarSign,
  Scissors,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TreatmentWizardFormProps {
  customerId: number;
  initialData?: Partial<TreatmentInsert> | TreatmentWithImages;
  onSubmit: (data: TreatmentInsert) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
  onImageSelect?: (files: File[]) => void;
  selectedImages?: File[];
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export default function TreatmentWizardForm({
  customerId,
  initialData = {},
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "保存",
  onImageSelect,
  selectedImages: externalSelectedImages,
}: TreatmentWizardFormProps) {
  // 本日の日付を取得（YYYY-MM-DD形式）
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 現在時刻から1時間単位の切り下げを取得
  const getCurrentHourTime = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = "00";
    return `${hour}:${minute}`;
  };

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState({
    treatment_date: initialData.treatment_date || getTodayDate(),
    treatment_time: initialData.treatment_time || getCurrentHourTime(),
    stylist_name: initialData.stylist_name || "",
    treatment_content1: initialData.treatment_content1 || "",
    treatment_content2: initialData.treatment_content2 || "",
    treatment_content3: initialData.treatment_content3 || "",
    treatment_content4: initialData.treatment_content4 || "",
    treatment_content5: initialData.treatment_content5 || "",
    treatment_content6: initialData.treatment_content6 || "",
    treatment_content7: initialData.treatment_content7 || "",
    treatment_content8: initialData.treatment_content8 || "",
    style_memo: initialData.style_memo || "",
    used_chemicals: initialData.used_chemicals || "",
    solution1_time: initialData.solution1_time || "",
    solution2_time: initialData.solution2_time || "",
    color_time1: initialData.color_time1 || "",
    color_time2: initialData.color_time2 || "",
    other_details: initialData.other_details || "",
    retail_product1: initialData.retail_product1 || "",
    retail_product2: initialData.retail_product2 || "",
    retail_product3: initialData.retail_product3 || "",
    retail_product1_price: String(
      (initialData as TreatmentWithImages).retail_product1_price || 0
    ),
    retail_product2_price: String(
      (initialData as TreatmentWithImages).retail_product2_price || 0
    ),
    retail_product3_price: String(
      (initialData as TreatmentWithImages).retail_product3_price || 0
    ),
    retail_product1_quantity: String(
      (initialData as TreatmentWithImages).retail_product1_quantity ||
        ((initialData as TreatmentWithImages).retail_product1 ? 1 : 0)
    ),
    retail_product2_quantity: String(
      (initialData as TreatmentWithImages).retail_product2_quantity ||
        ((initialData as TreatmentWithImages).retail_product2 ? 1 : 0)
    ),
    retail_product3_quantity: String(
      (initialData as TreatmentWithImages).retail_product3_quantity ||
        ((initialData as TreatmentWithImages).retail_product3 ? 1 : 0)
    ),
    notes: initialData.notes || "",
    conversation_content: initialData.conversation_content || "",
    treatment_fee: String(
      (initialData as TreatmentWithImages).treatment_fee || 0
    ),
    treatment_discount_amount: String(
      (initialData as TreatmentWithImages).treatment_discount_amount || 0
    ),
    treatment_discount_type: initialData.treatment_discount_type || "",
    retail_fee: String((initialData as TreatmentWithImages).retail_fee || 0),
    retail_discount_amount: String(
      (initialData as TreatmentWithImages).retail_discount_amount || 0
    ),
    retail_discount_type: initialData.retail_discount_type || "",
    total_amount: String(
      (initialData as TreatmentWithImages).total_amount || 0
    ),
    payment_method: initialData.payment_method || "",
    next_appointment_date: initialData.next_appointment_date || "",
    next_appointment_time: initialData.next_appointment_time || "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [menuPrices, setMenuPrices] = useState<{ [key: string]: number }>({});

  // 外部から渡された画像がある場合はそれを使用
  const displayImages = externalSelectedImages || selectedImages;

  // アクティブなスタイリストが1人しかいない場合に自動選択する
  useEffect(() => {
    const autoSelectSingleStylist = async () => {
      // 既にスタイリストが選択されている場合は何もしない
      if (formData.stylist_name) return;

      try {
        const response = await fetch("/api/masters/staff");
        if (response.ok) {
          const staffData = await response.json();
          const activeStaff = staffData.filter((staff: any) => staff.is_active);

          // アクティブなスタイリストが1人しかいない場合
          if (activeStaff.length === 1) {
            setFormData((prev) => ({
              ...prev,
              stylist_name: activeStaff[0].name,
            }));
          }
        }
      } catch (error) {
        console.error("スタイリスト自動選択エラー:", error);
      }
    };

    autoSelectSingleStylist();
  }, [formData.stylist_name]);

  // セッションストレージからコピーデータを読み込む
  useEffect(() => {
    const copiedData = sessionStorage.getItem("copiedTreatmentData");
    if (copiedData && Object.keys(initialData).length === 0) {
      try {
        const parsedData = JSON.parse(copiedData) as Record<string, unknown>;
        console.log("ウィザード: コピーデータ確認:", parsedData);
        console.log("ウィザード: スタイリスト名:", parsedData.stylist_name);

        setFormData((prevFormData) => {
          const newFormData = {
            ...prevFormData,
            treatment_date:
              (parsedData.treatment_date as string) || getTodayDate(),
            treatment_time:
              (parsedData.treatment_time as string) || getCurrentHourTime(),
            stylist_name: (() => {
              const stylistName = parsedData.stylist_name as string;
              if (!stylistName) return "";

              // name-id形式の場合は、name部分のみを使用
              if (stylistName.includes("-")) {
                const namePart = stylistName.split("-").slice(0, -1).join("-");
                console.log(
                  "ウィザード: スタイリスト名変換:",
                  stylistName,
                  "→",
                  namePart
                );
                return namePart;
              }

              return stylistName;
            })(),
            treatment_content1: (parsedData.treatment_content1 as string) || "",
            treatment_content2: (parsedData.treatment_content2 as string) || "",
            treatment_content3: (parsedData.treatment_content3 as string) || "",
            treatment_content4: (parsedData.treatment_content4 as string) || "",
            treatment_content5: (parsedData.treatment_content5 as string) || "",
            treatment_content6: (parsedData.treatment_content6 as string) || "",
            treatment_content7: (parsedData.treatment_content7 as string) || "",
            treatment_content8: (parsedData.treatment_content8 as string) || "",
            style_memo: (parsedData.style_memo as string) || "",
            used_chemicals: (parsedData.used_chemicals as string) || "",
            solution1_time: (parsedData.solution1_time as string) || "",
            solution2_time: (parsedData.solution2_time as string) || "",
            color_time1: (parsedData.color_time1 as string) || "",
            color_time2: (parsedData.color_time2 as string) || "",
            other_details: (parsedData.other_details as string) || "",
            retail_product1: (parsedData.retail_product1 as string) || "",
            retail_product2: (parsedData.retail_product2 as string) || "",
            retail_product3: (parsedData.retail_product3 as string) || "",
            retail_product1_price: String(
              parsedData.retail_product1_price || 0
            ),
            retail_product2_price: String(
              parsedData.retail_product2_price || 0
            ),
            retail_product3_price: String(
              parsedData.retail_product3_price || 0
            ),
            retail_product1_quantity: String(
              parsedData.retail_product1_quantity || 1
            ),
            retail_product2_quantity: String(
              parsedData.retail_product2_quantity || 1
            ),
            retail_product3_quantity: String(
              parsedData.retail_product3_quantity || 1
            ),
            notes: (parsedData.notes as string) || "",
            conversation_content:
              (parsedData.conversation_content as string) || "",
            treatment_fee: String(parsedData.treatment_fee || 0),
            treatment_discount_amount: String(
              parsedData.treatment_discount_amount || 0
            ),
            treatment_discount_type:
              (parsedData.treatment_discount_type as string) || "",
            retail_fee: String(parsedData.retail_fee || 0),
            retail_discount_amount: String(
              parsedData.retail_discount_amount || 0
            ),
            retail_discount_type:
              (parsedData.retail_discount_type as string) || "",
            total_amount: String(parsedData.total_amount || 0),
            payment_method: (parsedData.payment_method as string) || "",
            next_appointment_date:
              (parsedData.next_appointment_date as string) || "",
            next_appointment_time:
              (parsedData.next_appointment_time as string) || "",
          };

          console.log("ウィザード: 新しいフォームデータ:", newFormData);

          // コピーデータでスタイリストが空の場合、アクティブなスタイリストが1人しかいなければ自動選択
          if (!newFormData.stylist_name) {
            setTimeout(async () => {
              try {
                const response = await fetch("/api/masters/staff");
                if (response.ok) {
                  const staffData = await response.json();
                  const activeStaff = staffData.filter(
                    (staff: any) => staff.is_active
                  );

                  if (activeStaff.length === 1) {
                    setFormData((prev) => ({
                      ...prev,
                      stylist_name: activeStaff[0].name,
                    }));
                  }
                }
              } catch (error) {
                console.error(
                  "ウィザード: コピーデータ: スタイリスト自動選択エラー:",
                  error
                );
              }
            }, 100);
          }

          return newFormData;
        });

        // コピーデータをクリア
        sessionStorage.removeItem("copiedTreatmentData");
      } catch (error) {
        console.error("ウィザード: コピーデータの解析エラー:", error);
      }
    }
  }, [initialData]);

  // 商品価格の合計計算（数量考慮）
  const calculateRetailTotal = () => {
    const product1Price = parseFloat(formData.retail_product1_price) || 0;
    const product1Quantity = parseFloat(formData.retail_product1_quantity) || 1;
    const product2Price = parseFloat(formData.retail_product2_price) || 0;
    const product2Quantity = parseFloat(formData.retail_product2_quantity) || 1;
    const product3Price = parseFloat(formData.retail_product3_price) || 0;
    const product3Quantity = parseFloat(formData.retail_product3_quantity) || 1;

    return (
      product1Price * product1Quantity +
      product2Price * product2Quantity +
      product3Price * product3Quantity
    );
  };

  const calculateTotal = () => {
    const treatmentFee = parseFloat(formData.treatment_fee) || 0;
    const treatmentDiscount =
      parseFloat(formData.treatment_discount_amount) || 0;
    const retailTotal = calculateRetailTotal();
    const retailDiscount = parseFloat(formData.retail_discount_amount) || 0;

    const total =
      treatmentFee - treatmentDiscount + retailTotal - retailDiscount;
    return total;
  };

  // 割引種別の値を取得する関数
  const fetchDiscountTypeValue = async (
    discountTypeValue: string
  ): Promise<number | null> => {
    if (!discountTypeValue) return null;

    try {
      const response = await fetch("/api/masters/discount-types");
      if (response.ok) {
        const discountTypes = await response.json();
        const discountTypeName = discountTypeValue.includes("-")
          ? discountTypeValue.split("-")[0]
          : discountTypeValue;
        const discountType = discountTypes.find(
          (d: { name: string; is_active: boolean; discount_value?: number }) =>
            d.name === discountTypeName && d.is_active
        );
        return discountType?.discount_value || null;
      }
    } catch (error) {
      console.error("割引種別値取得エラー:", error);
    }
    return null;
  };

  // 割引金額の自動計算
  const calculateDiscountAmount = async (
    baseAmount: number,
    discountType: string
  ): Promise<number> => {
    if (!discountType) return 0;

    try {
      const discountValue = await fetchDiscountTypeValue(discountType);
      if (discountValue === null) return 0;

      // マスタデータから割引種別の詳細情報を取得
      const response = await fetch("/api/masters/discount-types");
      if (response.ok) {
        const discountTypes = await response.json();
        const discountTypeName = discountType.includes("-")
          ? discountType.split("-")[0]
          : discountType;
        const discountTypeData = discountTypes.find(
          (d: {
            name: string;
            is_active: boolean;
            discount_type?: string;
            discount_value?: number;
          }) => d.name === discountTypeName && d.is_active
        );

        if (discountTypeData?.discount_type === "percentage") {
          // パーセンテージ割引の場合
          return Math.floor(baseAmount * (discountValue / 100));
        } else if (discountTypeData?.discount_type === "fixed") {
          // 固定金額割引の場合
          return discountValue;
        }
      }
    } catch (error) {
      console.error("割引計算エラー:", error);
    }
    return 0;
  };

  // 施術割引の自動計算
  useEffect(() => {
    const calculateTreatmentDiscount = async () => {
      const treatmentFee = parseFloat(formData.treatment_fee) || 0;
      const discountAmount = await calculateDiscountAmount(
        treatmentFee,
        formData.treatment_discount_type
      );

      setFormData((prev) => ({
        ...prev,
        treatment_discount_amount: String(discountAmount),
      }));
    };

    calculateTreatmentDiscount();
  }, [formData.treatment_fee, formData.treatment_discount_type]);

  // 店販割引の自動計算
  useEffect(() => {
    const calculateRetailDiscount = async () => {
      const retailTotal = calculateRetailTotal();
      const discountAmount = await calculateDiscountAmount(
        retailTotal,
        formData.retail_discount_type
      );

      setFormData((prev) => ({
        ...prev,
        retail_discount_amount: String(discountAmount),
      }));
    };

    calculateRetailDiscount();
  }, [
    formData.retail_product1_price,
    formData.retail_product1_quantity,
    formData.retail_product2_price,
    formData.retail_product2_quantity,
    formData.retail_product3_price,
    formData.retail_product3_quantity,
    formData.retail_discount_type,
  ]);

  // 総額の自動計算
  useEffect(() => {
    const total = calculateTotal();
    setFormData((prev) => ({
      ...prev,
      total_amount: String(total),
    }));
  }, [
    formData.treatment_fee,
    formData.treatment_discount_amount,
    formData.retail_product1_price,
    formData.retail_product1_quantity,
    formData.retail_product2_price,
    formData.retail_product2_quantity,
    formData.retail_product3_price,
    formData.retail_product3_quantity,
    formData.retail_discount_amount,
  ]);

  // 画像圧縮関数
  const compressImage = (
    file: File,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedFiles = await Promise.all(
        files.map((file) => compressImage(file))
      );

      if (onImageSelect) {
        onImageSelect(compressedFiles);
      } else {
        setSelectedImages(compressedFiles);
      }
    } catch (error) {
      console.error("画像の圧縮に失敗しました:", error);
      if (onImageSelect) {
        onImageSelect(files);
      } else {
        setSelectedImages(files);
      }
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 施術メニューの料金を取得する関数
  const fetchTreatmentMenuPrice = async (
    menuValue: string
  ): Promise<number | null> => {
    if (!menuValue) return null;

    try {
      const response = await fetch("/api/masters/treatment-menus");
      if (response.ok) {
        const menus = await response.json();
        const menuName = menuValue.includes("-")
          ? menuValue.split("-")[0]
          : menuValue;
        const menu = menus.find(
          (m: { name: string; is_active: boolean; price?: number }) =>
            m.name === menuName && m.is_active
        );
        return menu?.price || null;
      }
    } catch (error) {
      console.error("施術メニュー料金取得エラー:", error);
    }
    return null;
  };

  // 商品の料金を取得する関数
  const fetchRetailProductPrice = async (
    productValue: string
  ): Promise<number | null> => {
    if (!productValue) return null;

    try {
      const response = await fetch("/api/masters/retail-products");
      if (response.ok) {
        const products = await response.json();
        const productName = productValue.includes("-")
          ? productValue.split("-")[0]
          : productValue;
        const product = products.find(
          (p: { name: string; is_active: boolean; price?: number }) =>
            p.name === productName && p.is_active
        );
        return product?.price || null;
      }
    } catch (error) {
      console.error("商品料金取得エラー:", error);
    }
    return null;
  };

  // 施術料金の自動計算
  useEffect(() => {
    const calculateTreatmentFee = async () => {
      let totalFee = 0;
      const promises = [];

      for (let i = 1; i <= 8; i++) {
        const treatmentContent = formData[
          `treatment_content${i}` as keyof typeof formData
        ] as string;
        if (treatmentContent) {
          promises.push(fetchTreatmentMenuPrice(treatmentContent));
        }
      }

      const prices = await Promise.all(promises);
      totalFee = prices.reduce(
        (sum: number, price: number | null) => sum + (price ?? 0),
        0
      );

      setFormData((prev) => ({
        ...prev,
        treatment_fee: String(totalFee),
      }));

      // メニューの料金も更新
      updateMenuPrices();
    };

    calculateTreatmentFee();
  }, [
    formData.treatment_content1,
    formData.treatment_content2,
    formData.treatment_content3,
    formData.treatment_content4,
    formData.treatment_content5,
    formData.treatment_content6,
    formData.treatment_content7,
    formData.treatment_content8,
  ]);

  // 各メニューの料金を取得する関数
  const getTreatmentMenuPrices = async () => {
    const prices: { [key: string]: number } = {};

    for (let i = 1; i <= 8; i++) {
      const treatmentContent = formData[
        `treatment_content${i}` as keyof typeof formData
      ] as string;
      if (treatmentContent) {
        const price = await fetchTreatmentMenuPrice(treatmentContent);
        prices[`treatment_content${i}`] = price ?? 0;
      }
    }

    return prices;
  };

  // メニューの料金を更新する関数
  const updateMenuPrices = async () => {
    const prices = await getTreatmentMenuPrices();
    setMenuPrices(prices);
  };

  // 店販料金の自動計算
  useEffect(() => {
    const calculateRetailFee = async () => {
      const promises = [];
      const priceUpdates: { [key: string]: string } = {};

      for (let i = 1; i <= 3; i++) {
        const product = formData[
          `retail_product${i}` as keyof typeof formData
        ] as string;
        if (product) {
          const price = await fetchRetailProductPrice(product);
          if (price !== null) {
            priceUpdates[`retail_product${i}_price`] = String(price);
            promises.push(price);
          } else {
            promises.push(0);
          }
        } else {
          // 商品が選択されていない場合は価格を0にリセット
          priceUpdates[`retail_product${i}_price`] = "0";
          promises.push(0);
        }
      }

      const totalFee = promises.reduce((sum, price) => sum + (price ?? 0), 0);

      setFormData((prev) => ({
        ...prev,
        ...priceUpdates,
        retail_fee: String(totalFee),
      }));
    };

    calculateRetailFee();
  }, [
    formData.retail_product1,
    formData.retail_product2,
    formData.retail_product3,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // フォーム送信は最後のステップのボタンクリック時のみ実行
    if (currentStep === 5) {
      const submitData: TreatmentInsert = {
        customer_id: customerId,
        treatment_date: formData.treatment_date,
        treatment_time: formData.treatment_time,
        stylist_name: formData.stylist_name,
        treatment_content1: formData.treatment_content1,
        treatment_content2: formData.treatment_content2,
        treatment_content3: formData.treatment_content3,
        treatment_content4: formData.treatment_content4,
        treatment_content5: formData.treatment_content5,
        treatment_content6: formData.treatment_content6,
        treatment_content7: formData.treatment_content7,
        treatment_content8: formData.treatment_content8,
        style_memo: formData.style_memo,
        used_chemicals: formData.used_chemicals,
        solution1_time: formData.solution1_time,
        solution2_time: formData.solution2_time,
        color_time1: formData.color_time1,
        color_time2: formData.color_time2,
        other_details: formData.other_details,
        retail_product1: formData.retail_product1,
        retail_product2: formData.retail_product2,
        retail_product3: formData.retail_product3,
        retail_product1_price: formData.retail_product1_price
          ? parseFloat(formData.retail_product1_price)
          : undefined,
        retail_product2_price: formData.retail_product2_price
          ? parseFloat(formData.retail_product2_price)
          : undefined,
        retail_product3_price: formData.retail_product3_price
          ? parseFloat(formData.retail_product3_price)
          : undefined,
        retail_product1_quantity: formData.retail_product1_quantity
          ? parseInt(formData.retail_product1_quantity)
          : 1,
        retail_product2_quantity: formData.retail_product2_quantity
          ? parseInt(formData.retail_product2_quantity)
          : 1,
        retail_product3_quantity: formData.retail_product3_quantity
          ? parseInt(formData.retail_product3_quantity)
          : 1,
        notes: formData.notes,
        conversation_content: formData.conversation_content,
        treatment_fee: formData.treatment_fee
          ? parseFloat(formData.treatment_fee)
          : undefined,
        treatment_discount_amount: formData.treatment_discount_amount
          ? parseFloat(formData.treatment_discount_amount)
          : undefined,
        treatment_discount_type: formData.treatment_discount_type,
        retail_fee: formData.retail_fee
          ? parseFloat(formData.retail_fee)
          : undefined,
        retail_discount_amount: formData.retail_discount_amount
          ? parseFloat(formData.retail_discount_amount)
          : undefined,
        retail_discount_type: formData.retail_discount_type,
        total_amount: calculateTotal(),
        payment_method: formData.payment_method,
        next_appointment_date: formData.next_appointment_date,
        next_appointment_time: formData.next_appointment_time,
      };

      onSubmit(submitData);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: "施術内容", icon: Scissors },
      { number: 2, title: "施術詳細", icon: Clipboard },
      { number: 3, title: "店販商品", icon: ShoppingBag },
      { number: 4, title: "料金入力", icon: DollarSign },
      { number: 5, title: "次回予約", icon: Calendar },
    ];

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  type="button"
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors mx-1 ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                  onClick={() => setCurrentStep(step.number as WizardStep)}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                基本情報
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="treatment_date" className="text-blue-700">
                    施術日 *
                  </Label>
                  <Input
                    id="treatment_date"
                    type="date"
                    value={formData.treatment_date}
                    onChange={(e) =>
                      updateField("treatment_date", e.target.value)
                    }
                    required
                    className="mt-1 w-full max-w-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="treatment_time" className="text-blue-700">
                    施術時間
                  </Label>
                  <Input
                    id="treatment_time"
                    type="time"
                    value={formData.treatment_time}
                    onChange={(e) =>
                      updateField("treatment_time", e.target.value)
                    }
                    className="mt-1 w-full max-w-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="stylist_name" className="text-blue-700">
                    担当者 *
                  </Label>
                  <MasterDataSelect
                    type="staff"
                    value={formData.stylist_name}
                    onValueChange={(value) =>
                      updateField("stylist_name", value)
                    }
                    placeholder="スタイリストを選択"
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                施術内容
              </h3>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="treatment_content1"
                    className="text-green-700"
                  >
                    メイン施術
                  </Label>
                  <CategoryMenuSelect
                    value={formData.treatment_content1}
                    onChange={(value) =>
                      updateField("treatment_content1", value)
                    }
                    placeholder="施術メニューを選択"
                  />
                </div>
                {[2, 3, 4].map((num) => (
                  <div key={num}>
                    <Label
                      htmlFor={`treatment_content${num}`}
                      className="text-green-700"
                    >
                      追加施術{num - 1}
                    </Label>
                    <CategoryMenuSelect
                      value={
                        formData[
                          `treatment_content${num}` as keyof typeof formData
                        ] as string
                      }
                      onChange={(value) =>
                        updateField(`treatment_content${num}`, value)
                      }
                      placeholder="選択"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                施術詳細
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="style_memo" className="text-teal-700">
                    スタイルメモ
                  </Label>
                  <Textarea
                    id="style_memo"
                    value={formData.style_memo}
                    onChange={(e) => updateField("style_memo", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="used_chemicals" className="text-teal-700">
                    使用薬剤
                  </Label>
                  <Textarea
                    id="used_chemicals"
                    value={formData.used_chemicals}
                    onChange={(e) =>
                      updateField("used_chemicals", e.target.value)
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="solution1_time" className="text-teal-700">
                      1液タイム
                    </Label>
                    <Input
                      id="solution1_time"
                      value={formData.solution1_time}
                      onChange={(e) =>
                        updateField("solution1_time", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="solution2_time" className="text-teal-700">
                      2液タイム
                    </Label>
                    <Input
                      id="solution2_time"
                      value={formData.solution2_time}
                      onChange={(e) =>
                        updateField("solution2_time", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="color_time1" className="text-teal-700">
                      カラータイム1
                    </Label>
                    <Input
                      id="color_time1"
                      value={formData.color_time1}
                      onChange={(e) =>
                        updateField("color_time1", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color_time2" className="text-teal-700">
                      カラータイム2
                    </Label>
                    <Input
                      id="color_time2"
                      value={formData.color_time2}
                      onChange={(e) =>
                        updateField("color_time2", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="other_details" className="text-teal-700">
                    その他
                  </Label>
                  <Input
                    id="other_details"
                    value={formData.other_details}
                    onChange={(e) =>
                      updateField("other_details", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                施術画像
              </h3>
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {displayImages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      選択された画像 ({displayImages.length}枚):
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {displayImages.map((file, index) => (
                        <div
                          key={index}
                          className="relative bg-gray-100 rounded-lg overflow-hidden"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`画像 ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            onClick={() => {
                              const newImages = displayImages.filter(
                                (_, i) => i !== index
                              );
                              if (onImageSelect) {
                                onImageSelect(newImages);
                              } else {
                                setSelectedImages(newImages);
                              }
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              店販商品
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="bg-white p-4 rounded-lg">
                  <Label
                    htmlFor={`retail_product${num}`}
                    className="text-indigo-700 font-medium"
                  >
                    店頭販売商品{num}
                  </Label>
                  <div className="space-y-3 mt-2">
                    <CategoryMenuSelect
                      type="retail-product"
                      value={
                        formData[
                          `retail_product${num}` as keyof typeof formData
                        ] as string
                      }
                      onChange={(value) => {
                        updateField(`retail_product${num}`, value);
                        if (value) {
                          updateField(`retail_product${num}_quantity`, "1");
                        } else {
                          updateField(`retail_product${num}_quantity`, "0");
                        }
                      }}
                      placeholder="商品を選択"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-indigo-700 text-sm whitespace-nowrap">
                        数量:
                      </Label>
                      <Input
                        type="number"
                        min={
                          formData[
                            `retail_product${num}` as keyof typeof formData
                          ]
                            ? "1"
                            : "0"
                        }
                        value={
                          formData[
                            `retail_product${num}_quantity` as keyof typeof formData
                          ] as string
                        }
                        onChange={(e) =>
                          updateField(
                            `retail_product${num}_quantity`,
                            e.target.value
                          )
                        }
                        className="w-20"
                        placeholder="数量"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              料金入力
            </h3>
            <div className="space-y-4">
              {/* 割引設定 */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="text-md font-medium text-orange-800 mb-3">
                  割引設定
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="treatment_discount_type"
                      className="text-orange-700"
                    >
                      施術割引種別
                    </Label>
                    <MasterDataSelect
                      type="discount-type"
                      value={formData.treatment_discount_type}
                      onValueChange={(value) =>
                        updateField("treatment_discount_type", value)
                      }
                      placeholder="割引種別を選択"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="retail_discount_type"
                      className="text-orange-700"
                    >
                      店販割引種別
                    </Label>
                    <MasterDataSelect
                      type="discount-type"
                      value={formData.retail_discount_type}
                      onValueChange={(value) =>
                        updateField("retail_discount_type", value)
                      }
                      placeholder="割引種別を選択"
                    />
                  </div>
                </div>
              </div>

              {/* 施術料金詳細 */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="text-md font-medium text-orange-800 mb-3">
                  施術料金
                </h4>
                <div className="space-y-2 mb-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                    const treatmentContent = formData[
                      `treatment_content${num}` as keyof typeof formData
                    ] as string;
                    if (!treatmentContent) return null;

                    const menuName = treatmentContent.includes("-")
                      ? treatmentContent.split("-")[0]
                      : treatmentContent;

                    return (
                      <div
                        key={num}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <span className="text-sm text-gray-600">
                            メニュー{num}:
                          </span>
                          <span className="ml-2 text-sm font-medium">
                            {menuName}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-orange-600">
                          ¥
                          {menuPrices[
                            `treatment_content${num}`
                          ]?.toLocaleString() || "0"}
                        </span>
                      </div>
                    );
                  })}
                  {![1, 2, 3, 4, 5, 6, 7, 8].some(
                    (num) =>
                      formData[
                        `treatment_content${num}` as keyof typeof formData
                      ]
                  ) && (
                    <div className="text-sm text-gray-500 italic">
                      選択されたメニューがありません
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-700">
                      施術料金小計:
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      ¥
                      {parseFloat(
                        formData.treatment_fee || "0"
                      ).toLocaleString()}
                    </span>
                  </div>
                  {parseFloat(formData.treatment_discount_amount || "0") >
                    0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span className="text-sm font-medium">施術割引:</span>
                      <span className="text-sm font-semibold">
                        -¥
                        {parseFloat(
                          formData.treatment_discount_amount || "0"
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="text-sm font-medium text-orange-700">
                      施術料金合計:
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      ¥
                      {(
                        parseFloat(formData.treatment_fee || "0") -
                        parseFloat(formData.treatment_discount_amount || "0")
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 店販料金詳細 */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="text-md font-medium text-orange-800 mb-3">
                  店販料金
                </h4>
                <div className="space-y-2 mb-3">
                  {[1, 2, 3].map((num) => {
                    const product = formData[
                      `retail_product${num}` as keyof typeof formData
                    ] as string;
                    const quantity =
                      parseInt(
                        formData[
                          `retail_product${num}_quantity` as keyof typeof formData
                        ] as string
                      ) || 0;
                    const price =
                      parseFloat(
                        formData[
                          `retail_product${num}_price` as keyof typeof formData
                        ] as string
                      ) || 0;

                    if (!product || quantity === 0) return null;

                    const productName = product.includes("-")
                      ? product.split("-")[0]
                      : product;
                    const subtotal = price * quantity;

                    return (
                      <div
                        key={num}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              商品{num}:
                            </span>
                            <span className="text-sm font-medium">
                              {productName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              ¥{price.toLocaleString()} × {quantity}個
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-orange-600">
                          ¥{subtotal.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                  {![1, 2, 3].some((num) => {
                    const product =
                      formData[`retail_product${num}` as keyof typeof formData];
                    const quantity =
                      parseInt(
                        formData[
                          `retail_product${num}_quantity` as keyof typeof formData
                        ] as string
                      ) || 0;
                    return product && quantity > 0;
                  }) && (
                    <div className="text-sm text-gray-500 italic">
                      選択された商品がありません
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-700">
                      店販料金小計:
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      ¥{calculateRetailTotal().toLocaleString()}
                    </span>
                  </div>
                  {parseFloat(formData.retail_discount_amount || "0") > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span className="text-sm font-medium">店販割引:</span>
                      <span className="text-sm font-semibold">
                        -¥
                        {parseFloat(
                          formData.retail_discount_amount || "0"
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="text-sm font-medium text-orange-700">
                      店販料金合計:
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      ¥
                      {(
                        calculateRetailTotal() -
                        parseFloat(formData.retail_discount_amount || "0")
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 合計・支払い */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="text-md font-medium text-orange-800 mb-3">
                  お会計
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-t-2 border-orange-200 pt-3">
                    <span className="text-lg font-semibold text-orange-700">
                      お会計合計:
                    </span>
                    <span className="text-xl font-bold text-orange-600">
                      ¥{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="payment_method" className="text-orange-700">
                      支払い方法
                    </Label>
                    <MasterDataSelect
                      type="payment-method"
                      value={formData.payment_method}
                      onValueChange={(value) =>
                        updateField("payment_method", value)
                      }
                      placeholder="支払い方法を選択"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                次回予約
              </h3>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="next_appointment_date"
                    className="text-pink-700"
                  >
                    次回予約日
                  </Label>
                  <Input
                    id="next_appointment_date"
                    type="date"
                    value={formData.next_appointment_date}
                    onChange={(e) =>
                      updateField("next_appointment_date", e.target.value)
                    }
                    className="mt-1 w-full max-w-xs"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="next_appointment_time"
                    className="text-pink-700"
                  >
                    次回予約時間
                  </Label>
                  <Input
                    id="next_appointment_time"
                    type="time"
                    value={formData.next_appointment_time}
                    onChange={(e) =>
                      updateField("next_appointment_time", e.target.value)
                    }
                    className="mt-1 w-full max-w-xs"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                備考・会話内容
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-gray-700">
                    備考
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="conversation_content"
                    className="text-gray-700"
                  >
                    会話内容
                  </Label>
                  <Textarea
                    id="conversation_content"
                    value={formData.conversation_content}
                    onChange={(e) =>
                      updateField("conversation_content", e.target.value)
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gray-50 h-screen flex flex-col overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* ヘッダー部分（固定） */}
        <div className="flex-shrink-0 p-4">{renderStepIndicator()}</div>

        {/* コンテンツ部分（スクロール可能） */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            {renderStepContent()}
          </div>
        </div>

        {/* ボタン部分（固定） */}
        <div className="flex-shrink-0 p-4 space-y-3">
          <div className="flex justify-between space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              前へ
            </Button>

            {currentStep < 5 ? (
              <Button type="button" onClick={nextStep} className="flex-1">
                次へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as React.FormEvent);
                }}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "保存中..." : submitLabel}
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
