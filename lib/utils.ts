import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 安全なファイルダウンロード処理
export const safeDownload = (blob: Blob, filename: string) => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  a.style.display = "none";
  a.style.position = "absolute";
  a.style.left = "-9999px";

  // 要素を追加してダウンロード実行
  document.body.appendChild(a);
  a.click();

  // 安全にクリーンアップ
  setTimeout(() => {
    try {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    } catch (e) {
      console.warn("要素の削除に失敗しました:", e);
    }
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
};
