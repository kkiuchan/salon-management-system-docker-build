import { NextResponse } from "next/server";
import os from "os";

// GET: ネットワーク情報の取得
export async function GET() {
  try {
    const networkInterfaces = os.networkInterfaces();
    const localIPs: string[] = [];

    // ローカルIPアドレスを取得
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        interfaces.forEach((interfaceInfo) => {
          if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
            localIPs.push(interfaceInfo.address);
          }
        });
      }
    });

    // ホストIPの決定
    let hostIP = localIPs.length > 0 ? localIPs[0] : null;

    // 環境変数でホストIPが指定されている場合はそれを使用
    if (process.env.HOST_IP && process.env.HOST_IP !== "auto") {
      hostIP = process.env.HOST_IP;
      console.log("Using HOST_IP from environment:", hostIP);
    } else if (
      hostIP &&
      (hostIP.startsWith("172.") || hostIP.startsWith("10."))
    ) {
      // Docker環境の場合、環境変数から正しいホストIPを取得
      console.log("Docker environment detected, container IP:", hostIP);

      // 環境変数から設定されたHOST_IPを使用（start-docker.shで設定）
      if (process.env.HOST_IP && process.env.HOST_IP !== "auto") {
        hostIP = process.env.HOST_IP;
        console.log("Using HOST_IP from start script:", hostIP);
      } else {
        // フォールバック: よく使われるプライベートIPレンジを推測
        console.log("No HOST_IP provided, keeping container IP as fallback");
      }
    }

    // IPアドレスの妥当性チェック
    if (hostIP) {
      const ipParts = hostIP.split(".");
      if (ipParts.length === 4) {
        // 無効なIPアドレス（.0で終わるネットワークアドレス等）をチェック
        if (ipParts[3] === "0" || ipParts[3] === "255") {
          console.log("Invalid IP detected, using fallback");
          hostIP = null;
        }
      }
    }

    return NextResponse.json({
      hostname: os.hostname(),
      localIPs,
      localIp: hostIP,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      isDocker:
        process.env.NODE_ENV === "production" && os.hostname().length === 12,
      hostIPSource: process.env.HOST_IP ? "environment" : "detected",
      environmentHostIP: process.env.HOST_IP || null,
    });
  } catch (error) {
    console.error("ネットワーク情報取得エラー:", error);
    return NextResponse.json(
      { error: "ネットワーク情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
