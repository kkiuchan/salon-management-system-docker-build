"use client";

import CustomerForm from "@/components/CustomerForm";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import TreatmentForm from "@/components/TreatmentForm";
import TreatmentPhotoQRCode from "@/components/TreatmentPhotoQRCode";
import TreatmentWizardForm from "@/components/TreatmentWizardForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Customer, Treatment } from "@/types";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Clipboard,
  Clock,
  Download,
  Droplets,
  Edit,
  FileText,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Scissors,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTreatmentDialogOpen, setIsTreatmentDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    localIPs: string[];
    localIp?: string;
  } | null>(null);

  // paramsを非同期で取得
  const [customerId, setCustomerId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setCustomerId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // URLパラメータをチェックして新規作成ダイアログを開く
  useEffect(() => {
    const newTreatment = searchParams.get("newTreatment");
    if (newTreatment === "true") {
      // 画面サイズに応じて適切なフォームを表示
      if (window.innerWidth >= 1280) {
        setIsTreatmentDialogOpen(true);
      } else {
        setIsWizardOpen(true);
      }
      // URLからパラメータを削除
      router.replace(`/customers/${customerId}`);
    }
  }, [searchParams, customerId, router]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
      fetchNetworkInfo();
    }
  }, [customerId]);

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch("/api/network-info");
      if (response.ok) {
        const data = await response.json();
        console.log("ネットワーク情報:", data);
        setNetworkInfo(data);
      } else {
        console.error("ネットワーク情報取得失敗:", response.status);
      }
    } catch (error) {
      console.error("ネットワーク情報取得エラー:", error);
    }
  };

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("取得したデータ:", data);
        setCustomer(data);
        setTreatments([]); // 施術データは別途取得

        const editData = {
          furigana: data?.furigana || "",
          name: data?.name || "",
          gender: data?.gender || "",
          phone: data?.phone || "",
          emergency_contact: data?.emergency_contact || "",
          date_of_birth: data?.date_of_birth || "",
          age: data?.age?.toString() || "",
          occupation: data?.occupation || "",
          postal_code: data?.postal_code || "",
          address: data?.address || "",
          visiting_family: data?.visiting_family || "",
          email: data?.email || "",
          blood_type: data?.blood_type || "",
          allergies: data?.allergies || "",
          medical_history: data?.medical_history || "",
          notes: data?.notes || "",
          referral_source1: data?.referral_source1 || "",
          referral_source2: data?.referral_source2 || "",
          referral_source3: data?.referral_source3 || "",
          referral_details: data?.referral_details || "",
        };

        console.log("設定する編集データ:", editData);
        // setEditCustomer(editData); // This line is removed as per the edit hint

        // 施術データを取得
        await fetchTreatments();
      }
    } catch (error) {
      console.error("顧客データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  // 施術データを取得する関数
  const fetchTreatments = async () => {
    try {
      const response = await fetch(`/api/treatments?customerId=${customerId}`);
      if (response.ok) {
        const treatmentsData = await response.json();
        setTreatments(treatmentsData);
      }
    } catch (error) {
      console.error("施術データの取得に失敗しました:", error);
    }
  };

  // handleEditCustomer関数は削除されたため、この関数も削除

  // 画像アップロード関数
  const uploadTreatmentImages = async (treatmentId: string) => {
    if (selectedImages.length === 0) return [];

    try {
      console.log("画像アップロード開始:", selectedImages.length, "枚");

      // 顧客情報を取得（APIが必要とするパラメータのため）
      if (!customer) {
        throw new Error("顧客情報が取得できません");
      }

      const formData = new FormData();
      formData.append("treatmentId", treatmentId);
      formData.append("customerId", customer.id.toString());
      formData.append("customerName", customer.name);

      // 施術日を取得（最新の施術情報から）
      const treatmentResponse = await fetch(`/api/treatments/${treatmentId}`);
      if (!treatmentResponse.ok) {
        throw new Error("施術情報の取得に失敗しました");
      }
      const treatmentData = await treatmentResponse.json();
      formData.append("treatmentDate", treatmentData.treatment_date);

      // 全ての画像を一度に送信
      selectedImages.forEach((file) => {
        formData.append("files", file);
      });

      console.log("画像アップロード中:", {
        treatmentId,
        customerId: customer.id,
        customerName: customer.name,
        treatmentDate: treatmentData.treatment_date,
        fileCount: selectedImages.length,
      });

      const response = await fetch("/api/treatments/images", {
        method: "POST",
        body: formData,
      });

      console.log(
        "画像アップロードレスポンス:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const result = await response.json();
        console.log("画像アップロード成功:", result);
        return result.images || [];
      } else {
        const errorData = await response.json();
        console.error("画像アップロードに失敗しました:", errorData.error);
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      throw error;
    }
  };

  // 施術削除機能
  const handleDeleteTreatment = async () => {
    if (!treatmentToDelete) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/treatments/${treatmentToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 顧客データを再取得して表示を更新
        await fetchCustomer();
        alert("施術を削除しました");
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術の削除に失敗しました:", error);
      alert("削除エラーが発生しました");
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setTreatmentToDelete(""); // Changed from null to ""
    }
  };

  // 削除ダイアログを開く
  const openDeleteDialog = (treatmentId: string) => {
    // Changed from number to string
    setTreatmentToDelete(treatmentId);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("ja-JP");
  };

  // マスタデータの値をname部分のみに変換
  const formatMasterDataValue = (value: string | undefined) => {
    if (!value) return "";

    // name-id形式の場合は、name部分だけを抽出
    if (value.includes("-")) {
      const namePart = value.split("-").slice(0, -1).join("-");
      return namePart;
    }

    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">顧客が見つかりません</h2>
          <Button onClick={() => router.push("/dashboard")}>
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">顧客詳細</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 顧客情報 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {customer?.name || "名前なし"}
                    </CardTitle>
                    <CardDescription>
                      ID: {customer.id} •{" "}
                      {customer?.gender && `${customer.gender} • `}
                      {customer?.date_of_birth &&
                        `${formatDate(customer.date_of_birth)}生まれ`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* データエクスポートボタン */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          title="データエクスポート"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {customer.name}様のデータエクスポート
                          </DialogTitle>
                          <DialogDescription>
                            この顧客のデータをダウンロードします
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">
                              エクスポート内容
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• 顧客基本情報</li>
                              <li>
                                • 施術履歴 ({treatments?.length || 0}
                                件)
                              </li>
                              <li>• 施術画像URL</li>
                              <li>• 作成・更新日時</li>
                            </ul>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                const url = `/api/export/customers?id=${customer.id}&format=csv`;
                                window.open(url, "_blank");
                              }}
                              className="flex-1"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              CSV形式
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const url = `/api/export/customers?customer_id=${customer.id}&format=json`;
                                window.open(url, "_blank");
                              }}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              JSON形式
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* 編集ボタン */}
                    <Dialog
                      open={isEditDialogOpen}
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          title="顧客情報編集"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[98vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>顧客情報編集</DialogTitle>
                          <DialogDescription>
                            顧客の情報を更新してください
                          </DialogDescription>
                        </DialogHeader>
                        <CustomerForm
                          initialData={customer}
                          onSubmit={async (data) => {
                            try {
                              const response = await fetch(
                                `/api/customers/${customer.id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify(data),
                                }
                              );
                              if (response.ok) {
                                setIsEditDialogOpen(false);
                                fetchCustomer();
                              } else {
                                alert("顧客情報の更新に失敗しました");
                              }
                            } catch (error) {
                              console.error("更新エラー:", error);
                              alert("顧客情報の更新に失敗しました");
                            }
                          }}
                          onCancel={() => setIsEditDialogOpen(false)}
                          submitLabel="更新"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span>顧客ID: {customer.id}</span>
                  </div>
                  {customer.furigana && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>フリガナ: {customer.furigana}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.phone2 && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>連絡先2: {customer.phone2}</span>
                    </div>
                  )}
                  {customer.emergency_contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>緊急連絡先: {customer.emergency_contact}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.age && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>年齢: {customer.age}歳</span>
                    </div>
                  )}
                  {customer.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>職業: {customer.occupation}</span>
                    </div>
                  )}
                  {customer.postal_code && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>郵便番号: {customer.postal_code}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>住所: {customer.address}</span>
                    </div>
                  )}
                  {customer.visiting_family && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>同伴者: {customer.visiting_family}</span>
                    </div>
                  )}
                  {customer.blood_type && (
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-gray-500" />
                      <span>血液型: {customer.blood_type}</span>
                    </div>
                  )}
                  {customer.allergies && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-gray-500" />
                      <span>アレルギー: {customer.allergies}</span>
                    </div>
                  )}
                  {customer.medical_history && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>既往歴: {customer.medical_history}</span>
                    </div>
                  )}
                  {customer.first_visit_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        初回来店日: {formatDate(customer.first_visit_date)}
                      </span>
                    </div>
                  )}
                  {customer.referral_source1 && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>来店きっかけ: {customer.referral_source1}</span>
                    </div>
                  )}
                  {customer.referral_details && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span>紹介詳細: {customer.referral_details}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="pt-3 border-t">
                      <h4 className="font-medium mb-2">備考</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* QRコードセクション（PCのみ表示） */}
            <div className="mt-6 hidden lg:block">
              {(() => {
                const qrUrl = networkInfo?.localIp
                  ? `http://${networkInfo.localIp}:3000/customers/${customer.id}`
                  : "";
                console.log("QRコードURL:", qrUrl);
                return (
                  <QRCodeDisplay
                    url={qrUrl}
                    title="顧客詳細ページアクセス"
                    description="QRコードをスキャンして顧客詳細ページにアクセス"
                  />
                );
              })()}
            </div>
          </div>

          {/* 施術履歴 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>施術履歴</CardTitle>
                  {/* PC表示（xl以上）ではダイアログ */}
                  <div className="hidden xl:block">
                    <Dialog
                      open={isTreatmentDialogOpen}
                      onOpenChange={setIsTreatmentDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          施術追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[98vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>新規施術追加</DialogTitle>
                          <DialogDescription>
                            新しい施術情報を入力してください
                          </DialogDescription>
                        </DialogHeader>
                        <TreatmentForm
                          customerId={parseInt(customerId)}
                          onSubmit={async (data) => {
                            setSubmitting(true);
                            try {
                              const response = await fetch("/api/treatments", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify(data),
                              });

                              if (response.ok) {
                                const newTreatment = await response.json();

                                // 画像アップロード処理
                                if (selectedImages.length > 0) {
                                  try {
                                    await uploadTreatmentImages(
                                      newTreatment.id
                                    );
                                    console.log("画像アップロード完了");
                                  } catch (error) {
                                    console.error(
                                      "画像アップロードエラー:",
                                      error
                                    );
                                    alert("画像のアップロードに失敗しました");
                                  }
                                }

                                // データ再取得
                                await fetchCustomer();
                                setIsTreatmentDialogOpen(false);
                                setSelectedImages([]);
                                alert("施術を追加しました");
                              } else {
                                const error = await response.json();
                                alert(`追加に失敗しました: ${error.error}`);
                              }
                            } catch (error) {
                              console.error("施術の追加に失敗しました:", error);
                              alert("追加エラーが発生しました");
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          onCancel={() => {
                            setIsTreatmentDialogOpen(false);
                            setSelectedImages([]);
                          }}
                          submitting={submitting}
                          submitLabel="追加"
                          onImageSelect={setSelectedImages}
                          selectedImages={selectedImages}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* スマホ・タブレット表示（xl未満）ではボタンクリックでウィザード表示 */}
                  <div className="xl:hidden">
                    <Button onClick={() => setIsWizardOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      施術追加
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {treatments && treatments.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {treatments.map((treatment, index) => (
                      <AccordionItem
                        key={treatment.id}
                        value={`treatment-${index}`}
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {formatDate(treatment.treatment_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Scissors className="h-4 w-4 text-gray-500" />
                                <span>
                                  {formatMasterDataValue(
                                    treatment.treatment_content1
                                  ) || "施術内容"}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {treatment.total_amount &&
                                `¥${treatment.total_amount.toLocaleString()}`}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">施術詳細</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    スタイリスト:{" "}
                                    {formatMasterDataValue(
                                      treatment.stylist_name
                                    )}
                                  </div>
                                  {treatment.treatment_time && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      {treatment.treatment_time}
                                    </div>
                                  )}

                                  {/* 施術内容 */}
                                  {treatment.treatment_content1 && (
                                    <div>
                                      施術内容1:{" "}
                                      {formatMasterDataValue(
                                        treatment.treatment_content1
                                      )}
                                    </div>
                                  )}
                                  {treatment.treatment_content2 && (
                                    <div>
                                      施術内容2:{" "}
                                      {formatMasterDataValue(
                                        treatment.treatment_content2
                                      )}
                                    </div>
                                  )}
                                  {treatment.treatment_content3 && (
                                    <div>
                                      施術内容3:{" "}
                                      {formatMasterDataValue(
                                        treatment.treatment_content3
                                      )}
                                    </div>
                                  )}

                                  {/* 使用薬剤 */}
                                  {treatment.used_chemicals && (
                                    <div>
                                      使用薬剤: {treatment.used_chemicals}
                                    </div>
                                  )}

                                  {/* 液の時間 */}
                                  {treatment.solution1_time && (
                                    <div>
                                      液1時間: {treatment.solution1_time}
                                    </div>
                                  )}
                                  {treatment.solution2_time && (
                                    <div>
                                      液2時間: {treatment.solution2_time}
                                    </div>
                                  )}

                                  {/* カラー時間 */}
                                  {treatment.color_time1 && (
                                    <div>
                                      カラー時間1: {treatment.color_time1}
                                    </div>
                                  )}
                                  {treatment.color_time2 && (
                                    <div>
                                      カラー時間2: {treatment.color_time2}
                                    </div>
                                  )}

                                  {/* スタイルメモ */}
                                  {treatment.style_memo && (
                                    <div>
                                      スタイルメモ: {treatment.style_memo}
                                    </div>
                                  )}

                                  {/* その他の詳細 */}
                                  {treatment.other_details && (
                                    <div>
                                      その他詳細: {treatment.other_details}
                                    </div>
                                  )}

                                  {/* 料金情報 */}
                                  {treatment.treatment_fee && (
                                    <div>
                                      施術料金: ¥
                                      {treatment.treatment_fee.toLocaleString()}
                                    </div>
                                  )}
                                  {treatment.payment_method && (
                                    <div>
                                      支払い方法:{" "}
                                      {formatMasterDataValue(
                                        treatment.payment_method
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const copyData = {
                                      customer_id: customerId,
                                      treatment_date: treatment.treatment_date,
                                      treatment_time: treatment.treatment_time,
                                      stylist_name: treatment.stylist_name,
                                      treatment_content1:
                                        treatment.treatment_content1 || "",
                                      treatment_content2:
                                        treatment.treatment_content2 || "",
                                      treatment_content3:
                                        treatment.treatment_content3 || "",
                                      treatment_content4:
                                        treatment.treatment_content4 || "",
                                      treatment_content5:
                                        treatment.treatment_content5 || "",
                                      treatment_content6:
                                        treatment.treatment_content6 || "",
                                      treatment_content7:
                                        treatment.treatment_content7 || "",
                                      treatment_content8:
                                        treatment.treatment_content8 || "",
                                      style_memo: treatment.style_memo || "",
                                      used_chemicals:
                                        treatment.used_chemicals || "",
                                      solution1_time:
                                        treatment.solution1_time || "",
                                      solution2_time:
                                        treatment.solution2_time || "",
                                      color_time1: treatment.color_time1 || "",
                                      color_time2: treatment.color_time2 || "",
                                      other_details:
                                        treatment.other_details || "",
                                      retail_product1:
                                        treatment.retail_product1 || "",
                                      retail_product2:
                                        treatment.retail_product2 || "",
                                      retail_product3:
                                        treatment.retail_product3 || "",
                                      retail_product1_price:
                                        treatment.retail_product1_price || 0,
                                      retail_product2_price:
                                        treatment.retail_product2_price || 0,
                                      retail_product3_price:
                                        treatment.retail_product3_price || 0,
                                      retail_product1_quantity:
                                        treatment.retail_product1_quantity?.toString() ||
                                        "1",
                                      retail_product2_quantity:
                                        treatment.retail_product2_quantity?.toString() ||
                                        "1",
                                      retail_product3_quantity:
                                        treatment.retail_product3_quantity?.toString() ||
                                        "1",
                                      notes: treatment.notes || "",
                                      conversation_content:
                                        treatment.conversation_content || "",
                                    };

                                    // コピーデータをセッションストレージに保存
                                    sessionStorage.setItem(
                                      "copiedTreatmentData",
                                      JSON.stringify(copyData)
                                    );
                                    // 画面サイズに応じて適切なフォームを表示
                                    if (window.innerWidth >= 1280) {
                                      setIsTreatmentDialogOpen(true);
                                    } else {
                                      setIsWizardOpen(true);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Clipboard className="h-4 w-4 mr-2" />
                                  コピーして新規作成
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/customers/${customerId}/treatments/${treatment.id}`
                                    )
                                  }
                                >
                                  詳細・編集
                                </Button>
                                <TreatmentPhotoQRCode
                                  treatmentId={treatment.id}
                                  customerName={customer?.name || ""}
                                  treatmentDate={treatment.treatment_date || ""}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openDeleteDialog(treatment.id.toString())
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  削除
                                </Button>
                              </div>
                            </div>
                            {/* 販売商品セクション */}
                            {(treatment.retail_product1 ||
                              treatment.retail_product2 ||
                              treatment.retail_product3) && (
                              <div>
                                <h4 className="font-medium mb-2">販売商品</h4>
                                <div className="space-y-2 text-sm">
                                  {treatment.retail_product1 && (
                                    <div>
                                      {formatMasterDataValue(
                                        treatment.retail_product1
                                      )}
                                      {treatment.retail_product1_price && (
                                        <span className="ml-2 text-gray-600">
                                          ¥
                                          {treatment.retail_product1_price.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {treatment.retail_product2 && (
                                    <div>
                                      {formatMasterDataValue(
                                        treatment.retail_product2
                                      )}
                                      {treatment.retail_product2_price && (
                                        <span className="ml-2 text-gray-600">
                                          ¥
                                          {treatment.retail_product2_price.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {treatment.retail_product3 && (
                                    <div>
                                      {formatMasterDataValue(
                                        treatment.retail_product3
                                      )}
                                      {treatment.retail_product3_price && (
                                        <span className="ml-2 text-gray-600">
                                          ¥
                                          {treatment.retail_product3_price.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {treatment.retail_fee && (
                                    <div className="font-medium">
                                      販売合計: ¥
                                      {treatment.retail_fee.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 会話内容 */}
                            {treatment.conversation_content && (
                              <div>
                                <h4 className="font-medium mb-2">会話内容</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {treatment.conversation_content}
                                </p>
                              </div>
                            )}

                            {/* 次回予約 */}
                            {(treatment.next_appointment_date ||
                              treatment.next_appointment_time) && (
                              <div>
                                <h4 className="font-medium mb-2">次回予約</h4>
                                <div className="text-sm">
                                  {treatment.next_appointment_date && (
                                    <div>
                                      日付:{" "}
                                      {formatDate(
                                        treatment.next_appointment_date
                                      )}
                                    </div>
                                  )}
                                  {treatment.next_appointment_time && (
                                    <div>
                                      時間: {treatment.next_appointment_time}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {treatment.notes && (
                              <div>
                                <h4 className="font-medium mb-2">備考</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {treatment.notes}
                                </p>
                              </div>
                            )}
                            {treatment.treatment_images &&
                              treatment.treatment_images.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    画像 ({treatment.treatment_images.length}枚)
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {treatment.treatment_images
                                      .slice(0, 3)
                                      .map((image) => (
                                        <div
                                          key={image.id}
                                          className="bg-gray-100 rounded border overflow-hidden"
                                        >
                                          <div className="w-full h-20 flex items-center justify-center">
                                            <img
                                              src={
                                                image.image_url.startsWith(
                                                  "/api/files/"
                                                )
                                                  ? image.image_url
                                                  : `/api/files/${image.image_url}`
                                              }
                                              alt="施術画像"
                                              className="w-full h-full object-contain"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      施術履歴がありません
                    </h3>
                    <p className="text-gray-500 mb-4">
                      新しい施術を追加してください
                    </p>
                    <Button
                      onClick={() => {
                        // 画面サイズに応じて適切なフォームを表示
                        if (window.innerWidth >= 1280) {
                          setIsTreatmentDialogOpen(true);
                        } else {
                          setIsWizardOpen(true);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      施術追加
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>施術の削除</DialogTitle>
              <DialogDescription>
                この施術を削除しますか？この操作は取り消せません。
                関連する画像もすべて削除されます。
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTreatment}
                disabled={submitting}
              >
                {submitting ? "削除中..." : "削除"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* スマホ・タブレット用フルスクリーンウィザード表示 */}
        {isWizardOpen && (
          <div className="xl:hidden fixed inset-0 z-50 bg-white">
            <TreatmentWizardForm
              customerId={parseInt(customerId)}
              onSubmit={async (data) => {
                setSubmitting(true);
                try {
                  const response = await fetch("/api/treatments", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                  });

                  if (response.ok) {
                    const newTreatment = await response.json();

                    // 画像アップロード処理
                    if (selectedImages.length > 0) {
                      try {
                        await uploadTreatmentImages(newTreatment.id);
                        console.log("画像アップロード完了");
                      } catch (error) {
                        console.error("画像アップロードエラー:", error);
                        alert("画像のアップロードに失敗しました");
                      }
                    }

                    // データ再取得
                    await fetchCustomer();
                    setIsTreatmentDialogOpen(false);
                    setSelectedImages([]);
                    alert("施術を追加しました");
                  } else {
                    const error = await response.json();
                    alert(`追加に失敗しました: ${error.error}`);
                  }
                } catch (error) {
                  console.error("施術の追加に失敗しました:", error);
                  alert("追加エラーが発生しました");
                } finally {
                  setSubmitting(false);
                }
              }}
              onCancel={() => {
                setIsWizardOpen(false);
                setSelectedImages([]);
              }}
              submitting={submitting}
              submitLabel="追加"
              onImageSelect={setSelectedImages}
              selectedImages={selectedImages}
            />
          </div>
        )}
      </main>
    </div>
  );
}
