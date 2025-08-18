"use client";

import TreatmentForm from "@/components/TreatmentForm";
import TreatmentPhotoQRCode from "@/components/TreatmentPhotoQRCode";
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
import {
  Customer,
  Treatment,
  TreatmentImage,
  TreatmentImageResponse,
  TreatmentInsert,
  TreatmentWithImages,
} from "@/types";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Clipboard,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  FlaskConical,
  MessageSquare,
  Scissors,
  ShoppingBag,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface TreatmentDetailPageProps {
  params: Promise<{
    id: string;
    treatmentId: string;
  }>;
}

export default function TreatmentDetailPage({
  params,
}: TreatmentDetailPageProps) {
  const router = useRouter();
  const [treatment, setTreatment] = useState<TreatmentWithImages | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // 編集関連の状態
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 表示モード関連の状態
  const [isCustomerView, setIsCustomerView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // paramsを非同期で取得
  const [treatmentId, setTreatmentId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTreatmentId(resolvedParams.treatmentId);
      setCustomerId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (treatmentId) {
      fetchTreatment();
    }
  }, [treatmentId]);

  const fetchTreatment = async () => {
    try {
      // 顧客データを取得
      const customerResponse = await fetch(`/api/customers/${customerId}`);
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomer(customerData);
      }

      // 施術データを直接取得
      const treatmentIdNum = parseInt(treatmentId);
      const response = await fetch(`/api/treatments/${treatmentIdNum}`);
      if (response.ok) {
        const treatmentData = await response.json();
        console.log("APIから取得した施術データ:", treatmentData);
        console.log(
          "画像データの数:",
          treatmentData.treatment_images?.length || 0
        );
        setTreatment(treatmentData);
        // 画像が変更されたら選択インデックスをリセット
        setSelectedImageIndex(0);
      } else {
        console.error("施術データの取得に失敗しました");
      }
    } catch (error) {
      console.error("施術データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  // 画像を圧縮する関数
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // ファイル形式チェック（より柔軟に）
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif", // iOS HEIC/HEIF 対応
      ];

      // ファイル拡張子からも判定
      const fileExtension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

      const isValidType =
        allowedTypes.includes(file.type) ||
        (fileExtension && allowedExtensions.includes(fileExtension));

      if (!isValidType) {
        alert(
          "JPEG、PNG、WebP、HEIC形式の画像ファイルをアップロードしてください"
        );
        return;
      }

      // 大きなファイルの場合は圧縮
      let processedFile = file;
      if (file.size > 5 * 1024 * 1024) {
        // 5MB以上の場合
        alert("画像を圧縮しています...");
        processedFile = await compressImage(file);
      }

      // 最終的なファイルサイズチェック（10MB）
      const maxSize = 10 * 1024 * 1024;
      if (processedFile.size > maxSize) {
        alert(
          "ファイルサイズが大きすぎます。別の画像を選択するか、画像を小さくしてください。"
        );
        return;
      }

      setSelectedFile(processedFile);

      // プレビュー画像を作成
      const url = URL.createObjectURL(processedFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error("ファイル処理エラー:", error);
      alert("画像の処理中にエラーが発生しました");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !customer || !treatment) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("treatmentId", treatmentId);
      formData.append("customerId", customerId);
      formData.append("customerName", customer.name);
      formData.append("treatmentDate", treatment.treatment_date);
      formData.append("files", selectedFile);

      const response = await fetch("/api/treatments/images", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.images && result.images.length > 0) {
          const newImage = result.images[0];
          setTreatment((prev) =>
            prev
              ? {
                  ...prev,
                  treatment_images: [
                    ...(prev.treatment_images || []),
                    newImage,
                  ],
                }
              : null
          );
        }

        // 状態をリセット
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const error = await response.json();
        alert(`アップロードに失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("画像のアップロードに失敗しました:", error);
      alert("アップロードエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const handleImageAdd = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 施術更新処理
  const handleUpdateTreatment = async (data: TreatmentInsert) => {
    if (!treatment) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/treatments/${treatment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedTreatment = await response.json();

        // 新規画像のアップロード処理
        if (selectedImages.length > 0) {
          try {
            await uploadTreatmentImages(treatment.id.toString());
            console.log("画像アップロード完了");
          } catch (error) {
            console.error("画像アップロードエラー:", error);
            alert("画像のアップロードに失敗しました");
          }
        }

        // データ再取得（画像情報を含む完全なデータを取得）
        await fetchTreatment();
        setIsEditing(false);
        setSelectedImages([]); // 選択された画像をリセット
        setSelectedImageIndex(0); // 画像選択インデックスをリセット
        alert("施術情報を更新しました");
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術の更新に失敗しました:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 施術削除処理
  const handleDeleteTreatment = async () => {
    if (!treatment) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/treatments/${treatment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("施術を削除しました");
        router.push(`/customers/${customerId}`);
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術の削除に失敗しました:", error);
      alert("削除エラーが発生しました");
    } finally {
      setSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 画像アップロード関数
  const uploadTreatmentImages = async (treatmentId: string) => {
    if (!customer || !treatment) {
      console.error("顧客データまたは施術データが不足しています");
      return [];
    }

    console.log("画像アップロード開始:", {
      treatmentId,
      imageCount: selectedImages.length,
    });
    const uploadedImages = [];

    for (const file of selectedImages) {
      try {
        console.log("画像アップロード中:", file.name, file.size, file.type);
        const formData = new FormData();
        formData.append("treatmentId", treatmentId);
        formData.append("customerId", customerId);
        formData.append("customerName", customer.name);
        formData.append("treatmentDate", treatment.treatment_date);
        formData.append("files", file);

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
          if (result.images && result.images.length > 0) {
            uploadedImages.push(...result.images);
          }
        } else {
          const errorData = await response.json();
          console.error(
            `画像 ${file.name} のアップロードに失敗しました: ${errorData.error}`
          );
        }
      } catch (error) {
        console.error(`画像 ${file.name} のアップロードエラー:`, error);
      }
    }

    console.log("画像アップロード完了:", uploadedImages.length, "枚");
    return uploadedImages;
  };

  // 画像削除処理
  const handleDeleteImage = async (imageId: number) => {
    if (confirm("この画像を削除しますか？この操作は取り消せません。")) {
      setDeletingImageId(imageId);
      try {
        const response = await fetch(
          `/api/treatments/${treatmentId}/images/${imageId.toString()}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setTreatment((prev) =>
            prev
              ? {
                  ...prev,
                  treatment_images:
                    prev.treatment_images?.filter(
                      (img) => img.id !== imageId
                    ) || [],
                }
              : null
          );
          // 画像が削除されたら選択インデックスをリセット
          setSelectedImageIndex(0);
        } else {
          const error = await response.json();
          alert(`削除に失敗しました: ${error.error}`);
        }
      } catch (error) {
        console.error("画像の削除に失敗しました:", error);
        alert("削除エラーが発生しました");
      } finally {
        setDeletingImageId(null);
      }
    }
  };

  // 画像クリック時のハンドラー
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageExpanded(true);
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

  // 画像URLを取得する関数
  const getImageUrl = (
    image: TreatmentImage | TreatmentImageResponse
  ): string => {
    // 新しいAPIレスポンス形式の場合
    if ("filename" in image && image.filename) {
      return `/api/files/${image.filename}`;
    }

    // 古い形式の場合
    if ("image_url" in image && image.image_url) {
      if (image.image_url.startsWith("/api/files/")) {
        return image.image_url;
      }
      return `/api/files/${image.image_url}`;
    }

    return "/placeholder-image.png";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">施術が見つかりません</h2>
          <Button onClick={() => router.push(`/customers/${customerId}`)}>
            顧客詳細に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push(`/customers/${customerId}`)}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">戻る</span>
              </Button>
              <h1 className="hidden md:block text-lg sm:text-xl font-bold text-gray-900">
                施術詳細
              </h1>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              {/* 表示モード切り替えボタン */}
              {!isEditing && (
                <Button
                  variant={isCustomerView ? "default" : "outline"}
                  onClick={() => setIsCustomerView(!isCustomerView)}
                  size="sm"
                  className="mr-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">
                    {isCustomerView ? "管理者表示" : "顧客表示"}
                  </span>
                </Button>
              )}

              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">編集</span>
                  </Button>

                  {/* コピーボタン */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const copyData = {
                        customer_id: customerId,
                        customer_name: treatment.customer_name || "",
                        treatment_date: treatment.treatment_date,
                        treatment_time: treatment.treatment_time,
                        treatment_end_time: treatment.treatment_end_time || "",
                        stylist_name: treatment.stylist_name,
                        treatment_content1: treatment.treatment_content1 || "",
                        treatment_content2: treatment.treatment_content2 || "",
                        treatment_content3: treatment.treatment_content3 || "",
                        treatment_content4: treatment.treatment_content4 || "",
                        treatment_content5: treatment.treatment_content5 || "",
                        treatment_content6: treatment.treatment_content6 || "",
                        treatment_content7: treatment.treatment_content7 || "",
                        treatment_content8: treatment.treatment_content8 || "",
                        treatment_content_other:
                          treatment.treatment_content_other || "",
                        style_memo: treatment.style_memo || "",
                        used_chemicals: treatment.used_chemicals || "",
                        solution1_time: treatment.solution1_time || "",
                        solution2_time: treatment.solution2_time || "",
                        color_time1: treatment.color_time1 || "",
                        color_time2: treatment.color_time2 || "",
                        other_details: treatment.other_details || "",
                        retail_product1: treatment.retail_product1 || "",
                        retail_product2: treatment.retail_product2 || "",
                        retail_product3: treatment.retail_product3 || "",
                        retail_product1_price:
                          treatment.retail_product1_price || 0,
                        retail_product2_price:
                          treatment.retail_product2_price || 0,
                        retail_product3_price:
                          treatment.retail_product3_price || 0,
                        retail_product1_quantity:
                          treatment.retail_product1_quantity?.toString() || "1",
                        retail_product2_quantity:
                          treatment.retail_product2_quantity?.toString() || "1",
                        retail_product3_quantity:
                          treatment.retail_product3_quantity?.toString() || "1",
                        retail_product_other:
                          treatment.retail_product_other || "",
                        notes: treatment.notes || "",
                        conversation_content:
                          treatment.conversation_content || "",
                        treatment_fee: treatment.treatment_fee || 0,
                        treatment_adjustment:
                          treatment.treatment_adjustment || 0,
                        treatment_discount_amount:
                          treatment.treatment_discount_amount || 0,
                        treatment_discount_type:
                          treatment.treatment_discount_type || "",
                        retail_fee: treatment.retail_fee || 0,
                        retail_adjustment: treatment.retail_adjustment || 0,
                        retail_discount_amount:
                          treatment.retail_discount_amount || 0,
                        retail_discount_type:
                          treatment.retail_discount_type || "",
                        total_amount: treatment.total_amount || 0,
                        payment_method: treatment.payment_method || "",
                        next_appointment_date:
                          treatment.next_appointment_date || "",
                        next_appointment_time:
                          treatment.next_appointment_time || "",
                      };

                      // コピーデータをセッションストレージに保存
                      sessionStorage.setItem(
                        "copiedTreatmentData",
                        JSON.stringify(copyData)
                      );

                      // 顧客詳細画面に遷移して新規作成ダイアログを開く
                      router.push(`/customers/${customerId}?newTreatment=true`);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">コピーして新規作成</span>
                  </Button>

                  {/* 写真追加QRコードボタン */}
                  <TreatmentPhotoQRCode
                    treatmentId={parseInt(treatmentId)}
                    customerName={
                      (treatment as Treatment & { customer_name?: string })
                        .customer_name || ""
                    }
                    treatmentDate={treatment.treatment_date || ""}
                  />

                  <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="hidden md:inline">削除</span>
                      </Button>
                    </DialogTrigger>
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
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteTreatment()}
                          disabled={submitting}
                        >
                          {submitting ? "削除中..." : "削除"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-10xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        <div className="space-y-6">
          {/* 施術情報 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  {isEditing
                    ? "施術情報を編集"
                    : formatMasterDataValue(treatment.treatment_content1) ||
                      "施術内容"}
                </CardTitle>
                {!isEditing && (
                  <CardDescription>
                    {formatDate(treatment.treatment_date)} の施術
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  // TreatmentFormコンポーネントを使用
                  <TreatmentForm
                    customerId={parseInt(customerId)}
                    initialData={treatment}
                    onSubmit={handleUpdateTreatment}
                    onCancel={() => {
                      setIsEditing(false);
                      setSelectedImages([]); // 選択された画像をリセット
                    }}
                    submitting={submitting}
                    submitLabel="更新"
                    onImageSelect={setSelectedImages}
                    selectedImages={selectedImages}
                  />
                ) : isCustomerView ? (
                  // 顧客向け表示モード - 3列横並びレイアウト
                  <div className="space-y-6">
                    {/* 情報パネル - 3列横並び */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* 施術内容 */}
                      {(treatment.treatment_content1 ||
                        treatment.treatment_content2 ||
                        treatment.treatment_content3) && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 h-fit">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-green-600" />
                            施術内容
                          </h3>
                          <div className="space-y-2">
                            {treatment.stylist_name && (
                              <div className="p-2 bg-blue-50 rounded text-sm text-blue-800 mb-3">
                                担当:{" "}
                                {formatMasterDataValue(treatment.stylist_name)}
                              </div>
                            )}
                            {treatment.treatment_content1 && (
                              <div className="p-2 bg-green-50 rounded text-sm text-green-800">
                                {formatMasterDataValue(
                                  treatment.treatment_content1
                                )}
                              </div>
                            )}
                            {treatment.treatment_content2 && (
                              <div className="p-2 bg-green-50 rounded text-sm text-green-800">
                                {formatMasterDataValue(
                                  treatment.treatment_content2
                                )}
                              </div>
                            )}
                            {treatment.treatment_content3 && (
                              <div className="p-2 bg-green-50 rounded text-sm text-green-800">
                                {formatMasterDataValue(
                                  treatment.treatment_content3
                                )}
                              </div>
                            )}
                            {treatment.treatment_content_other && (
                              <div className="p-2 bg-green-50 rounded text-sm text-green-800">
                                その他: {treatment.treatment_content_other}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 施術詳細 */}
                      {(treatment.used_chemicals ||
                        treatment.solution1_time ||
                        treatment.solution2_time ||
                        treatment.color_time1 ||
                        treatment.color_time2 ||
                        treatment.other_details) && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 h-fit">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-purple-600" />
                            施術詳細
                          </h3>
                          <div className="space-y-2 text-sm">
                            {treatment.used_chemicals && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  使用薬剤:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.used_chemicals}
                                </span>
                              </div>
                            )}
                            {treatment.solution1_time && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  ソリューション時間1:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.solution1_time}
                                </span>
                              </div>
                            )}
                            {treatment.solution2_time && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  ソリューション時間2:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.solution2_time}
                                </span>
                              </div>
                            )}
                            {treatment.color_time1 && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  カラー時間1:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.color_time1}
                                </span>
                              </div>
                            )}
                            {treatment.color_time2 && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  カラー時間2:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.color_time2}
                                </span>
                              </div>
                            )}
                            {treatment.other_details && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  その他詳細:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.other_details}
                                </span>
                              </div>
                            )}
                            {treatment.treatment_content_other && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  その他施術:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.treatment_content_other}
                                </span>
                              </div>
                            )}
                            {treatment.retail_product_other && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  その他商品:
                                </span>
                                <span className="text-gray-900">
                                  {treatment.retail_product_other}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 販売商品 */}
                      {(treatment.retail_product1 ||
                        treatment.retail_product2 ||
                        treatment.retail_product3) && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 h-fit">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-orange-600" />
                            販売商品
                          </h3>
                          <div className="space-y-2">
                            {treatment.retail_product1 && (
                              <div className="p-2 bg-orange-50 rounded text-sm text-orange-800 flex justify-between items-center">
                                <span>
                                  {formatMasterDataValue(
                                    treatment.retail_product1
                                  )}
                                </span>
                                {treatment.retail_product1_quantity &&
                                  treatment.retail_product1_quantity > 1 && (
                                    <span className="bg-orange-200 px-2 py-1 rounded text-xs font-medium">
                                      {treatment.retail_product1_quantity}個
                                    </span>
                                  )}
                              </div>
                            )}
                            {treatment.retail_product2 && (
                              <div className="p-2 bg-orange-50 rounded text-sm text-orange-800 flex justify-between items-center">
                                <span>
                                  {formatMasterDataValue(
                                    treatment.retail_product2
                                  )}
                                </span>
                                {treatment.retail_product2_quantity &&
                                  treatment.retail_product2_quantity > 1 && (
                                    <span className="bg-orange-200 px-2 py-1 rounded text-xs font-medium">
                                      {treatment.retail_product2_quantity}個
                                    </span>
                                  )}
                              </div>
                            )}
                            {treatment.retail_product3 && (
                              <div className="p-2 bg-orange-50 rounded text-sm text-orange-800 flex justify-between items-center">
                                <span>
                                  {formatMasterDataValue(
                                    treatment.retail_product3
                                  )}
                                </span>
                                {treatment.retail_product3_quantity &&
                                  treatment.retail_product3_quantity > 1 && (
                                    <span className="bg-orange-200 px-2 py-1 rounded text-xs font-medium">
                                      {treatment.retail_product3_quantity}個
                                    </span>
                                  )}
                              </div>
                            )}
                            {treatment.retail_product_other && (
                              <div className="p-2 bg-orange-50 rounded text-sm text-orange-800 flex justify-between items-center">
                                <span>
                                  その他: {treatment.retail_product_other}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 次回予約 */}
                      {(treatment.next_appointment_date ||
                        treatment.next_appointment_time) && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 h-fit">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-blue-600" />
                            次回予約
                          </h3>
                          <div className="text-center">
                            {treatment.next_appointment_date && (
                              <div className="text-lg font-semibold text-blue-600">
                                {formatDate(treatment.next_appointment_date)}
                              </div>
                            )}
                            {treatment.next_appointment_time && (
                              <div className="text-sm text-blue-700 mt-1">
                                {treatment.next_appointment_time}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // 管理者表示モード - 横並びレイアウト
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {/* 基本情報カード */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 h-fit">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        基本情報
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-md">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            スタイリスト:
                          </span>
                          <span className="text-sm">
                            {formatMasterDataValue(treatment.stylist_name)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-md">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">日付:</span>
                          <span className="text-sm">
                            {formatDate(treatment.treatment_date)}
                          </span>
                        </div>
                        {treatment.treatment_time && (
                          <div className="flex items-center gap-2 bg-white p-2 rounded-md">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              開始時間:
                            </span>
                            <span className="text-sm">
                              {treatment.treatment_time}
                            </span>
                          </div>
                        )}
                        {treatment.treatment_end_time && (
                          <div className="flex items-center gap-2 bg-white p-2 rounded-md">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              終了時間:
                            </span>
                            <span className="text-sm">
                              {treatment.treatment_end_time}
                            </span>
                          </div>
                        )}
                        {treatment.total_amount && (
                          <div className="flex items-center gap-2 bg-white p-2 rounded-md">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">料金:</span>
                            <span className="text-sm font-semibold text-green-600">
                              ¥{treatment.total_amount?.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 施術内容カード */}
                    {(treatment.treatment_content1 ||
                      treatment.treatment_content2 ||
                      treatment.treatment_content3) && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 h-fit">
                        <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <Scissors className="h-5 w-5" />
                          施術内容
                        </h3>
                        <div className="space-y-2">
                          {treatment.treatment_content1 && (
                            <div className="bg-white p-3 rounded-md border-l-4 border-green-500">
                              <span className="text-sm font-medium text-green-700">
                                メイン施術:
                              </span>
                              <span className="text-sm ml-2">
                                {formatMasterDataValue(
                                  treatment.treatment_content1
                                )}
                              </span>
                            </div>
                          )}
                          {treatment.treatment_content2 && (
                            <div className="bg-white p-3 rounded-md border-l-4 border-green-400">
                              <span className="text-sm font-medium text-green-700">
                                追加施術1:
                              </span>
                              <span className="text-sm ml-2">
                                {formatMasterDataValue(
                                  treatment.treatment_content2
                                )}
                              </span>
                            </div>
                          )}
                          {treatment.treatment_content3 && (
                            <div className="bg-white p-3 rounded-md border-l-4 border-green-300">
                              <span className="text-sm font-medium text-green-700">
                                追加施術2:
                              </span>
                              <span className="text-sm ml-2">
                                {formatMasterDataValue(
                                  treatment.treatment_content3
                                )}
                              </span>
                            </div>
                          )}
                          {treatment.treatment_content_other && (
                            <div className="bg-white p-3 rounded-md border-l-4 border-green-200">
                              <span className="text-sm font-medium text-green-700">
                                その他施術:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.treatment_content_other}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 施術詳細カード */}
                    {(treatment.used_chemicals ||
                      treatment.solution1_time ||
                      treatment.solution2_time ||
                      treatment.color_time1 ||
                      treatment.color_time2) && (
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200 h-fit">
                        <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <FlaskConical className="h-5 w-5" />
                          施術詳細
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {treatment.used_chemicals && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-purple-700">
                                使用薬剤:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.used_chemicals}
                              </span>
                            </div>
                          )}
                          {treatment.solution1_time && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-purple-700">
                                液1時間:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.solution1_time}
                              </span>
                            </div>
                          )}
                          {treatment.solution2_time && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-purple-700">
                                液2時間:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.solution2_time}
                              </span>
                            </div>
                          )}
                          {treatment.color_time1 && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-purple-700">
                                カラー時間1:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.color_time1}
                              </span>
                            </div>
                          )}
                          {treatment.color_time2 && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-purple-700">
                                カラー時間2:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.color_time2}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 販売商品カード */}
                    {(treatment.retail_product1 ||
                      treatment.retail_product2 ||
                      treatment.retail_product3) && (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200 h-fit">
                        <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5" />
                          販売商品
                        </h3>
                        <div className="space-y-2">
                          {treatment.retail_product1 && (
                            <div className="bg-white p-3 rounded-md flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {formatMasterDataValue(
                                    treatment.retail_product1
                                  )}
                                </span>
                                {treatment.retail_product1_quantity &&
                                  treatment.retail_product1_quantity > 1 && (
                                    <span className="text-xs bg-orange-200 px-2 py-1 rounded font-medium">
                                      {treatment.retail_product1_quantity}個
                                    </span>
                                  )}
                              </div>
                              {treatment.retail_product1_price && (
                                <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                  ¥
                                  {treatment.retail_product1_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                          {treatment.retail_product2 && (
                            <div className="bg-white p-3 rounded-md flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {formatMasterDataValue(
                                    treatment.retail_product2
                                  )}
                                </span>
                                {treatment.retail_product2_quantity &&
                                  treatment.retail_product2_quantity > 1 && (
                                    <span className="text-xs bg-orange-200 px-2 py-1 rounded font-medium">
                                      {treatment.retail_product2_quantity}個
                                    </span>
                                  )}
                              </div>
                              {treatment.retail_product2_price && (
                                <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                  ¥
                                  {treatment.retail_product2_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                          {treatment.retail_product3 && (
                            <div className="bg-white p-3 rounded-md flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {formatMasterDataValue(
                                    treatment.retail_product3
                                  )}
                                </span>
                                {treatment.retail_product3_quantity &&
                                  treatment.retail_product3_quantity > 1 && (
                                    <span className="text-xs bg-orange-200 px-2 py-1 rounded font-medium">
                                      {treatment.retail_product3_quantity}個
                                    </span>
                                  )}
                              </div>
                              {treatment.retail_product3_price && (
                                <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                  ¥
                                  {treatment.retail_product3_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                          {treatment.retail_product_other && (
                            <div className="bg-white p-3 rounded-md flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  その他: {treatment.retail_product_other}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 会話内容カード */}
                    {treatment.conversation_content && (
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200 h-fit">
                        <h3 className="text-lg font-semibold text-pink-900 mb-3 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          会話内容
                        </h3>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {treatment.conversation_content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 次回予約カード */}
                    {(treatment.next_appointment_date ||
                      treatment.next_appointment_time) && (
                      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg border border-cyan-200 h-fit">
                        <h3 className="text-lg font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                          <CalendarCheck className="h-5 w-5" />
                          次回予約
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {treatment.next_appointment_date && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-cyan-700">
                                日付:
                              </span>
                              <span className="text-sm ml-2">
                                {formatDate(treatment.next_appointment_date)}
                              </span>
                            </div>
                          )}
                          {treatment.next_appointment_time && (
                            <div className="bg-white p-3 rounded-md">
                              <span className="text-sm font-medium text-cyan-700">
                                時間:
                              </span>
                              <span className="text-sm ml-2">
                                {treatment.next_appointment_time}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 備考カード */}
                    {treatment.notes && (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200 h-fit">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          備考
                        </h3>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {treatment.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 画像アップロード - シンプル版（管理者表示のみ） */}
          {!isCustomerView && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    画像管理
                  </CardTitle>
                  <CardDescription>
                    施術の画像をアップロード・管理できます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* ファイル入力（非表示） */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* シンプルなアップロードボタン */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageAdd}
                      className="w-full h-12 text-base"
                      disabled={uploading}
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      画像を追加
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      JPEG、PNG、WebP、HEIC形式対応 / 最大10MBまで
                      <br />
                      大きな画像は自動的に圧縮されます
                    </p>

                    {/* プレビューとアップロード */}
                    {selectedFile && (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* プレビュー画像 */}
                          {previewUrl && (
                            <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center p-0.5">
                              <img
                                src={previewUrl}
                                alt="プレビュー"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          )}

                          {/* ファイル情報 */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          {/* アップロードボタン */}
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              onClick={handleUpload}
                              disabled={uploading}
                              className="flex-1 sm:flex-none"
                            >
                              {uploading ? "アップロード中..." : "アップロード"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl("");
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              disabled={uploading}
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* アップロード済み画像一覧 */}
        {
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  アップロード済み画像 (
                  {treatment.treatment_images?.length || 0}
                  枚)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {treatment.treatment_images &&
                treatment.treatment_images.length > 0 ? (
                  <div className="space-y-6">
                    {/* 拡大表示エリア */}
                    {isImageExpanded && treatment.treatment_images && (
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">画像詳細</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsImageExpanded(false)}
                          >
                            × 閉じる
                          </Button>
                        </div>

                        {/* メイン画像 */}
                        <div className="relative aspect-video bg-white rounded-lg overflow-hidden border mb-4">
                          <Image
                            src={getImageUrl(
                              treatment.treatment_images[selectedImageIndex]
                            )}
                            alt="施術画像"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 80vw"
                          />
                        </div>

                        {/* ナビゲーション */}
                        {treatment.treatment_images.length > 1 && (
                          <div className="flex justify-center items-center gap-4 mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedImageIndex((prev) =>
                                  prev > 0
                                    ? prev - 1
                                    : (treatment.treatment_images?.length ||
                                        1) - 1
                                )
                              }
                            >
                              ← 前の画像
                            </Button>
                            <span className="text-sm text-gray-600">
                              {selectedImageIndex + 1} /{" "}
                              {treatment.treatment_images.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedImageIndex((prev) =>
                                  prev <
                                  (treatment.treatment_images?.length || 1) - 1
                                    ? prev + 1
                                    : 0
                                )
                              }
                            >
                              次の画像 →
                            </Button>
                          </div>
                        )}

                        {/* 画像情報 */}
                        <div className="text-sm text-gray-600 text-center">
                          <p>
                            アップロード日時:{" "}
                            {formatDateTime(
                              treatment.treatment_images[selectedImageIndex]
                                .created_at
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* サムネイル一覧 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {treatment.treatment_images?.map((image, index) => {
                        const imageUrl = getImageUrl(image);
                        return (
                          <div key={image.id} className="group relative">
                            <div
                              className={`aspect-square relative overflow-hidden rounded-lg border bg-gray-100 cursor-pointer transition-all ${
                                isImageExpanded && index === selectedImageIndex
                                  ? "ring-2 ring-blue-500"
                                  : "hover:scale-105"
                              }`}
                              onClick={() => handleImageClick(index)}
                            >
                              <Image
                                src={imageUrl}
                                alt="施術画像"
                                fill
                                priority={index === 0}
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-contain transition-transform duration-200"
                              />
                            </div>
                            <div className="mt-2 space-y-2">
                              <div className="text-xs text-gray-500 text-center">
                                {formatDateTime(image.created_at)}
                              </div>
                              <div className="flex justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteImage(image.id)}
                                  disabled={deletingImageId === image.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {deletingImageId === image.id
                                    ? "削除中..."
                                    : "削除"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      画像がありません
                    </h3>
                    <p className="text-gray-500">
                      上記のフォームから画像をアップロードしてください
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        }
      </main>
    </div>
  );
}
