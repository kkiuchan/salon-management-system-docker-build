"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Camera, Check, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TreatmentPhotoPageProps {
  params: Promise<{
    treatmentId: string;
  }>;
}

interface TreatmentInfo {
  id: number;
  customer_id: number;
  customer_name: string;
  treatment_date: string;
  treatment_content1: string;
  stylist_name: string;
}

export default function TreatmentPhotoPage({
  params,
}: TreatmentPhotoPageProps) {
  const router = useRouter();
  const [treatmentId, setTreatmentId] = useState<string>("");
  const [treatmentInfo, setTreatmentInfo] = useState<TreatmentInfo | null>(
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // paramsを非同期で取得
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTreatmentId(resolvedParams.treatmentId);
    };
    getParams();
  }, [params]);

  // 施術情報を取得
  useEffect(() => {
    const fetchTreatmentInfo = async () => {
      try {
        const response = await fetch(`/api/treatments/${treatmentId}`);
        if (response.ok) {
          const data = await response.json();
          setTreatmentInfo(data);
        } else {
          setErrorMessage("施術情報の取得に失敗しました");
        }
      } catch (error) {
        console.error("施術情報取得エラー:", error);
        setErrorMessage("施術情報の取得に失敗しました");
      }
    };

    if (treatmentId) {
      fetchTreatmentInfo();
    }
  }, [treatmentId]);

  // ファイル選択処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      alert("画像ファイルのみ選択してください");
      return;
    }

    // ファイルサイズチェック（10MB以下）
    const validFiles = imageFiles.filter(
      (file) => file.size <= 10 * 1024 * 1024
    );
    if (validFiles.length !== imageFiles.length) {
      alert("ファイルサイズは10MB以下にしてください");
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // ファイル削除
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 画像圧縮処理
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // 最大サイズを設定（1920x1920）
        const maxWidth = 1920;
        const maxHeight = 1920;
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
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // 写真アップロード処理
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("写真を選択してください");
      return;
    }

    if (!treatmentInfo) {
      alert("施術情報が取得できませんでした");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("idle");

    try {
      // 画像を圧縮
      const compressedFiles = await Promise.all(
        selectedFiles.map((file) => compressImage(file))
      );

      // フォームデータを作成
      const formData = new FormData();
      formData.append("treatmentId", treatmentId);
      formData.append("customerId", treatmentInfo.customer_id.toString());
      formData.append("customerName", treatmentInfo.customer_name);
      formData.append("treatmentDate", treatmentInfo.treatment_date);

      compressedFiles.forEach((file, index) => {
        formData.append("files", file);
      });

      // アップロード実行
      const response = await fetch("/api/treatments/images", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadStatus("success");
        setSelectedFiles([]);
        setTimeout(() => {
          setUploadStatus("idle");
        }, 3000);
      } else {
        try {
          const error = await response.json();
          setErrorMessage(error.error || "アップロードに失敗しました");
        } catch (parseError) {
          console.error("JSONパースエラー:", parseError);
          setErrorMessage("アップロードに失敗しました");
        }
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("アップロードエラー:", error);
      setErrorMessage("アップロードに失敗しました");
      setUploadStatus("error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // カメラ撮影
  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // 背面カメラを使用
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setSelectedFiles((prev) => [...prev, target.files![0]]);
      }
    };
    input.click();
  };

  // 施術詳細に戻る
  const handleBackToTreatment = () => {
    if (treatmentInfo && treatmentInfo.customer_id) {
      router.push(
        `/customers/${treatmentInfo.customer_id}/treatments/${treatmentId}`
      );
    } else {
      router.back();
    }
  };

  if (!treatmentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            施術写真追加
          </h1>
          <p className="text-gray-600 text-sm">
            施術の様子を写真で記録してください
          </p>
        </div>

        {/* 施術情報カード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">施術情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                お客様名
              </Label>
              <p className="text-gray-900">{treatmentInfo.customer_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                施術日
              </Label>
              <p className="text-gray-900">{treatmentInfo.treatment_date}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                施術内容
              </Label>
              <p className="text-gray-900">
                {treatmentInfo.treatment_content1}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                担当者
              </Label>
              <p className="text-gray-900">{treatmentInfo.stylist_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* 写真選択エリア */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">写真を追加</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 写真選択ボタン */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-input")?.click()}
                className="h-12"
              >
                <Upload className="h-4 w-4 mr-2" />
                写真を選択
              </Button>
              <Button
                variant="outline"
                onClick={handleCameraCapture}
                className="h-12"
              >
                <Camera className="h-4 w-4 mr-2" />
                カメラ撮影
              </Button>
            </div>

            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 選択された写真のプレビュー */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  選択された写真 ({selectedFiles.length}枚)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <div className="w-full h-32 flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`写真 ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* アップロードボタン */}
        <Button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="w-full h-12 text-lg"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              アップロード中...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              写真をアップロード
            </>
          )}
        </Button>

        {/* ステータス表示 */}
        {uploadStatus === "success" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <Check className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-800">
              写真のアップロードが完了しました
            </span>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        )}

        {/* 戻るボタン */}
        <Button
          variant="outline"
          onClick={handleBackToTreatment}
          className="w-full mt-4"
        >
          施術詳細に戻る
        </Button>
      </div>
    </div>
  );
}
