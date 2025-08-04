"use client";

import CategoryMenuSelect from "@/components/masters/CategoryMenuSelect";
import MasterDataSelect from "@/components/masters/MasterDataSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TreatmentInsert, TreatmentWithImages } from "@/types";
import {
  Calendar,
  Clipboard,
  DollarSign,
  Scissors,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TreatmentFormProps {
  customerId: number;
  initialData?: Partial<TreatmentInsert> | TreatmentWithImages;
  onSubmit: (data: TreatmentInsert) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
  onImageSelect?: (files: File[]) => void;
  selectedImages?: File[];
}

export default function TreatmentForm({
  customerId,
  initialData = {},
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "保存",
  onImageSelect,
  selectedImages: externalSelectedImages,
}: TreatmentFormProps) {
  // initialDataから数値フィールドを除外
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
  const [productPrices, setProductPrices] = useState<{ [key: string]: number }>(
    {}
  );

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
        console.log("コピーデータ確認:", parsedData);
        console.log("商品個数確認:");
        console.log(
          "- retail_product1_quantity:",
          parsedData.retail_product1_quantity
        );
        console.log(
          "- retail_product2_quantity:",
          parsedData.retail_product2_quantity
        );
        console.log(
          "- retail_product3_quantity:",
          parsedData.retail_product3_quantity
        );
        console.log("追加施術確認:");
        console.log("- treatment_content2:", parsedData.treatment_content2);
        console.log("- treatment_content3:", parsedData.treatment_content3);
        console.log("- treatment_content4:", parsedData.treatment_content4);
        console.log("- treatment_content5:", parsedData.treatment_content5);
        console.log("- treatment_content6:", parsedData.treatment_content6);
        console.log("- treatment_content7:", parsedData.treatment_content7);
        console.log("- treatment_content8:", parsedData.treatment_content8);

        setFormData((prevFormData) => {
          const newFormData = {
            ...prevFormData,
            stylist_name: String(parsedData.stylist_name || ""),
            treatment_content1: String(parsedData.treatment_content1 || ""),
            treatment_content2: String(parsedData.treatment_content2 || ""),
            treatment_content3: String(parsedData.treatment_content3 || ""),
            treatment_content4: String(parsedData.treatment_content4 || ""),
            treatment_content5: String(parsedData.treatment_content5 || ""),
            treatment_content6: String(parsedData.treatment_content6 || ""),
            treatment_content7: String(parsedData.treatment_content7 || ""),
            treatment_content8: String(parsedData.treatment_content8 || ""),
            style_memo: String(parsedData.style_memo || ""),
            used_chemicals: String(parsedData.used_chemicals || ""),
            solution1_time: String(parsedData.solution1_time || ""),
            solution2_time: String(parsedData.solution2_time || ""),
            color_time1: String(parsedData.color_time1 || ""),
            color_time2: String(parsedData.color_time2 || ""),
            other_details: String(parsedData.other_details || ""),
            retail_product1: String(parsedData.retail_product1 || ""),
            retail_product1_quantity: String(
              parsedData.retail_product1_quantity || ""
            ),
            retail_product2: String(parsedData.retail_product2 || ""),
            retail_product2_quantity: String(
              parsedData.retail_product2_quantity || ""
            ),
            retail_product3: String(parsedData.retail_product3 || ""),
            retail_product3_quantity: String(
              parsedData.retail_product3_quantity || ""
            ),
            notes: String(parsedData.notes || ""),
            conversation_content: String(parsedData.conversation_content || ""),
          };

          // コピーされたデータの料金を取得
          setTimeout(async () => {
            let totalTreatmentFee = 0;

            // メイン施術料金を取得
            if (newFormData.treatment_content1) {
              const price = await fetchTreatmentMenuPrice(
                newFormData.treatment_content1
              );
              if (price !== null && price !== undefined) {
                totalTreatmentFee += price;
              }
            }

            // 追加施術料金を取得（treatment_content2〜8）
            for (let i = 2; i <= 8; i++) {
              const treatmentContent = newFormData[
                `treatment_content${i}` as keyof typeof newFormData
              ] as string;
              if (treatmentContent) {
                const price = await fetchTreatmentMenuPrice(treatmentContent);
                if (price !== null && price !== undefined) {
                  totalTreatmentFee += price;
                }
              }
            }

            // 合計施術料金を設定
            console.log("合計施術料金:", totalTreatmentFee);
            if (totalTreatmentFee > 0) {
              setFormData((current) => ({
                ...current,
                treatment_fee: String(totalTreatmentFee),
              }));
            }

            // 商品料金を取得
            if (newFormData.retail_product1) {
              const price = await fetchRetailProductPrice(
                newFormData.retail_product1
              );
              if (price !== null && price !== undefined) {
                setFormData((current) => ({
                  ...current,
                  retail_product1_price: String(price),
                }));
              }
            }

            if (newFormData.retail_product2) {
              const price = await fetchRetailProductPrice(
                newFormData.retail_product2
              );
              if (price !== null && price !== undefined) {
                setFormData((current) => ({
                  ...current,
                  retail_product2_price: String(price),
                }));
              }
            }

            if (newFormData.retail_product3) {
              const price = await fetchRetailProductPrice(
                newFormData.retail_product3
              );
              if (price !== null && price !== undefined) {
                setFormData((current) => ({
                  ...current,
                  retail_product3_price: String(price),
                }));
              }
            }
          }, 100);

          return newFormData;
        });

        // コピーデータを使用したらセッションストレージから削除
        sessionStorage.removeItem("copiedTreatmentData");
      } catch (error) {
        console.error("コピーデータの読み込みに失敗しました:", error);
      }
    }
  }, [initialData]);

  // 商品価格の合計計算（数量考慮）
  const calculateRetailTotal = () => {
    const product1Price = parseFloat(formData.retail_product1_price) || 0;
    const product1Quantity = parseInt(formData.retail_product1_quantity) || 1;
    const product2Price = parseFloat(formData.retail_product2_price) || 0;
    const product2Quantity = parseInt(formData.retail_product2_quantity) || 1;
    const product3Price = parseFloat(formData.retail_product3_price) || 0;
    const product3Quantity = parseInt(formData.retail_product3_quantity) || 1;

    console.log("店頭料金計算:", {
      product1: {
        name: formData.retail_product1,
        price: product1Price,
        quantity: product1Quantity,
        subtotal: product1Price * product1Quantity,
      },
      product2: {
        name: formData.retail_product2,
        price: product2Price,
        quantity: product2Quantity,
        subtotal: product2Price * product2Quantity,
      },
      product3: {
        name: formData.retail_product3,
        price: product3Price,
        quantity: product3Quantity,
        subtotal: product3Price * product3Quantity,
      },
    });

    const total =
      product1Price * product1Quantity +
      product2Price * product2Quantity +
      product3Price * product3Quantity;

    console.log("店頭料金合計:", total);

    return total;
  };

  // 初期化時に既存の商品価格を取得
  useEffect(() => {
    const fetchExistingProductPrices = async () => {
      const promises = [];

      if (initialData.retail_product1) {
        promises.push(
          fetchRetailProductPrice(initialData.retail_product1).then((price) => {
            if (price) {
              setFormData((current) => ({
                ...current,
                retail_product1_price: String(price),
              }));
            }
          })
        );
      }

      if (initialData.retail_product2) {
        promises.push(
          fetchRetailProductPrice(initialData.retail_product2).then((price) => {
            if (price) {
              setFormData((current) => ({
                ...current,
                retail_product2_price: String(price),
              }));
            }
          })
        );
      }

      if (initialData.retail_product3) {
        promises.push(
          fetchRetailProductPrice(initialData.retail_product3).then((price) => {
            if (price) {
              setFormData((current) => ({
                ...current,
                retail_product3_price: String(price),
              }));
            }
          })
        );
      }

      // すべての価格取得が完了したら店販料金を再計算
      Promise.all(promises).then(() => {
        setTimeout(() => {
          setFormData((current) => {
            // 数量も含めて店販料金を計算
            const product1Price =
              parseFloat(current.retail_product1_price) || 0;
            const product1Quantity =
              parseFloat(current.retail_product1_quantity) || 1;
            const product2Price =
              parseFloat(current.retail_product2_price) || 0;
            const product2Quantity =
              parseFloat(current.retail_product2_quantity) || 1;
            const product3Price =
              parseFloat(current.retail_product3_price) || 0;
            const product3Quantity =
              parseFloat(current.retail_product3_quantity) || 1;

            const totalRetailFee =
              product1Price * product1Quantity +
              product2Price * product2Quantity +
              product3Price * product3Quantity;

            return { ...current, retail_fee: String(totalRetailFee) };
          });
        }, 100);
      });
    };

    fetchExistingProductPrices();
  }, [
    initialData.retail_product1,
    initialData.retail_product2,
    initialData.retail_product3,
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
        // アスペクト比を保持しながらリサイズ
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

        // 画像を描画
        ctx?.drawImage(img, 0, 0, width, height);

        // Blob に変換
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
      // 圧縮に失敗した場合は元のファイルを使用
      if (onImageSelect) {
        onImageSelect(files);
      } else {
        setSelectedImages(files);
      }
    }
  };

  // 割引計算ロジック
  const calculateDiscount = (
    amount: number,
    discountType: string,
    discountValue: number
  ) => {
    if (!discountType || !discountValue) return 0;

    if (discountType === "percentage") {
      return amount * (discountValue / 100);
    } else if (discountType === "fixed") {
      return discountValue;
    }
    return 0;
  };

  // 施術料金の再計算
  const recalculateTreatmentFee = () => {
    const treatmentFee = parseFloat(formData.treatment_fee) || 0;
    const discountType = formData.treatment_discount_type;
    const discountValue = parseFloat(formData.treatment_discount_amount) || 0;

    const discountAmount = calculateDiscount(
      treatmentFee,
      discountType,
      discountValue
    );
    return discountAmount;
  };

  // 店販料金の再計算
  const recalculateRetailFee = () => {
    const retailTotal = calculateRetailTotal();
    const discountType = formData.retail_discount_type;
    const discountValue = parseFloat(formData.retail_discount_amount) || 0;

    const discountAmount = calculateDiscount(
      retailTotal,
      discountType,
      discountValue
    );
    return discountAmount;
  };

  const calculateTotal = () => {
    const treatmentFee = parseFloat(formData.treatment_fee) || 0;
    const treatmentDiscount =
      parseFloat(formData.treatment_discount_amount) || 0;
    const retailTotal = calculateRetailTotal();
    const retailDiscount = parseFloat(formData.retail_discount_amount) || 0;

    const total =
      treatmentFee - treatmentDiscount + retailTotal - retailDiscount;

    // NaNや無限大の値を防ぐ
    if (isNaN(total) || !isFinite(total)) {
      return 0;
    }

    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    console.log("送信する施術データ:", submitData);
    console.log("total_amount:", submitData.total_amount);
    console.log("calculateTotal()の結果:", calculateTotal());

    onSubmit(submitData);
  };

  const updateField = (field: string, value: string) => {
    console.log("updateField called:", field, value);
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // 料金の自動計算
      if (
        field === "treatment_content1" ||
        field === "treatment_content2" ||
        field === "treatment_content3" ||
        field === "treatment_content4"
      ) {
        console.log("施術料金計算開始:", field, value);
        // 施術メニューの料金を取得して自動設定
        fetchTreatmentMenuPrice(value).then((price) => {
          if (price) {
            // 施術料金を全体再計算
            setFormData((current) => {
              // 現在選択されている各施術の料金を取得して合計
              const promises = [];

              if (current.treatment_content1) {
                promises.push(
                  fetchTreatmentMenuPrice(current.treatment_content1)
                );
              }
              if (current.treatment_content2) {
                promises.push(
                  fetchTreatmentMenuPrice(current.treatment_content2)
                );
              }
              if (current.treatment_content3) {
                promises.push(
                  fetchTreatmentMenuPrice(current.treatment_content3)
                );
              }
              if (current.treatment_content4) {
                promises.push(
                  fetchTreatmentMenuPrice(current.treatment_content4)
                );
              }

              // すべての料金を取得して合計
              Promise.all(promises).then((prices) => {
                const totalFee = prices.reduce(
                  (sum, price) => sum + (price ?? 0),
                  0
                );
                console.log("施術料金計算:", {
                  content1: current.treatment_content1,
                  content2: current.treatment_content2,
                  content3: current.treatment_content3,
                  prices,
                  totalFee,
                });
                setFormData((latest) => {
                  const newData = {
                    ...latest,
                    treatment_fee: String(totalFee),
                  };

                  // 施術割引額を再計算
                  if (
                    latest.treatment_discount_type &&
                    latest.treatment_discount_amount
                  ) {
                    fetchDiscountTypeValue(latest.treatment_discount_type).then(
                      (discountValue) => {
                        if (discountValue !== null) {
                          fetch("/api/masters/discount-types").then(
                            (response) => {
                              if (response.ok) {
                                response.json().then((discountTypes) => {
                                  const discountTypeName =
                                    latest.treatment_discount_type.includes("-")
                                      ? latest.treatment_discount_type.split(
                                          "-"
                                        )[0]
                                      : latest.treatment_discount_type;
                                  const discountType = discountTypes.find(
                                    (d: any) =>
                                      d.name === discountTypeName && d.is_active
                                  );

                                  let actualDiscount = 0;
                                  if (
                                    discountType?.discount_type === "percentage"
                                  ) {
                                    // パーセンテージの場合、新しい施術料金で再計算
                                    actualDiscount =
                                      totalFee * (discountValue / 100);
                                  } else if (
                                    discountType?.discount_type === "fixed"
                                  ) {
                                    // 固定金額の場合、そのまま使用
                                    actualDiscount = discountValue;
                                  }

                                  setFormData((final) => ({
                                    ...final,
                                    treatment_discount_amount:
                                      String(actualDiscount),
                                  }));
                                });
                              }
                            }
                          );
                        }
                      }
                    );
                  }

                  return newData;
                });
              });

              return current; // 一時的に現在の状態を返す
            });
          }
        });
      }

      // 店販商品選択・数量変更時の処理
      if (
        field === "retail_product1" ||
        field === "retail_product2" ||
        field === "retail_product3" ||
        field === "retail_product1_quantity" ||
        field === "retail_product2_quantity" ||
        field === "retail_product3_quantity"
      ) {
        console.log("店販商品処理開始:", field, value);

        // 商品が選択された場合、価格を取得してformDataを更新
        if (
          field.startsWith("retail_product") &&
          !field.endsWith("_quantity")
        ) {
          const productNum = field.replace("retail_product", "");
          const priceKey = `retail_product${productNum}_price`;

          fetchRetailProductPrice(value).then((price) => {
            console.log(`商品${productNum}の価格取得結果:`, price);

            setFormData((current) => {
              const updatedData = { ...current };
              updatedData[field] = value;

              if (price !== null) {
                updatedData[priceKey] = String(price);
                console.log(`価格フィールド更新: ${priceKey} = ${price}`);
              } else {
                updatedData[priceKey] = "0";
              }

              // 数量が設定されていない場合は1に設定
              const quantityKey = `retail_product${productNum}_quantity`;
              if (
                !updatedData[quantityKey] ||
                updatedData[quantityKey] === "0"
              ) {
                updatedData[quantityKey] = "1";
              }

              // 店販料金を再計算
              const product1Price =
                parseFloat(updatedData.retail_product1_price) || 0;
              const product1Quantity =
                parseInt(updatedData.retail_product1_quantity) || 1;
              const product2Price =
                parseFloat(updatedData.retail_product2_price) || 0;
              const product2Quantity =
                parseInt(updatedData.retail_product2_quantity) || 1;
              const product3Price =
                parseFloat(updatedData.retail_product3_price) || 0;
              const product3Quantity =
                parseInt(updatedData.retail_product3_quantity) || 1;

              const totalRetailFee =
                product1Price * product1Quantity +
                product2Price * product2Quantity +
                product3Price * product3Quantity;

              console.log("店販料金再計算:", {
                product1: {
                  price: product1Price,
                  quantity: product1Quantity,
                  subtotal: product1Price * product1Quantity,
                },
                product2: {
                  price: product2Price,
                  quantity: product2Quantity,
                  subtotal: product2Price * product2Quantity,
                },
                product3: {
                  price: product3Price,
                  quantity: product3Quantity,
                  subtotal: product3Price * product3Quantity,
                },
                total: totalRetailFee,
              });

              updatedData.retail_fee = String(totalRetailFee);

              return updatedData;
            });
          });
        } else if (field.endsWith("_quantity")) {
          // 数量が変更された場合
          setFormData((current) => {
            const updatedData = { ...current };
            updatedData[field] = value;

            // 店販料金を再計算
            const product1Price =
              parseFloat(updatedData.retail_product1_price) || 0;
            const product1Quantity =
              parseInt(updatedData.retail_product1_quantity) || 1;
            const product2Price =
              parseFloat(updatedData.retail_product2_price) || 0;
            const product2Quantity =
              parseInt(updatedData.retail_product2_quantity) || 1;
            const product3Price =
              parseFloat(updatedData.retail_product3_price) || 0;
            const product3Quantity =
              parseInt(updatedData.retail_product3_quantity) || 1;

            const totalRetailFee =
              product1Price * product1Quantity +
              product2Price * product2Quantity +
              product3Price * product3Quantity;

            console.log("数量変更時の店販料金再計算:", {
              product1: {
                price: product1Price,
                quantity: product1Quantity,
                subtotal: product1Price * product1Quantity,
              },
              product2: {
                price: product2Price,
                quantity: product2Quantity,
                subtotal: product2Price * product2Quantity,
              },
              product3: {
                price: product3Price,
                quantity: product3Quantity,
                subtotal: product3Price * product3Quantity,
              },
              total: totalRetailFee,
            });

            updatedData.retail_fee = String(totalRetailFee);

            return updatedData;
          });
        }
      }

      // 割引種別変更時の自動計算
      if (field === "treatment_discount_type") {
        // 割引種別が変更された場合、マスタデータから割引率を取得して自動設定
        fetchDiscountTypeValue(value).then((discountValue) => {
          if (discountValue !== null) {
            setTimeout(() => {
              setFormData((current) => {
                const treatmentFee = parseFloat(current.treatment_fee) || 0;

                // マスタデータから割引種別の詳細情報を取得
                fetch("/api/masters/discount-types").then((response) => {
                  if (response.ok) {
                    response.json().then((discountTypes) => {
                      const discountTypeName = value.includes("-")
                        ? value.split("-")[0]
                        : value;
                      const discountType = discountTypes.find(
                        (d: any) => d.name === discountTypeName && d.is_active
                      );

                      let actualDiscount = 0;
                      if (discountType?.discount_type === "percentage") {
                        // パーセンテージの場合、実際の割引金額を計算
                        actualDiscount = treatmentFee * (discountValue / 100);
                      } else if (discountType?.discount_type === "fixed") {
                        // 固定金額の場合、そのまま使用
                        actualDiscount = discountValue;
                      }

                      setFormData((latest) => ({
                        ...latest,
                        treatment_discount_amount: String(actualDiscount),
                      }));
                    });
                  }
                });

                return current; // 一時的に現在の状態を返す
              });
            }, 100);
          }
        });
      }

      if (field === "treatment_discount_amount") {
        // 割引金額が入力された場合、計算を実行
        setTimeout(() => {
          setFormData((current) => {
            const treatmentFee = parseFloat(current.treatment_fee) || 0;
            const discountType = current.treatment_discount_type;
            const discountValue = parseFloat(value) || 0;

            let actualDiscount = 0;
            if (discountType === "percentage") {
              // パーセンテージの場合、実際の割引金額を計算
              actualDiscount = treatmentFee * (discountValue / 100);
            } else if (discountType === "fixed") {
              // 固定金額の場合、入力値をそのまま使用
              actualDiscount = discountValue;
            }

            return {
              ...current,
              treatment_discount_amount: String(actualDiscount),
            };
          });
        }, 100);
      }

      if (field === "retail_discount_type") {
        console.log("店販割引種別変更:", field, value);
        if (!value) {
          // 割引種別がクリアされた場合、割引額もクリア
          console.log("店販割引種別クリア");
          setFormData((current) => ({
            ...current,
            retail_discount_amount: "0",
          }));
        } else {
          // 割引種別が変更された場合、マスタデータから割引率を取得して自動設定
          fetchDiscountTypeValue(value).then((discountValue) => {
            console.log("店販割引値取得（種別変更）:", discountValue);
            if (discountValue !== null) {
              setTimeout(() => {
                setFormData((current) => {
                  const retailTotal = calculateRetailTotal();
                  console.log("店販料金（種別変更）:", retailTotal);

                  // マスタデータから割引種別の詳細情報を取得
                  fetch("/api/masters/discount-types").then((response) => {
                    if (response.ok) {
                      response.json().then((discountTypes) => {
                        const discountTypeName = value.includes("-")
                          ? value.split("-")[0]
                          : value;
                        const discountType = discountTypes.find(
                          (d: any) => d.name === discountTypeName && d.is_active
                        );

                        console.log(
                          "店販割引種別詳細（種別変更）:",
                          discountType
                        );

                        let actualDiscount = 0;
                        if (discountType?.discount_type === "percentage") {
                          // パーセンテージの場合、実際の割引金額を計算
                          actualDiscount = retailTotal * (discountValue / 100);
                        } else if (discountType?.discount_type === "fixed") {
                          // 固定金額の場合、そのまま使用
                          actualDiscount = discountValue;
                        }

                        console.log(
                          "店販割引額計算結果（種別変更）:",
                          actualDiscount
                        );

                        setFormData((latest) => ({
                          ...latest,
                          retail_discount_amount: String(actualDiscount),
                        }));
                      });
                    }
                  });

                  return current; // 一時的に現在の状態を返す
                });
              }, 100);
            }
          });
        }
      }

      if (field === "retail_discount_amount") {
        // 割引金額が入力された場合、計算を実行
        setTimeout(() => {
          setFormData((current) => {
            const retailTotal = calculateRetailTotal();
            const discountType = current.retail_discount_type;
            const discountValue = parseFloat(value) || 0;

            let actualDiscount = 0;
            if (discountType === "percentage") {
              // パーセンテージの場合、実際の割引金額を計算
              actualDiscount = retailTotal * (discountValue / 100);
            } else if (discountType === "fixed") {
              // 固定金額の場合、入力値をそのまま使用
              actualDiscount = discountValue;
            }

            return {
              ...current,
              retail_discount_amount: String(actualDiscount),
            };
          });
        }, 100);
      }

      return newData;
    });
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
        const menu = menus.find((m: any) => m.name === menuName && m.is_active);
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

    console.log("商品価格取得開始:", productValue);

    try {
      const response = await fetch("/api/masters/retail-products");
      if (response.ok) {
        const products = await response.json();
        console.log("取得した商品一覧:", products);

        const productName = productValue.includes("-")
          ? productValue.split("-")[0]
          : productValue;

        console.log("検索する商品名:", productName);

        const product = products.find(
          (p: any) => p.name === productName && p.is_active
        );

        console.log("見つかった商品:", product);

        if (product) {
          console.log("商品価格:", product.price);
          return product.price || null;
        } else {
          console.log("商品が見つかりませんでした");
          return null;
        }
      }
    } catch (error) {
      console.error("商品料金取得エラー:", error);
    }
    return null;
  };

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
        console.log(`メニュー${i}の料金:`, treatmentContent, price);
      }
    }

    console.log("取得したメニュー料金:", prices);
    return prices;
  };

  // メニューの料金を更新する関数
  const updateMenuPrices = async () => {
    const prices = await getTreatmentMenuPrices();
    setMenuPrices(prices);
  };

  // 各商品の料金を取得する関数
  const getProductPrices = async () => {
    const prices: { [key: string]: number } = {};

    for (let i = 1; i <= 3; i++) {
      const product = formData[
        `retail_product${i}` as keyof typeof formData
      ] as string;
      if (product) {
        const price = await fetchRetailProductPrice(product);
        prices[`retail_product${i}`] = price ?? 0;
        console.log(`商品${i}の料金:`, product, price);
      }
    }

    console.log("取得した商品料金:", prices);
    return prices;
  };

  // 商品の料金を更新する関数
  const updateProductPrices = async () => {
    const prices = await getProductPrices();
    setProductPrices(prices);
  };

  // 施術メニューが変更されたときに料金を更新
  useEffect(() => {
    updateMenuPrices();
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

  // 商品が変更されたときに料金を更新
  useEffect(() => {
    updateProductPrices();
  }, [
    formData.retail_product1,
    formData.retail_product2,
    formData.retail_product3,
  ]);

  // 商品の割引計算
  useEffect(() => {
    const calculateRetailDiscount = async () => {
      if (!formData.retail_discount_type) {
        setFormData((prev) => ({
          ...prev,
          retail_discount_amount: "0",
        }));
        return;
      }

      const retailTotal = calculateRetailTotal();
      const discountValue = await fetchDiscountTypeValue(
        formData.retail_discount_type
      );

      if (discountValue === null) {
        setFormData((prev) => ({
          ...prev,
          retail_discount_amount: "0",
        }));
        return;
      }

      // マスタデータから割引種別の詳細情報を取得
      try {
        const response = await fetch("/api/masters/discount-types");
        if (response.ok) {
          const discountTypes = await response.json();
          const discountTypeName = formData.retail_discount_type.includes("-")
            ? formData.retail_discount_type.split("-")[0]
            : formData.retail_discount_type;
          const discountTypeData = discountTypes.find(
            (d: {
              name: string;
              is_active: boolean;
              discount_type?: string;
              discount_value?: number;
            }) => d.name === discountTypeName && d.is_active
          );

          let actualDiscount = 0;
          if (discountTypeData?.discount_type === "percentage") {
            // パーセンテージ割引の場合
            actualDiscount = Math.floor(retailTotal * (discountValue / 100));
          } else if (discountTypeData?.discount_type === "fixed") {
            // 固定金額割引の場合
            actualDiscount = discountValue;
          }

          setFormData((prev) => ({
            ...prev,
            retail_discount_amount: String(actualDiscount),
          }));
        }
      } catch (error) {
        console.error("商品割引計算エラー:", error);
        setFormData((prev) => ({
          ...prev,
          retail_discount_amount: "0",
        }));
      }
    };

    calculateRetailDiscount();
  }, [
    formData.retail_discount_type,
    formData.retail_product1,
    formData.retail_product1_quantity,
    formData.retail_product2,
    formData.retail_product2_quantity,
    formData.retail_product3,
    formData.retail_product3_quantity,
    productPrices,
  ]);

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
          (d: any) => d.name === discountTypeName && d.is_active
        );
        return discountType?.discount_value || null;
      }
    } catch (error) {
      console.error("割引種別値取得エラー:", error);
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* 第1行: 基本情報・施術内容・施術詳細・店販商品を4列で並べる */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 基本情報セクション */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            基本情報
          </h3>
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="treatment_date"
                className="text-blue-700 text-xs font-medium"
              >
                施術日 *
              </Label>
              <Input
                id="treatment_date"
                type="date"
                value={formData.treatment_date}
                onChange={(e) => updateField("treatment_date", e.target.value)}
                required
                className="bg-white text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="treatment_time" className="text-blue-700 text-xs">
                施術時間
              </Label>
              <Input
                id="treatment_time"
                type="time"
                value={formData.treatment_time}
                onChange={(e) => updateField("treatment_time", e.target.value)}
                className="bg-white text-sm h-8"
              />
            </div>
            <div>
              <Label
                htmlFor="stylist_name"
                className="text-blue-700 text-xs font-medium"
              >
                担当者 *
              </Label>
              <MasterDataSelect
                key={`staff-${formData.stylist_name}`}
                type="staff"
                value={formData.stylist_name}
                onValueChange={(value) => updateField("stylist_name", value)}
                placeholder="スタイリストを選択"
              />
            </div>
          </div>
        </div>

        {/* 施術内容セクション */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            施術内容
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label
                  htmlFor="treatment_content1"
                  className="text-green-700 text-xs font-medium"
                >
                  メイン施術
                </Label>
                {formData.treatment_content1 && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField("treatment_content1", "");
                      updateField("treatment_fee", "0");
                      // 施術割引額を再計算
                      if (
                        formData.treatment_discount_type &&
                        formData.treatment_discount_amount
                      ) {
                        fetchDiscountTypeValue(
                          formData.treatment_discount_type
                        ).then((discountValue) => {
                          if (discountValue !== null) {
                            fetch("/api/masters/discount-types").then(
                              (response) => {
                                if (response.ok) {
                                  response.json().then((discountTypes) => {
                                    const discountTypeName =
                                      formData.treatment_discount_type.includes(
                                        "-"
                                      )
                                        ? formData.treatment_discount_type.split(
                                            "-"
                                          )[0]
                                        : formData.treatment_discount_type;
                                    const discountType = discountTypes.find(
                                      (d: any) =>
                                        d.name === discountTypeName &&
                                        d.is_active
                                    );

                                    let actualDiscount = 0;
                                    if (
                                      discountType?.discount_type ===
                                      "percentage"
                                    ) {
                                      // パーセンテージの場合、新しい施術料金（0円）で再計算
                                      actualDiscount =
                                        0 * (discountValue / 100);
                                    } else if (
                                      discountType?.discount_type === "fixed"
                                    ) {
                                      // 固定金額の場合、そのまま使用
                                      actualDiscount = discountValue;
                                    }

                                    setFormData((final) => ({
                                      ...final,
                                      treatment_discount_amount:
                                        String(actualDiscount),
                                    }));
                                  });
                                }
                              }
                            );
                          }
                        });
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 px-1 py-0.5 rounded border border-red-300 hover:bg-red-50"
                  >
                    リセット
                  </button>
                )}
              </div>
              <CategoryMenuSelect
                key={`treatment-menu-1-${formData.treatment_content1}`}
                value={formData.treatment_content1}
                onChange={(value) => updateField("treatment_content1", value)}
                placeholder="施術メニューを選択"
              />
            </div>
            <div className="space-y-2">
              {[2, 3, 4].map((num) => (
                <div key={num}>
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor={`treatment_content${num}`}
                      className="text-green-700 text-xs"
                    >
                      追加施術{num - 1}
                    </Label>
                    {(formData[
                      `treatment_content${num}` as keyof typeof formData
                    ] as string) && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField(`treatment_content${num}`, "");
                          // 追加施術がリセットされた場合、全体の料金を再計算
                          setTimeout(() => {
                            setFormData((current) => {
                              const promises = [];
                              if (current.treatment_content1) {
                                promises.push(
                                  fetchTreatmentMenuPrice(
                                    current.treatment_content1
                                  )
                                );
                              }
                              if (current.treatment_content2) {
                                promises.push(
                                  fetchTreatmentMenuPrice(
                                    current.treatment_content2
                                  )
                                );
                              }
                              if (current.treatment_content3) {
                                promises.push(
                                  fetchTreatmentMenuPrice(
                                    current.treatment_content3
                                  )
                                );
                              }
                              if (current.treatment_content4) {
                                promises.push(
                                  fetchTreatmentMenuPrice(
                                    current.treatment_content4
                                  )
                                );
                              }

                              Promise.all(promises).then((prices) => {
                                const totalFee = prices.reduce(
                                  (sum, price) => sum + (price ?? 0),
                                  0
                                );
                                setFormData((latest) => ({
                                  ...latest,
                                  treatment_fee: String(totalFee),
                                }));

                                // 施術割引額を再計算
                                if (
                                  current.treatment_discount_type &&
                                  current.treatment_discount_amount
                                ) {
                                  fetchDiscountTypeValue(
                                    current.treatment_discount_type
                                  ).then((discountValue) => {
                                    if (discountValue !== null) {
                                      fetch("/api/masters/discount-types").then(
                                        (response) => {
                                          if (response.ok) {
                                            response
                                              .json()
                                              .then((discountTypes) => {
                                                const discountTypeName =
                                                  current.treatment_discount_type.includes(
                                                    "-"
                                                  )
                                                    ? current.treatment_discount_type.split(
                                                        "-"
                                                      )[0]
                                                    : current.treatment_discount_type;
                                                const discountType =
                                                  discountTypes.find(
                                                    (d: any) =>
                                                      d.name ===
                                                        discountTypeName &&
                                                      d.is_active
                                                  );

                                                let actualDiscount = 0;
                                                if (
                                                  discountType?.discount_type ===
                                                  "percentage"
                                                ) {
                                                  // パーセンテージの場合、新しい施術料金で再計算
                                                  actualDiscount =
                                                    totalFee *
                                                    (discountValue / 100);
                                                } else if (
                                                  discountType?.discount_type ===
                                                  "fixed"
                                                ) {
                                                  // 固定金額の場合、そのまま使用
                                                  actualDiscount =
                                                    discountValue;
                                                }

                                                setFormData((final) => ({
                                                  ...final,
                                                  treatment_discount_amount:
                                                    String(actualDiscount),
                                                }));
                                              });
                                          }
                                        }
                                      );
                                    }
                                  });
                                }
                              });

                              return current;
                            });
                          }, 100);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 px-1 py-0.5 rounded border border-red-300 hover:bg-red-50"
                      >
                        リセット
                      </button>
                    )}
                  </div>
                  <CategoryMenuSelect
                    key={`treatment-menu-${num}-${
                      formData[
                        `treatment_content${num}` as keyof typeof formData
                      ] as string
                    }`}
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

            {/* 施術画像セクション */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                施術画像
              </h4>
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />

                {/* 既存の画像表示 */}
                {"treatment_images" in initialData &&
                  initialData.treatment_images &&
                  initialData.treatment_images.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">
                        既存の画像 (
                        {(initialData as any).treatment_images.length}
                        枚):
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {(initialData as any).treatment_images.map(
                          (image: any) => (
                            <div
                              key={image.id}
                              className="relative bg-gray-100 rounded border overflow-hidden"
                            >
                              <div className="w-full h-20 flex items-center justify-center">
                                <img
                                  src={
                                    image.image_url.startsWith("/api/files/")
                                      ? image.image_url
                                      : `/api/files/${image.image_url}`
                                  }
                                  alt={`既存画像 ${image.id}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                                既存
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* 新しく選択された画像表示 */}
                {displayImages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">
                      新しく選択された画像 ({displayImages.length}枚):
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {displayImages.map((file, index) => (
                        <div
                          key={index}
                          className="relative bg-gray-100 rounded border overflow-hidden"
                        >
                          <div className="w-full h-20 flex items-center justify-center">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`画像 ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
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
                            ×
                          </div>
                          <div className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                            新規
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 施術詳細セクション */}
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
          <h3 className="text-sm font-semibold text-teal-900 mb-3 flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            施術詳細
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="style_memo" className="text-teal-700 text-xs">
                スタイルメモ
              </Label>
              <Textarea
                id="style_memo"
                value={formData.style_memo}
                onChange={(e) => updateField("style_memo", e.target.value)}
                className="bg-white text-sm"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="used_chemicals" className="text-teal-700 text-xs">
                使用薬剤
              </Label>
              <Textarea
                id="used_chemicals"
                value={formData.used_chemicals}
                onChange={(e) => updateField("used_chemicals", e.target.value)}
                className="bg-white text-sm"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="solution1_time"
                  className="text-teal-700 text-xs"
                >
                  1液タイム
                </Label>
                <Input
                  id="solution1_time"
                  value={formData.solution1_time}
                  onChange={(e) =>
                    updateField("solution1_time", e.target.value)
                  }
                  className="bg-white text-sm h-8"
                />
              </div>
              <div>
                <Label
                  htmlFor="solution2_time"
                  className="text-teal-700 text-xs"
                >
                  2液タイム
                </Label>
                <Input
                  id="solution2_time"
                  value={formData.solution2_time}
                  onChange={(e) =>
                    updateField("solution2_time", e.target.value)
                  }
                  className="bg-white text-sm h-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="color_time1" className="text-teal-700 text-xs">
                  カラータイム1
                </Label>
                <Input
                  id="color_time1"
                  value={formData.color_time1}
                  onChange={(e) => updateField("color_time1", e.target.value)}
                  className="bg-white text-sm h-8"
                />
              </div>
              <div>
                <Label htmlFor="color_time2" className="text-teal-700 text-xs">
                  カラータイム2
                </Label>
                <Input
                  id="color_time2"
                  value={formData.color_time2}
                  onChange={(e) => updateField("color_time2", e.target.value)}
                  className="bg-white text-sm h-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="other_details" className="text-teal-700 text-xs">
                その他
              </Label>
              <Input
                id="other_details"
                value={formData.other_details}
                onChange={(e) => updateField("other_details", e.target.value)}
                className="bg-white text-sm h-8"
              />
            </div>
          </div>
        </div>

        {/* 店販商品セクション */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            店販商品
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((num) => (
              <div key={num}>
                <div className="flex items-center justify-between mb-1">
                  <Label
                    htmlFor={`retail_product${num}`}
                    className="text-indigo-700 text-xs"
                  >
                    店頭販売商品{num}
                  </Label>
                  {(formData[
                    `retail_product${num}` as keyof typeof formData
                  ] as string) && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log("店販商品リセット:", num);
                        // リセット後の状態で全商品の価格を取得し合計を計算
                        const getProductPriceAfterReset = async (
                          productKey: string,
                          quantityKey: string
                        ) => {
                          const productValue =
                            productKey === `retail_product${num}`
                              ? ""
                              : formData[productKey];
                          const quantityValue = formData[quantityKey];
                          if (!productValue) return 0;
                          const price = await fetchRetailProductPrice(
                            productValue as string
                          );
                          return (price ?? 0) * Number(quantityValue || 1);
                        };
                        Promise.all([
                          getProductPriceAfterReset(
                            "retail_product1",
                            "retail_product1_quantity"
                          ),
                          getProductPriceAfterReset(
                            "retail_product2",
                            "retail_product2_quantity"
                          ),
                          getProductPriceAfterReset(
                            "retail_product3",
                            "retail_product3_quantity"
                          ),
                        ]).then(([p1, p2, p3]) => {
                          const totalRetailFee = p1 + p2 + p3;
                          setFormData((current) => {
                            const updatedData = { ...current };
                            // リセット対象の商品をクリア
                            updatedData[
                              `retail_product${num}` as keyof typeof updatedData
                            ] = "";
                            updatedData[
                              `retail_product${num}_price` as keyof typeof updatedData
                            ] = "0";
                            updatedData[
                              `retail_product${num}_quantity` as keyof typeof updatedData
                            ] = "0";
                            // 合計金額を更新
                            updatedData.retail_fee = String(totalRetailFee);
                            // 割引再計算
                            if (current.retail_discount_type) {
                              fetchDiscountTypeValue(
                                current.retail_discount_type
                              ).then((discountValue) => {
                                if (discountValue !== null) {
                                  fetch("/api/masters/discount-types").then(
                                    (response) => {
                                      if (response.ok) {
                                        response
                                          .json()
                                          .then((discountTypes) => {
                                            const discountTypeName =
                                              current.retail_discount_type.includes(
                                                "-"
                                              )
                                                ? current.retail_discount_type.split(
                                                    "-"
                                                  )[0]
                                                : current.retail_discount_type;
                                            const discountType =
                                              discountTypes.find(
                                                (d: any) =>
                                                  d.name === discountTypeName &&
                                                  d.is_active
                                              );
                                            let actualDiscount = 0;
                                            if (
                                              discountType?.discount_type ===
                                              "percentage"
                                            ) {
                                              actualDiscount =
                                                totalRetailFee *
                                                (discountValue / 100);
                                            } else if (
                                              discountType?.discount_type ===
                                              "fixed"
                                            ) {
                                              actualDiscount = discountValue;
                                            }
                                            setFormData((latest) => ({
                                              ...latest,
                                              retail_discount_amount:
                                                String(actualDiscount),
                                            }));
                                          });
                                      }
                                    }
                                  );
                                }
                              });
                            }
                            return updatedData;
                          });
                        });
                      }}
                      className="text-xs text-red-600 hover:text-red-800 px-1 py-0.5 rounded border border-red-300 hover:bg-red-50"
                    >
                      リセット
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <CategoryMenuSelect
                      key={`retail-product-${num}-${
                        formData[
                          `retail_product${num}` as keyof typeof formData
                        ] as string
                      }`}
                      type="retail-product"
                      value={
                        formData[
                          `retail_product${num}` as keyof typeof formData
                        ] as string
                      }
                      onChange={(value) => {
                        updateField(`retail_product${num}`, value);
                        // 商品が選択された場合、数量を1に設定
                        if (value) {
                          updateField(`retail_product${num}_quantity`, "1");
                        } else {
                          // 商品がリセットされた場合、数量を0に設定
                          updateField(`retail_product${num}_quantity`, "0");
                        }
                      }}
                      placeholder="商品を選択"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-indigo-700 text-xs whitespace-nowrap">
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
                      className="bg-white text-sm h-8 w-20"
                      placeholder="数量"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 第2行: 備考・会話内容・次回予約を2列で並べる */}

      {/* 第3行: 料金入力と会話内容・次回予約・備考を2列で並べる */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 料金入力セクション */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            料金入力
          </h3>

          {/* 割引設定 */}
          <div className="bg-white p-3 rounded-lg border border-orange-200 mb-3">
            <h4 className="text-xs font-medium text-orange-800 mb-2">
              割引設定
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="treatment_discount_type"
                  className="text-orange-700 text-xs"
                >
                  施術割引種別
                </Label>
                <MasterDataSelect
                  key={`discount-type-treatment-${formData.treatment_discount_type}`}
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
                  className="text-orange-700 text-xs"
                >
                  店販割引種別
                </Label>
                <MasterDataSelect
                  key={`discount-type-retail-${formData.retail_discount_type}`}
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

          {/* 料金詳細（横並び） */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            {/* 施術料金詳細 */}
            <div className="bg-white p-3 rounded-lg border border-orange-200">
              <h4 className="text-xs font-medium text-orange-800 mb-2">
                施術料金
              </h4>
              <div className="space-y-1 mb-2">
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
                      className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <span className="text-xs text-gray-600">
                          メニュー{num}:
                        </span>
                        <span className="ml-1 text-xs font-medium">
                          {menuName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-orange-600">
                        ¥
                        {menuPrices[`treatment_content${num}`]
                          ? menuPrices[
                              `treatment_content${num}`
                            ].toLocaleString()
                          : "取得中..."}
                      </span>
                    </div>
                  );
                })}
                {![1, 2, 3, 4, 5, 6, 7, 8].some(
                  (num) =>
                    formData[`treatment_content${num}` as keyof typeof formData]
                ) && (
                  <div className="text-xs text-gray-500 italic">
                    選択されたメニューがありません
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-orange-700">
                    施術料金小計:
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    ¥
                    {parseFloat(formData.treatment_fee || "0").toLocaleString()}
                  </span>
                </div>
                {parseFloat(formData.treatment_discount_amount || "0") > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-xs font-medium">施術割引:</span>
                    <span className="text-xs font-semibold">
                      -¥
                      {parseFloat(
                        formData.treatment_discount_amount || "0"
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-1">
                  <span className="text-xs font-medium text-orange-700">
                    施術料金合計:
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
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
            <div className="bg-white p-3 rounded-lg border border-orange-200">
              <h4 className="text-xs font-medium text-orange-800 mb-2">
                店販料金
              </h4>
              <div className="space-y-1 mb-2">
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
                  const price = productPrices[`retail_product${num}`] || 0;

                  if (!product || quantity === 0) return null;

                  const productName = product.includes("-")
                    ? product.split("-")[0]
                    : product;
                  const subtotal = price * quantity;

                  return (
                    <div
                      key={num}
                      className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">
                            商品{num}:
                          </span>
                          <span className="text-xs font-medium">
                            {productName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-gray-500">
                            ¥
                            {productPrices[`retail_product${num}`]
                              ? price.toLocaleString()
                              : "取得中..."}{" "}
                            × {quantity}個
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-orange-600">
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
                  <div className="text-xs text-gray-500 italic">
                    選択された商品がありません
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-orange-700">
                    店販料金小計:
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    ¥{calculateRetailTotal().toLocaleString()}
                  </span>
                </div>
                {parseFloat(formData.retail_discount_amount || "0") > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-xs font-medium">店販割引:</span>
                    <span className="text-xs font-semibold">
                      -¥
                      {parseFloat(
                        formData.retail_discount_amount || "0"
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-1">
                  <span className="text-xs font-medium text-orange-700">
                    店販料金合計:
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    ¥
                    {(
                      calculateRetailTotal() -
                      parseFloat(formData.retail_discount_amount || "0")
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* お会計 */}
          <div className="bg-white p-3 rounded-lg border border-orange-200">
            <h4 className="text-xs font-medium text-orange-800 mb-2">お会計</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center border-t-2 border-orange-200 pt-2">
                <span className="text-sm font-semibold text-orange-700">
                  お会計合計:
                </span>
                <span className="text-lg font-bold text-orange-600">
                  ¥{calculateTotal().toLocaleString()}
                </span>
              </div>
              <div>
                <Label
                  htmlFor="payment_method"
                  className="text-orange-700 text-xs"
                >
                  支払い方法
                </Label>
                <MasterDataSelect
                  key={`payment-method-${formData.payment_method}`}
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

        {/* 会話内容・次回予約・備考セクション */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            会話内容・次回予約・備考
          </h3>
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="conversation_content"
                className="text-gray-700 text-xs"
              >
                会話内容
              </Label>
              <Textarea
                id="conversation_content"
                value={formData.conversation_content}
                onChange={(e) =>
                  updateField("conversation_content", e.target.value)
                }
                className="bg-white text-sm"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-gray-700 text-xs">
                備考
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="bg-white text-sm"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="next_appointment_date"
                  className="text-gray-700 text-xs"
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
                  className="bg-white text-sm h-8"
                />
              </div>
              <div>
                <Label
                  htmlFor="next_appointment_time"
                  className="text-gray-700 text-xs"
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
                  className="bg-white text-sm h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
