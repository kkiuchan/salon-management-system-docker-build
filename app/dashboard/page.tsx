"use client";

import CustomerForm from "@/components/CustomerForm";
import QRCodeDisplay from "@/components/QRCodeDisplay";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeDownload } from "@/lib/utils";
import { Customer, GENDER_OPTIONS } from "@/types";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Droplets,
  FileText,
  Mail,
  Percent,
  Phone,
  Plus,
  QrCode,
  Save,
  Scissors,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function DashboardPage() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [occupationFilter, setOccupationFilter] = useState<string>("all");
  const [referralSourceFilter, setReferralSourceFilter] =
    useState<string>("all");
  const [hasAllergiesFilter, setHasAllergiesFilter] = useState<string>("all");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  // デバウンス用の状態変数
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedPhoneFilter, setDebouncedPhoneFilter] = useState("");
  const [debouncedAddressFilter, setDebouncedAddressFilter] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ページネーション関連
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    furigana: "",
    name: "",
    gender: "",
    phone: "",
    emergency_contact: "",
    date_of_birth: "",
    age: "",
    occupation: "",
    postal_code: "",
    address: "",
    visiting_family: "",
    email: "",
    blood_type: "",
    allergies: "",
    medical_history: "",
    notes: "",
    referral_source1: "",
    referral_source2: "",
    referral_source3: "",
    referral_details: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // タブ管理の状態
  const [activeTab, setActiveTab] = useState<
    "customers" | "qrcode" | "backup" | "masters" | "sales"
  >("customers");

  // エクスポート関連
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [imageFormat, setImageFormat] = useState<"url" | "base64">("url");

  // 期間指定エクスポート関連
  const [periodicExporting, setPeriodicExporting] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<"month" | "year">("month");
  const [exportYear, setExportYear] = useState<number>(
    new Date().getFullYear()
  );
  const [exportMonth, setExportMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  // インポート関連

  // バックアップ・復元関連
  const [backupCreating, setBackupCreating] = useState(false);
  const [backupPath, setBackupPath] = useState<string>("");
  const [backupValidating, setBackupValidating] = useState(false);
  const [backupValidationResult, setBackupValidationResult] = useState<{
    valid: boolean;
    backup_info?: {
      created_at: string;
      version: string;
    };
    data_summary?: {
      customers: number;
      treatments: number;
      images: number;
    };
    backup_size?: number;
    error?: string;
  } | null>(null);

  // 売上レポート関連
  const [restoring, setRestoring] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"full" | "merge">("full");
  const [restoreIncludeImages, setRestoreIncludeImages] = useState(true);
  const [restoreIncludeMasters, setRestoreIncludeMasters] = useState(true);

  // QRコード関連の状態
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeData, setQRCodeData] = useState({
    url: "",
    title: "",
    description: "",
  });
  const [qrUrl, setQrUrl] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // 年齢計算用関数
  const calculateAge = (
    dateOfBirth: string | null,
    age: number | null
  ): number => {
    if (age !== null && age !== undefined) return age;
    if (!dateOfBirth) return 0;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  // QRコード印刷機能
  const handlePrintQR = (
    url: string,
    title: string,
    description: string = ""
  ) => {
    setQRCodeData({ url, title, description });
    setShowQRDialog(true);
  };

  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QRコード - ${qrCodeData.title}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .qr-container {
                text-align: center;
                max-width: 400px;
              }
              .qr-code {
                border: 20px solid white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                margin: 20px 0;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
              }
              .description {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
                line-height: 1.5;
              }
              .url {
                font-size: 12px;
                color: #999;
                word-break: break-all;
                margin-top: 20px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="title">${qrCodeData.title}</div>
              ${
                qrCodeData.description
                  ? `<div class="description">${qrCodeData.description}</div>`
                  : ""
              }
              <div class="qr-code">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <!-- QRコードは実際のライブラリで生成される -->
                </svg>
              </div>
              <div class="url">${qrCodeData.url}</div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // タブ切り替え
  const handleTabChange = (
    tab: "customers" | "qrcode" | "backup" | "masters" | "sales"
  ) => {
    setActiveTab(tab);
  };

  // 顧客データ取得
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setAllCustomers(data.customers || data);
      } else {
        console.error("顧客データの取得に失敗しました");
      }
    } catch (error) {
      console.error("顧客データの取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 新規顧客追加
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const customerData = {
        ...newCustomer,
        age: newCustomer.age ? parseInt(newCustomer.age) : undefined,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        await fetchCustomers();
        setIsAddDialogOpen(false);
        setNewCustomer({
          furigana: "",
          name: "",
          gender: "",
          phone: "",
          emergency_contact: "",
          date_of_birth: "",
          age: "",
          occupation: "",
          postal_code: "",
          address: "",
          visiting_family: "",
          email: "",
          blood_type: "",
          allergies: "",
          medical_history: "",
          notes: "",
          referral_source1: "",
          referral_source2: "",
          referral_source3: "",
          referral_details: "",
        });
        alert("顧客を追加しました");
      } else {
        const error = await response.json();
        alert(`追加に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("顧客の追加に失敗しました:", error);
      alert("追加エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 顧客削除
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("この顧客を削除しますか？この操作は取り消せません。")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCustomers();
        alert("顧客を削除しました");
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("顧客の削除に失敗しました:", error);
      alert("削除エラーが発生しました");
    }
  };

  // データエクスポート
  const handleExportData = async (customerId?: number) => {
    setExporting(true);
    try {
      let url = customerId
        ? `/api/export/customers?id=${customerId}`
        : "/api/export/customers";

      // 画像関連のパラメータを追加
      if (includeImages) {
        url += `&include_images=true&image_format=${imageFormat}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const filename = customerId
          ? `customer_${customerId}_data.csv`
          : "all_customers_data.csv";
        safeDownload(blob, filename);
      } else {
        alert("エクスポートに失敗しました");
      }
    } catch (error) {
      console.error("エクスポートエラー:", error);
      alert("エクスポートエラーが発生しました");
    } finally {
      setExporting(false);
    }
  };

  // 期間指定エクスポート
  const handlePeriodicExport = async () => {
    setPeriodicExporting(true);
    try {
      // 正しいAPIエンドポイントを使用
      const response = await fetch("/api/sales/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: `${exportYear}-${
            exportPeriod === "month"
              ? exportMonth.toString().padStart(2, "0")
              : "01"
          }-01`,
          endDate:
            exportPeriod === "month"
              ? `${exportYear}-${exportMonth
                  .toString()
                  .padStart(2, "0")}-${new Date(
                  exportYear,
                  exportMonth,
                  0
                ).getDate()}`
              : `${exportYear}-12-31`,
          format: "csv",
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename =
          exportPeriod === "month"
            ? `sales_report_${exportYear}_${exportMonth
                .toString()
                .padStart(2, "0")}.csv`
            : `sales_report_${exportYear}.csv`;
        safeDownload(blob, filename);
      } else {
        const errorText = await response.text();
        console.error("エクスポートエラーレスポンス:", errorText);
        alert(
          `エクスポートに失敗しました: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("期間指定エクスポートエラー:", error);
      alert(
        `期間指定エクスポートエラー: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setPeriodicExporting(false);
    }
  };

  // バックアップ作成
  const handleCreateBackup = async (
    format: "directory" | "zip" = "directory"
  ) => {
    setBackupCreating(true);
    try {
      const url = `/api/backup?format=${format}`;
      const response = await fetch(url);

      if (response.ok) {
        if (format === "zip") {
          // ZIPファイルとしてダウンロード
          const blob = await response.blob();
          const filename = `salon-backup-${
            new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
          }.zip`;
          safeDownload(blob, filename);
          alert("バックアップZIPファイルがダウンロードされました");
        } else {
          // ディレクトリパスを取得
          const result = await response.json();
          if (result.success) {
            setBackupPath(result.backup_path);
            alert(
              `バックアップが正常に作成されました\n保存場所: ${result.backup_path}`
            );
          } else {
            alert("バックアップの作成に失敗しました");
          }
        }
      } else {
        const error = await response.json();
        alert(`バックアップ作成エラー: ${error.error}`);
      }
    } catch (error) {
      console.error("バックアップ作成エラー:", error);
      alert("バックアップ作成エラーが発生しました");
    } finally {
      setBackupCreating(false);
    }
  };

  // バックアップ検証
  const handleValidateBackup = async () => {
    if (!backupPath) {
      alert("バックアップパスを入力してください");
      return;
    }

    setBackupValidating(true);
    try {
      const url = `/api/restore?backup_path=${encodeURIComponent(backupPath)}`;
      const response = await fetch(url);
      const result = await response.json();

      setBackupValidationResult(result);

      if (result.valid) {
        alert("バックアップディレクトリが正常に検証されました");
      } else {
        alert(`バックアップ検証エラー: ${result.error}`);
      }
    } catch (error) {
      console.error("バックアップ検証エラー:", error);
      alert("バックアップ検証エラーが発生しました");
    } finally {
      setBackupValidating(false);
    }
  };

  // バックアップ復元
  const handleRestoreBackup = async () => {
    if (!backupPath) {
      alert("バックアップパスを入力してください");
      return;
    }

    if (
      !confirm(
        `バックアップを復元しますか？\n復元モード: ${
          restoreMode === "full" ? "完全上書き" : "統合"
        }\nこの操作は取り消せません。`
      )
    ) {
      return;
    }

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append("backup_path", backupPath);
      formData.append("restore_mode", restoreMode);
      formData.append("include_images", restoreIncludeImages.toString());
      formData.append("include_masters", restoreIncludeMasters.toString());

      const response = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "バックアップの復元が完了しました。ページを再読み込みしてください。"
        );
        window.location.reload();
      } else {
        alert(
          `復元エラー: ${result.error || result.details || "不明なエラー"}`
        );
      }
    } catch (error) {
      console.error("復元エラー:", error);
      alert("復元エラーが発生しました");
    } finally {
      setRestoring(false);
    }
  };

  // フィルタリング・ソート
  useEffect(() => {
    let filtered = [...allCustomers];

    if (debouncedSearchTerm) {
      filtered = filtered.filter((customer) =>
        customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.gender === genderFilter
      );
    }

    if (minAge || maxAge) {
      filtered = filtered.filter((customer) => {
        const age = calculateAge(
          customer.date_of_birth || null,
          customer.age || null
        );
        const min = minAge ? parseInt(minAge) : 0;
        const max = maxAge ? parseInt(maxAge) : 200;
        return age >= min && age <= max;
      });
    }

    // 電話番号フィルター
    if (debouncedPhoneFilter) {
      filtered = filtered.filter(
        (customer) =>
          customer.phone && customer.phone.includes(debouncedPhoneFilter)
      );
    }

    // 職業フィルター
    if (occupationFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.occupation === occupationFilter
      );
    }

    // 来店きっかけフィルター
    if (referralSourceFilter !== "all") {
      filtered = filtered.filter(
        (customer) =>
          customer.referral_source1 === referralSourceFilter ||
          customer.referral_source2 === referralSourceFilter ||
          customer.referral_source3 === referralSourceFilter
      );
    }

    // アレルギー有無フィルター
    if (hasAllergiesFilter !== "all") {
      filtered = filtered.filter((customer) => {
        const hasAllergies =
          customer.allergies && customer.allergies.trim() !== "";
        return hasAllergiesFilter === "yes" ? hasAllergies : !hasAllergies;
      });
    }

    // 住所フィルター
    if (debouncedAddressFilter) {
      filtered = filtered.filter(
        (customer) =>
          customer.address &&
          customer.address
            .toLowerCase()
            .includes(debouncedAddressFilter.toLowerCase())
      );
    }

    // 登録日範囲フィルター
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter((customer) => {
        const createdDate = new Date(customer.created_at);
        const fromDate = dateFromFilter
          ? new Date(dateFromFilter)
          : new Date(0);
        const toDate = dateToFilter
          ? new Date(dateToFilter + "T23:59:59")
          : new Date();
        return createdDate >= fromDate && createdDate <= toDate;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name, "ja");
        case "name_desc":
          return b.name.localeCompare(a.name, "ja");
        case "age_asc":
          return (
            calculateAge(a.date_of_birth || null, a.age || null) -
            calculateAge(b.date_of_birth || null, b.age || null)
          );
        case "age_desc":
          return (
            calculateAge(b.date_of_birth || null, b.age || null) -
            calculateAge(a.date_of_birth || null, a.age || null)
          );
        case "phone_asc":
          return (a.phone || "").localeCompare(b.phone || "", "ja");
        case "phone_desc":
          return (b.phone || "").localeCompare(a.phone || "", "ja");
        case "occupation_asc":
          return (a.occupation || "").localeCompare(b.occupation || "", "ja");
        case "occupation_desc":
          return (b.occupation || "").localeCompare(a.occupation || "", "ja");
        case "referral_asc":
          return (a.referral_source1 || "").localeCompare(
            b.referral_source1 || "",
            "ja"
          );
        case "referral_desc":
          return (b.referral_source1 || "").localeCompare(
            a.referral_source1 || "",
            "ja"
          );
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "created_desc":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [
    allCustomers,
    debouncedSearchTerm,
    genderFilter,
    minAge,
    maxAge,
    debouncedPhoneFilter,
    occupationFilter,
    referralSourceFilter,
    hasAllergiesFilter,
    debouncedAddressFilter,
    dateFromFilter,
    dateToFilter,
    sortBy,
  ]);

  // ページネーション
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredCustomers.slice(startIndex, endIndex);
    setPaginatedCustomers(paginated);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    currentPage * itemsPerPage,
    filteredCustomers.length
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  // フィルターオプションを取得する関数
  const getUniqueValues = (field: keyof Customer) => {
    const values = allCustomers
      .map((customer) => customer[field])
      .filter((value) => value && value !== "")
      .map((value) => String(value))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return values;
  };

  const occupationOptions = getUniqueValues("occupation");
  const referralSourceOptions = [
    ...getUniqueValues("referral_source1"),
    ...getUniqueValues("referral_source2"),
    ...getUniqueValues("referral_source3"),
  ]
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  // ローカルIPからQR用URLを生成
  const fetchQrUrl = async () => {
    try {
      console.log("ネットワーク情報取得開始");
      const res = await fetch("/api/network-info");
      console.log("ネットワーク情報APIレスポンス:", {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      });

      if (!res.ok) {
        throw new Error(
          `ネットワーク情報の取得に失敗しました: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();
      console.log("ネットワーク情報データ:", data);

      const ip = data.localIp;
      if (!ip) {
        throw new Error(
          "IPアドレスが取得できませんでした。ネットワーク接続を確認してください。"
        );
      }

      const url = `http://${ip}:3000/customer-register`;
      console.log("QR用URL生成:", url);
      setQrUrl(url);
      setQrDialogOpen(true);
    } catch (error) {
      console.error("QR用URL生成エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      alert(`IPアドレスの取得に失敗しました: ${errorMessage}`);
      // エラー時はダイアログを開かない
    }
  };

  useEffect(() => {
    fetchCustomers();
    // ページ読み込み時のQR用URL取得を一時的に無効化
    // fetchQrUrl();
  }, []);

  // デバウンス処理
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (phoneTimeoutRef.current) {
      clearTimeout(phoneTimeoutRef.current);
    }
    phoneTimeoutRef.current = setTimeout(() => {
      setDebouncedPhoneFilter(phoneFilter);
    }, 300);

    return () => {
      if (phoneTimeoutRef.current) {
        clearTimeout(phoneTimeoutRef.current);
      }
    };
  }, [phoneFilter]);

  useEffect(() => {
    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }
    addressTimeoutRef.current = setTimeout(() => {
      setDebouncedAddressFilter(addressFilter);
    }, 300);

    return () => {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
    };
  }, [addressFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Karvio(カルビオ) 顧客管理
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* QRコードボタン追加 */}
              <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="hidden md:inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none"
                    onClick={() => {
                      if (qrUrl) {
                        setQrDialogOpen(true);
                      } else {
                        fetchQrUrl().catch(() => {
                          // エラー時はダイアログを開かない
                          console.log(
                            "QR用URL取得に失敗したため、ダイアログを開きません"
                          );
                        });
                      }
                    }}
                  >
                    <QrCode className="h-5 w-5 mr-1" />
                    顧客入力QR
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>顧客情報入力ページQRコード</DialogTitle>
                  </DialogHeader>
                  <QRCodeDisplay
                    url={qrUrl}
                    title="顧客情報入力ページ"
                    description="同一ネットワーク内のスマホ・タブレットで顧客情報を入力できます"
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange("customers")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "customers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">顧客管理</span>
            </button>
            <button
              onClick={() => handleTabChange("backup")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "backup"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Save className="h-4 w-4" />
              <span className="hidden md:inline">バックアップ・復元</span>
            </button>
            <button
              onClick={() => handleTabChange("masters")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "masters"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Database className="h-4 w-4" />
              <span className="hidden md:inline">マスターデータ</span>
            </button>
            <button
              onClick={() => handleTabChange("sales")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "sales"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">売上管理</span>
            </button>
          </nav>
        </div>

        {/* 顧客管理タブ */}
        {activeTab === "customers" && (
          <div>
            {/* 検索・フィルター */}
            <div className="md:bg-white md:rounded-lg md:shadow md:p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 hidden md:block">
                検索・フィルター
              </h3>

              {/* 基本フィルター */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="search" className="hidden md:block">
                    名前/ID検索
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 md:hidden" />
                    <Input
                      id="search"
                      placeholder="名前で検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="md:pl-3 pl-10"
                    />
                  </div>
                </div>
                <div className="hidden md:block">
                  <Label htmlFor="gender">性別</Label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全て</SelectItem>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="hidden md:block">
                  <Label htmlFor="minAge">最小年齢</Label>
                  <Input
                    id="minAge"
                    type="number"
                    placeholder="0"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                  />
                </div>
                <div className="hidden md:block">
                  <Label htmlFor="maxAge">最大年齢</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    placeholder="100"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                  />
                </div>
              </div>

              {/* 詳細フィルター */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="電話番号で検索"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">職業</Label>
                  <Select
                    value={occupationFilter}
                    onValueChange={setOccupationFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全て</SelectItem>
                      {occupationOptions.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>
                          {occupation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="referralSource">来店きっかけ</Label>
                  <Select
                    value={referralSourceFilter}
                    onValueChange={setReferralSourceFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全て</SelectItem>
                      {referralSourceOptions.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hasAllergies">アレルギー</Label>
                  <Select
                    value={hasAllergiesFilter}
                    onValueChange={setHasAllergiesFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全て</SelectItem>
                      <SelectItem value="yes">あり</SelectItem>
                      <SelectItem value="no">なし</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 追加フィルター */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="address">住所</Label>
                  <Input
                    id="address"
                    placeholder="住所で検索..."
                    value={addressFilter}
                    onChange={(e) => setAddressFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateFrom">登録日（開始）</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">登録日（終了）</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sortBy">ソート順</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_desc">
                        登録日（新しい順）
                      </SelectItem>
                      <SelectItem value="created_asc">
                        登録日（古い順）
                      </SelectItem>
                      <SelectItem value="name_asc">
                        名前（あいうえお順）
                      </SelectItem>
                      <SelectItem value="name_desc">名前（逆順）</SelectItem>
                      <SelectItem value="age_asc">年齢（若い順）</SelectItem>
                      <SelectItem value="age_desc">年齢（年上順）</SelectItem>
                      <SelectItem value="phone_asc">
                        電話番号（昇順）
                      </SelectItem>
                      <SelectItem value="phone_desc">
                        電話番号（降順）
                      </SelectItem>
                      <SelectItem value="blood_type_asc">
                        血液型（昇順）
                      </SelectItem>
                      <SelectItem value="blood_type_desc">
                        血液型（降順）
                      </SelectItem>
                      <SelectItem value="occupation_asc">
                        職業（昇順）
                      </SelectItem>
                      <SelectItem value="occupation_desc">
                        職業（降順）
                      </SelectItem>
                      <SelectItem value="referral_asc">
                        来店きっかけ（昇順）
                      </SelectItem>
                      <SelectItem value="referral_desc">
                        来店きっかけ（降順）
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* フィルターリセット */}
              <div className="hidden md:flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                    setGenderFilter("all");
                    setMinAge("");
                    setMaxAge("");
                    setPhoneFilter("");
                    setDebouncedPhoneFilter("");
                    setOccupationFilter("all");
                    setReferralSourceFilter("all");
                    setHasAllergiesFilter("all");
                    setAddressFilter("");
                    setDebouncedAddressFilter("");
                    setDateFromFilter("");
                    setDateToFilter("");
                    setSortBy("created_desc");
                  }}
                >
                  フィルターリセット
                </Button>
              </div>
            </div>

            {/* 結果表示 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  検索結果: {filteredCustomers.length}件 / 全
                  {allCustomers.length}件
                  {filteredCustomers.length !== allCustomers.length && (
                    <span className="ml-2 text-blue-600">
                      (フィルター適用中)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {startIndex}-{endIndex}件を表示
                </div>
              </div>
            </div>

            {/* 顧客一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="truncate">{customer.name}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer.id.toString());
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      ID: {customer.id} • {customer.gender} •{" "}
                      {calculateAge(
                        customer.date_of_birth || null,
                        customer.age || null
                      )}
                      歳{customer.occupation && ` • ${customer.occupation}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {customer.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.blood_type && (
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-gray-400" />
                          <span>血液型: {customer.blood_type}</span>
                        </div>
                      )}
                      {customer.allergies && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                          <span>アレルギー: {customer.allergies}</span>
                        </div>
                      )}
                      {customer.referral_source1 && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>来店きっかけ: {customer.referral_source1}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>登録日: {formatDate(customer.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-4">
                      <div className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* 新規顧客追加ボタン */}
            <div className="fixed bottom-6 right-6">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full shadow-lg">
                    <Plus className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[98vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>新規顧客追加</DialogTitle>
                    <DialogDescription>
                      新しい顧客の情報を入力してください。
                    </DialogDescription>
                  </DialogHeader>
                  <CustomerForm
                    onSubmit={async (data) => {
                      setSubmitting(true);
                      try {
                        const response = await fetch("/api/customers", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(data),
                        });

                        if (response.ok) {
                          await fetchCustomers();
                          setIsAddDialogOpen(false);
                          alert("顧客を追加しました");
                        } else {
                          const error = await response.json();
                          alert(`追加に失敗しました: ${error.error}`);
                        }
                      } catch (error) {
                        console.error("顧客の追加に失敗しました:", error);
                        alert("追加エラーが発生しました");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    onCancel={() => setIsAddDialogOpen(false)}
                    submitting={submitting}
                    submitLabel="追加"
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* バックアップ・復元タブ */}
        {activeTab === "backup" && (
          <div className="space-y-6">
            {/* バックアップ作成 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">バックアップ作成</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    バックアップ内容
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• SQLiteデータベースファイル（完全コピー）</li>
                    <li>• 施術画像ファイル（全画像）</li>
                    <li>• CSV形式のデータエクスポート</li>
                    <li>• メタデータファイル（バックアップ情報）</li>
                    <li>• 復元用READMEファイル</li>
                  </ul>
                </div>

                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  <Button
                    onClick={() => handleCreateBackup("directory")}
                    disabled={backupCreating}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {backupCreating ? "作成中..." : "ディレクトリ形式で作成"}
                  </Button>
                  <Button
                    onClick={() => handleCreateBackup("zip")}
                    disabled={backupCreating}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {backupCreating ? "作成中..." : "ZIPファイルでダウンロード"}
                  </Button>
                </div>

                {backupPath && (
                  <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                    <p className="font-medium">バックアップ作成完了</p>
                    <p className="text-xs mt-1">保存場所: {backupPath}</p>
                  </div>
                )}
              </div>
            </div>

            {/* バックアップ復元 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">バックアップ復元</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backupPath">
                    バックアップディレクトリパス
                  </Label>
                  <Input
                    id="backupPath"
                    placeholder="/path/to/backup/directory"
                    value={backupPath}
                    onChange={(e) => setBackupPath(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleValidateBackup}
                    disabled={!backupPath || backupValidating}
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {backupValidating ? "検証中..." : "バックアップ検証"}
                  </Button>
                </div>

                {backupValidationResult && (
                  <div
                    className={`p-3 rounded text-sm ${
                      backupValidationResult.valid
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    <p className="font-medium">
                      {backupValidationResult.valid ? "検証成功" : "検証失敗"}
                    </p>
                    {backupValidationResult.valid ? (
                      <div className="mt-2 text-xs">
                        <p>
                          作成日時:{" "}
                          {backupValidationResult.backup_info?.created_at}
                        </p>
                        <p>
                          顧客数:{" "}
                          {backupValidationResult.data_summary?.customers}
                        </p>
                        <p>
                          施術数:{" "}
                          {backupValidationResult.data_summary?.treatments}
                        </p>
                        <p>
                          画像数: {backupValidationResult.data_summary?.images}
                        </p>
                        <p>
                          バックアップサイズ:{" "}
                          {(
                            (backupValidationResult.backup_size || 0) /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1">{backupValidationResult.error}</p>
                    )}
                  </div>
                )}

                {backupValidationResult?.valid && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label htmlFor="restoreMode">復元モード</Label>
                      <Select
                        value={restoreMode}
                        onValueChange={(value: "full" | "merge") =>
                          setRestoreMode(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">
                            完全上書き（既存データを削除）
                          </SelectItem>
                          <SelectItem value="merge">
                            統合（既存データをバックアップ）
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="restoreIncludeImages"
                          checked={restoreIncludeImages}
                          onChange={(e) =>
                            setRestoreIncludeImages(e.target.checked)
                          }
                          className="rounded"
                        />
                        <Label htmlFor="restoreIncludeImages">
                          画像ファイルを復元
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="restoreIncludeMasters"
                          checked={restoreIncludeMasters}
                          onChange={(e) =>
                            setRestoreIncludeMasters(e.target.checked)
                          }
                          className="rounded"
                        />
                        <Label htmlFor="restoreIncludeMasters">
                          マスターデータを復元
                        </Label>
                      </div>
                    </div>

                    <Button
                      onClick={handleRestoreBackup}
                      disabled={restoring}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {restoring ? "復元中..." : "バックアップを復元"}
                    </Button>

                    <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                      <h4 className="font-medium mb-2">⚠️ 復元時の注意事項</h4>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • 復元前に現在のデータをバックアップしてください
                        </li>
                        <li>
                          • 完全上書きモードでは既存データが完全に削除されます
                        </li>
                        <li>
                          •
                          統合モードでは既存データベースが自動的にバックアップされます
                        </li>
                        <li>• 復元後はページが自動的に再読み込みされます</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* マスターデータ管理タブ */}
        {activeTab === "masters" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                マスターデータ管理
              </h2>
            </div>

            {/* マスターデータ管理カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/masters?tab=treatment-menus")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    施術メニュー管理
                  </CardTitle>
                  <CardDescription>
                    施術メニューの追加・編集・削除
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/masters?tab=retail-products")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    店販商品管理
                  </CardTitle>
                  <CardDescription>店販商品の追加・編集・削除</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/masters?tab=staff")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    スタッフ管理
                  </CardTitle>
                  <CardDescription>
                    スタッフ情報の追加・編集・削除
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/masters?tab=discount-types")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    割引種別管理
                  </CardTitle>
                  <CardDescription>割引種別の追加・編集・削除</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/masters?tab=payment-methods")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    支払い方法管理
                  </CardTitle>
                  <CardDescription>
                    支払い方法の追加・編集・削除
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/masters?tab=referral-sources")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    紹介元管理
                  </CardTitle>
                  <CardDescription>紹介元の追加・編集・削除</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

        {/* 売上管理タブ */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">売上管理</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/sales")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    売上ダッシュボード
                  </CardTitle>
                  <CardDescription>
                    日別・月別・年別の売上分析とレポート
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* データエクスポート機能 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">データエクスポート</h3>

              {/* エクスポートセクション */}
              <div className="mb-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customerSelect">
                      顧客を選択（個別エクスポート）
                    </Label>
                    <Select
                      value={selectedCustomerId?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedCustomerId(value ? parseInt(value) : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="顧客を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCustomers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 画像オプション */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeImages"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="includeImages">画像データを含める</Label>
                    </div>

                    {includeImages && (
                      <div className="ml-6">
                        <Label htmlFor="imageFormat">画像形式</Label>
                        <Select
                          value={imageFormat}
                          onValueChange={(value: "url" | "base64") =>
                            setImageFormat(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="url">URLのみ（軽量）</SelectItem>
                            <SelectItem value="base64">
                              Base64埋め込み（完全）
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          {imageFormat === "base64"
                            ? "画像がCSVに直接埋め込まれます（ファイルサイズ大）"
                            : "画像ファイルのパスのみ出力されます（ファイルサイズ小）"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                    <Button
                      onClick={() =>
                        handleExportData(selectedCustomerId || undefined)
                      }
                      disabled={!selectedCustomerId || exporting}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {exporting ? "エクスポート中..." : "選択顧客エクスポート"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 期間指定エクスポートセクション */}
              <div className="mb-8">
                <h4 className="text-md font-semibold mb-4">
                  期間指定エクスポート
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="exportPeriod">期間</Label>
                      <Select
                        value={exportPeriod}
                        onValueChange={(value: "month" | "year") =>
                          setExportPeriod(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">月毎</SelectItem>
                          <SelectItem value="year">年毎</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="exportYear">年</Label>
                      <Input
                        type="number"
                        value={exportYear}
                        onChange={(e) =>
                          setExportYear(
                            parseInt(e.target.value) || new Date().getFullYear()
                          )
                        }
                        min="2020"
                        max="2030"
                        className="mt-1"
                      />
                    </div>

                    {exportPeriod === "month" && (
                      <div>
                        <Label htmlFor="exportMonth">月</Label>
                        <Select
                          value={exportMonth.toString()}
                          onValueChange={(value) =>
                            setExportMonth(parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (month) => (
                                <SelectItem
                                  key={month}
                                  value={month.toString()}
                                >
                                  {month}月
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                    <Button
                      onClick={handlePeriodicExport}
                      disabled={periodicExporting}
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {periodicExporting
                        ? "エクスポート中..."
                        : `${
                            exportPeriod === "month"
                              ? `${exportYear}年${exportMonth}月`
                              : `${exportYear}年`
                          }のデータエクスポート`}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QRコード印刷ダイアログ
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QRコード印刷</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <QRCode value={qrCodeData.url} size={200} />
            <p className="mt-4 text-sm text-gray-600">{qrCodeData.url}</p>
            <Button onClick={printQRCode} className="mt-4">
              <Printer className="h-4 w-4 mr-2" />
              印刷
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
