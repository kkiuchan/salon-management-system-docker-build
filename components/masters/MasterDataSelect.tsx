"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DiscountType,
  PaymentMethod,
  ReferralSource,
  RetailProduct,
  Staff,
  TreatmentMenu,
} from "@/types";
import { useEffect, useState } from "react";

interface MasterDataSelectProps {
  type:
    | "staff"
    | "treatment-menu"
    | "referral-source"
    | "payment-method"
    | "discount-type"
    | "retail-product";
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export default function MasterDataSelect({
  type,
  value,
  onValueChange,
  placeholder = "選択してください",
}: MasterDataSelectProps) {
  const [data, setData] = useState<
    (
      | Staff
      | TreatmentMenu
      | ReferralSource
      | PaymentMethod
      | DiscountType
      | RetailProduct
    )[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;
        switch (type) {
          case "staff":
            response = await fetch("/api/masters/staff");
            break;
          case "treatment-menu":
            response = await fetch("/api/masters/treatment-menus");
            break;
          case "referral-source":
            response = await fetch("/api/masters/referral-sources");
            break;
          case "payment-method":
            response = await fetch("/api/masters/payment-methods");
            break;
          case "discount-type":
            response = await fetch("/api/masters/discount-types");
            break;
          case "retail-product":
            response = await fetch("/api/masters/retail-products");
            break;
          default:
            setData([]);
            setLoading(false);
            return;
        }

        if (response.ok) {
          const items = await response.json();
          // 有効なデータのみをフィルタリング（nameが存在し、空文字列でないもの）
          const activeItems = items.filter(
            (
              item:
                | Staff
                | TreatmentMenu
                | ReferralSource
                | PaymentMethod
                | DiscountType
                | RetailProduct
            ) => item.is_active && item.name && item.name.trim() !== ""
          );
          setData(activeItems);
        }
      } catch (error) {
        console.error("マスターデータ取得エラー:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  if (loading) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading" disabled>
            読み込み中...
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // データが空の場合
  if (data.length === 0) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-data" disabled>
            データがありません
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // 表示用の値を取得（name-id形式の場合はnameのみを返す）
  const getDisplayValue = (currentValue: string) => {
    if (!currentValue) return "";

    // name-id形式の場合は、name部分のみを返す
    if (currentValue.includes("-")) {
      const namePart = currentValue.split("-").slice(0, -1).join("-");
      return namePart;
    }

    // nameのみの場合は、そのまま返す
    return currentValue;
  };

  // 現在の値に対応するアイテムを探す
  const findItemByValue = (currentValue: string) => {
    if (!currentValue) return null;

    // name-id形式の場合は、name部分で検索
    if (currentValue.includes("-")) {
      const namePart = currentValue.split("-").slice(0, -1).join("-");
      return data.find((item) => item.name === namePart);
    }

    // nameのみの場合は、直接検索
    return data.find((item) => item.name === currentValue);
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <span className="block truncate">
          {getDisplayValue(value) || placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {data.map((item, index) => (
          <SelectItem key={`${item.id}-${index}`} value={item.name}>
            {item.name || `項目${item.id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
