"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QRCodeDisplayProps {
  url: string;
  title?: string;
  description?: string;
}

export default function QRCodeDisplay({
  url,
  title = "モバイルアクセス",
  description = "QRコードをスキャンしてモバイルでアクセス",
}: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateQRCode = async () => {
      // URLが空の場合はQRコードを生成しない
      if (!url || url.trim() === "") {
        setQrCodeDataUrl("");
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error("QRコード生成エラー:", error);
        setQrCodeDataUrl("");
      }
    };

    generateQRCode();
  }, [url]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("URLコピーエラー:", error);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        {qrCodeDataUrl ? (
          <div className="flex justify-center">
            <div className="border-2 border-gray-200 rounded-lg p-2">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="border-2 border-gray-200 rounded-lg p-2 w-48 h-48 flex items-center justify-center bg-gray-50">
              <p className="text-sm text-gray-500 text-center">
                {url ? "QRコード生成中..." : "URLを取得中..."}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">URL:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 text-xs p-2 border border-gray-200 rounded bg-gray-50"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyUrl}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• QRコードをスマートフォンでスキャン</p>
          <p>• またはURLをコピーしてブラウザで開く</p>
          <p>• 同一ネットワーク内でアクセス可能</p>
        </div>
      </CardContent>
    </Card>
  );
}
