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
    if (process.env.HOST_IP) {
      hostIP = process.env.HOST_IP;
    } else if (
      hostIP &&
      (hostIP.startsWith("172.") || hostIP.startsWith("10."))
    ) {
      // Docker環境の場合、ホストマシンのIPアドレスを推測
      try {
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execAsync = promisify(exec);

        // ホストマシンのIPアドレス取得を試行
        try {
          // Dockerホストのゲートウェイを取得
          const { stdout } = await execAsync(
            "ip route show default | awk '/default/ { print $3 }'"
          );
          const gatewayIP = stdout.trim();

          if (gatewayIP && gatewayIP !== "0.0.0.0") {
            console.log("Docker gateway IP:", gatewayIP);
            // 実際のホストネットワークインターフェースを確認
            try {
              const { stdout: hostNetworks } = await execAsync(
                "ip route | grep -E '^(192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.)' | head -1 | awk '{print $1}' | cut -d'/' -f1"
              );
              const potentialHostIP = hostNetworks.trim();
              if (potentialHostIP && potentialHostIP !== hostIP) {
                hostIP = potentialHostIP;
                console.log("Detected host IP:", hostIP);
              }
            } catch (error) {
              console.log(
                "Could not detect host network, keeping container IP"
              );
            }
          }
        } catch (error) {
          console.log("Host IP detection failed, using container IP");
        }
      } catch (error) {
        // exec が利用できない場合はそのまま
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
    });
  } catch (error) {
    console.error("ネットワーク情報取得エラー:", error);
    return NextResponse.json(
      { error: "ネットワーク情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
