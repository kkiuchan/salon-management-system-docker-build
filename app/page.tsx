import { redirect } from "next/navigation";

export default async function Home() {
  // 直接ダッシュボードにリダイレクト
  redirect("/dashboard");
}
