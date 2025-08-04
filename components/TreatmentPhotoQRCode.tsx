"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import QRCodeDisplay from "./QRCodeDisplay";

interface TreatmentPhotoQRCodeProps {
  treatmentId: number;
  customerName: string;
  treatmentDate: string;
}

export default function TreatmentPhotoQRCode({
  treatmentId,
  customerName,
  treatmentDate,
}: TreatmentPhotoQRCodeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [localIp, setLocalIp] = useState<string>("");

  // ネットワーク情報を取得
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch("/api/network-info");
        if (response.ok) {
          const data = await response.json();
          // 正しいホストIPアドレス（localIp）を使用
          const hostIp = data.localIp || "localhost";
          setLocalIp(hostIp);        }
      } catch (error) {
        console.error("ネットワーク情報取得エラー:", error);
        // フォールバック: localhostを使用
        setLocalIp("localhost");
      }
    };

    fetchNetworkInfo();
  }, []);

  // QRコードのURLを生成
  const generateQRCodeUrl = () => {
    const port = window.location.port || "3000";
    // IPアドレスが取得できている場合はそれを使用、そうでなければlocalhost
    const baseUrl =
      localIp && localIp !== "localhost"
        ? `http://${localIp}:${port}`
        : `http://localhost:${port}`;
    const photoUrl = `${baseUrl}/treatment-photos/${treatmentId}`;
    setQrCodeUrl(photoUrl);
  };

  // ダイアログが開かれたときにQRコードを生成
  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    generateQRCodeUrl();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleDialogOpen}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden md:inline">写真追加QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            施術写真追加QRコード
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 施術情報 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">施術情報</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">お客様:</span> {customerName}
              </p>
              <p>
                <span className="text-gray-600">施術日:</span> {treatmentDate}
              </p>
            </div>
          </div>

          {/* QRコード表示 */}
          {qrCodeUrl && (
            <QRCodeDisplay
              url={qrCodeUrl}
              title="施術写真追加"
              description="QRコードをスキャンして施術の写真を追加"
            />
          )}

          {/* 使用方法 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">使用方法</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• QRコードをスマートフォンでスキャン</li>
              <li>• 施術の写真を撮影・選択</li>
              <li>• 写真をアップロード</li>
            </ul>
          </div>

          {/* ネットワーク情報 */}
          {localIp && localIp !== "localhost" && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                ネットワーク情報
              </h4>
              <p className="text-sm text-green-800">
                サーバーIP: <span className="font-mono">{localIp}</span>
              </p>
              <p className="text-xs text-green-700 mt-1">
                同一ネットワーク内のデバイスからアクセス可能
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
