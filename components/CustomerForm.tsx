"use client";

import MasterDataSelect from "@/components/masters/MasterDataSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BLOOD_TYPE_OPTIONS, CustomerInsert, GENDER_OPTIONS } from "@/types";
import { AlertCircle, Heart, MapPin, Phone, User, Users } from "lucide-react";
import { useState } from "react";

interface CustomerFormProps {
  initialData?: Partial<CustomerInsert>;
  onSubmit: (data: CustomerInsert) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

export default function CustomerForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "保存",
}: CustomerFormProps) {
  // 生年月日をHTML date input用の形式に変換
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";

    // 既にYYYY-MM-DD形式の場合はそのまま返す
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // YYYY/MM/DD形式の場合は変換
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      return dateString.replace(/\//g, "-");
    }

    // その他の形式の場合は空文字列を返す
    return "";
  };

  const { age: initialAge, ...otherInitialData } = initialData;
  const [formData, setFormData] = useState({
    furigana: otherInitialData.furigana ?? "",
    name: otherInitialData.name ?? "",
    gender: otherInitialData.gender ?? "",
    phone: otherInitialData.phone ?? "",
    emergency_contact: otherInitialData.emergency_contact ?? "",
    date_of_birth: formatDateForInput(otherInitialData.date_of_birth),
    age: initialAge ? initialAge.toString() : "",
    occupation: otherInitialData.occupation ?? "",
    postal_code: otherInitialData.postal_code ?? "",
    address: otherInitialData.address ?? "",
    visiting_family: otherInitialData.visiting_family ?? "",
    email: otherInitialData.email ?? "",
    blood_type: otherInitialData.blood_type ?? "",
    allergies: otherInitialData.allergies ?? "",
    medical_history: otherInitialData.medical_history ?? "",
    notes: otherInitialData.notes ?? "",
    referral_source1: otherInitialData.referral_source1 ?? "",
    referral_source2: otherInitialData.referral_source2 ?? "",
    referral_source3: otherInitialData.referral_source3 ?? "",
    referral_details: otherInitialData.referral_details ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : undefined,
    };
    onSubmit(submitData);
  };

  // 生年月日から年齢を計算する関数
  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // 今年の誕生日がまだ来ていない場合は1歳引く
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const updateField = (field: string, value: string) => {
    // 来店きっかけフィールドの場合は、name-id形式の値をそのまま保持
    if (field.startsWith("referral_source")) {
      setFormData((prev) => ({ ...prev, [field]: value }));
      return;
    }

    // 生年月日の場合は、そのままの値を使用
    if (field === "date_of_birth") {
      const calculatedAge = value ? calculateAge(value) : null;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        age: calculatedAge !== null ? calculatedAge.toString() : "",
      }));
      return;
    }

    // その他のフィールドは従来通り処理
    let nameValue = value;
    if (value && value.includes("-")) {
      nameValue = value.split("-").slice(0, -1).join("-");
    }

    console.log(`updateField: ${field} = ${value} -> ${nameValue}`);
    setFormData((prev) => ({ ...prev, [field]: nameValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {/* 基本情報と連絡先を横に並べる */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 基本情報セクション */}
        <div className="bg-blue-50 p-8 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5" />
            基本情報
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="furigana" className="text-blue-700 mb-3 block">
                  フリガナ
                </Label>
                <Input
                  id="furigana"
                  value={formData.furigana}
                  onChange={(e) => updateField("furigana", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="name"
                  className="text-blue-700 font-medium mb-3 block"
                >
                  お名前 *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gender" className="text-blue-700 mb-3 block">
                  性別
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="date_of_birth"
                  className="text-blue-700 mb-3 block"
                >
                  誕生日
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateField("date_of_birth", e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="age" className="text-blue-700 mb-3 block">
                  年齢（自動計算）
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="生年月日から自動計算"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 連絡先セクション */}
        <div className="bg-green-50 p-8 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-6 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            連絡先情報
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-green-700 mb-3 block">
                  連絡先1
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="emergency_contact"
                  className="text-green-700 mb-3 block"
                >
                  緊急連絡先
                </Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) =>
                    updateField("emergency_contact", e.target.value)
                  }
                  className="bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-green-700 mb-3 block">
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="occupation"
                  className="text-green-700 mb-3 block"
                >
                  ご職業
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 住所・その他情報と医療情報を横に並べる */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 住所・その他情報セクション */}
        <div className="bg-purple-50 p-8 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            住所・その他情報
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="postal_code"
                  className="text-purple-700 mb-3 block"
                >
                  郵便番号
                </Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateField("postal_code", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="visiting_family"
                  className="text-purple-700 mb-3 block"
                >
                  来店家族
                </Label>
                <Input
                  id="visiting_family"
                  value={formData.visiting_family}
                  onChange={(e) =>
                    updateField("visiting_family", e.target.value)
                  }
                  className="bg-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address" className="text-purple-700 mb-3 block">
                住所
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <Label
                htmlFor="blood_type"
                className="text-purple-700 mb-3 block"
              >
                血液型
              </Label>
              <Select
                value={formData.blood_type}
                onValueChange={(value) => updateField("blood_type", value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="血液型を選択" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 医療情報セクション */}
        <div className="bg-red-50 p-8 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-6 flex items-center gap-2">
            <Heart className="h-5 w-5" />
            医療情報
          </h3>
          <div className="space-y-6">
            <div>
              <Label htmlFor="allergies" className="text-red-700 mb-3 block">
                アレルギー
              </Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <Label
                htmlFor="medical_history"
                className="text-red-700 mb-3 block"
              >
                既往歴
              </Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => updateField("medical_history", e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 来店きっかけと注意事項を横に並べる */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 来店きっかけセクション */}
        <div className="bg-yellow-50 p-8 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-6 flex items-center gap-2">
            <Users className="h-5 w-5" />
            来店きっかけ
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="referral_source1"
                  className="text-yellow-700 mb-3 block"
                >
                  来店きっかけ1
                </Label>
                <MasterDataSelect
                  type="referral-source"
                  value={formData.referral_source1}
                  onValueChange={(value) =>
                    updateField("referral_source1", value)
                  }
                  placeholder="選択してください"
                />
              </div>
              <div>
                <Label
                  htmlFor="referral_source2"
                  className="text-yellow-700 mb-3 block"
                >
                  来店きっかけ2
                </Label>
                <MasterDataSelect
                  type="referral-source"
                  value={formData.referral_source2}
                  onValueChange={(value) =>
                    updateField("referral_source2", value)
                  }
                  placeholder="選択してください"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="referral_source3"
                className="text-yellow-700 mb-3 block"
              >
                来店きっかけ3
              </Label>
              <MasterDataSelect
                type="referral-source"
                value={formData.referral_source3}
                onValueChange={(value) =>
                  updateField("referral_source3", value)
                }
                placeholder="選択してください"
              />
            </div>
            <div>
              <Label
                htmlFor="referral_details"
                className="text-yellow-700 mb-3 block"
              >
                来店きっかけ詳細
              </Label>
              <Textarea
                id="referral_details"
                value={formData.referral_details}
                onChange={(e) =>
                  updateField("referral_details", e.target.value)
                }
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* 注意事項セクション */}
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            注意事項
          </h3>
          <div>
            <Label htmlFor="notes" className="text-gray-700 mb-3 block">
              備考
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      </div>

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
