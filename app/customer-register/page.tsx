"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { GENDER_OPTIONS } from "@/types";
import { CheckCircle, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

export default function CustomerRegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customer, setCustomer] = useState({
    furigana: "",
    name: "",
    gender: undefined,
    phone: "",
    emergency_contact: "",
    date_of_birth: "",
    age: "",
    occupation: "",
    postal_code: "",
    address: "",
    visiting_family: "",
    email: "",
    blood_type: undefined,
    allergies: "",
    medical_history: "",
    notes: "",
    referral_source1: "",
    referral_source2: "",
    referral_source3: "",
    referral_details: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customer),
      });

      if (response.ok) {
        setSuccess(true);
        // フォームをリセット
        setCustomer({
          furigana: "",
          name: "",
          gender: undefined,
          phone: "",
          emergency_contact: "",
          date_of_birth: "",
          age: "",
          occupation: "",
          postal_code: "",
          address: "",
          visiting_family: "",
          email: "",
          blood_type: undefined,
          allergies: "",
          medical_history: "",
          notes: "",
          referral_source1: "",
          referral_source2: "",
          referral_source3: "",
          referral_details: "",
        });

        // 3秒後に成功メッセージを消す
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("登録に失敗しました。もう一度お試しください。");
      }
    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // クライアントサイドでのみレンダリング
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              登録完了！
            </CardTitle>
            <CardDescription className="text-green-600">
              お客様の情報が正常に登録されました。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setSuccess(false)} className="w-full">
              新しい登録を続ける
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Karvio(カルビオ) 顧客登録
          </h1>
          <p className="text-gray-600">お客様情報を入力してください</p>
        </div>

        {/* 登録フォーム */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              顧客情報入力
            </CardTitle>
            <CardDescription>必須項目は * で表示されています</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  基本情報
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      お名前 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={customer.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="山田 太郎"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="furigana">フリガナ</Label>
                    <Input
                      id="furigana"
                      value={customer.furigana}
                      onChange={(e) =>
                        handleInputChange("furigana", e.target.value)
                      }
                      placeholder="ヤマダ タロウ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">性別</Label>
                    <Select
                      value={customer.gender || ""}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="date_of_birth">生年月日</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={customer.date_of_birth}
                      onChange={(e) =>
                        handleInputChange("date_of_birth", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">
                      電話番号 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={customer.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="090-1234-5678"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customer.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* 住所情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  住所情報
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">郵便番号</Label>
                    <Input
                      id="postal_code"
                      value={customer.postal_code}
                      onChange={(e) =>
                        handleInputChange("postal_code", e.target.value)
                      }
                      placeholder="123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">住所</Label>
                    <Input
                      id="address"
                      value={customer.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="東京都渋谷区..."
                    />
                  </div>
                </div>
              </div>

              {/* その他の情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  その他の情報
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="occupation">職業</Label>
                    <Input
                      id="occupation"
                      value={customer.occupation}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                      placeholder="会社員"
                    />
                  </div>

                  <div>
                    <Label htmlFor="blood_type">血液型</Label>
                    <Select
                      value={customer.blood_type || ""}
                      onValueChange={(value) =>
                        handleInputChange("blood_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="血液型を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A型">A型</SelectItem>
                        <SelectItem value="B型">B型</SelectItem>
                        <SelectItem value="O型">O型</SelectItem>
                        <SelectItem value="AB型">AB型</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="allergies">アレルギー</Label>
                  <Textarea
                    id="allergies"
                    value={customer.allergies}
                    onChange={(e) =>
                      handleInputChange("allergies", e.target.value)
                    }
                    placeholder="アレルギーがある場合は記入してください"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="referral_source1">来店きっかけ</Label>
                  <Input
                    id="referral_source1"
                    value={customer.referral_source1}
                    onChange={(e) =>
                      handleInputChange("referral_source1", e.target.value)
                    }
                    placeholder="知人紹介、インターネット、看板など"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    value={customer.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="その他特記事項があれば記入してください"
                    rows={3}
                  />
                </div>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full max-w-md text-lg py-3"
                >
                  {submitting ? "登録中..." : "顧客情報を登録"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
