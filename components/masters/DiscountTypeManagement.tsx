"use client";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { DiscountType } from "@/types";
import { Edit, Percent, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function DiscountTypeManagement() {
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [newDiscountTypeName, setNewDiscountTypeName] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<
    "percentage" | "fixed"
  >("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [editingDiscountType, setEditingDiscountType] =
    useState<DiscountType | null>(null);
  const [editName, setEditName] = useState("");
  const [editDiscountType, setEditDiscountType] = useState<
    "percentage" | "fixed"
  >("percentage");
  const [editDiscountValue, setEditDiscountValue] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [discountTypeToDelete, setDiscountTypeToDelete] =
    useState<DiscountType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscountTypes = async () => {
    try {
      const response = await fetch("/api/masters/discount-types");
      if (response.ok) {
        const data = await response.json();
        setDiscountTypes(data);
      }
    } catch (error) {
      console.error("割引種別取得エラー:", error);
    }
  };

  useEffect(() => {
    fetchDiscountTypes();
  }, []);

  const handleAddDiscountType = async () => {
    if (!newDiscountTypeName.trim() || !newDiscountValue.trim()) return;

    const discountValue = parseInt(newDiscountValue);
    if (isNaN(discountValue) || discountValue < 0) {
      alert("割引値は0以上の数値で入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const requestBody = {
        name: newDiscountTypeName.trim(),
        discount_type: newDiscountType,
        discount_value: discountValue,
      };

      console.log("割引タイプ追加リクエスト:", requestBody);

      const response = await fetch("/api/masters/discount-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("割引タイプ追加レスポンス:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        await fetchDiscountTypes();
        setNewDiscountTypeName("");
        setNewDiscountType("percentage");
        setNewDiscountValue("");
        setIsAddDialogOpen(false);
        alert("割引種別を追加しました");
      } else {
        const errorText = await response.text();
        console.error("割引タイプ追加エラーレスポンス:", errorText);

        try {
          const error = JSON.parse(errorText);
          alert(`追加に失敗しました: ${error.error}`);
        } catch (parseError) {
          alert(
            `追加に失敗しました: ${response.status} ${response.statusText}\n\n詳細: ${errorText}`
          );
        }
      }
    } catch (error) {
      console.error("割引種別追加エラー:", error);
      alert(
        `追加エラー: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDiscountType = async () => {
    if (!editingDiscountType || !editName.trim() || !editDiscountValue.trim())
      return;

    const discountValue = parseInt(editDiscountValue);
    if (isNaN(discountValue) || discountValue < 0) {
      alert("割引値は0以上の数値で入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/discount-types/${editingDiscountType.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            discount_type: editDiscountType,
            discount_value: discountValue,
          }),
        }
      );

      if (response.ok) {
        await fetchDiscountTypes();
        setIsEditDialogOpen(false);
        setEditingDiscountType(null);
        setEditName("");
        setEditDiscountType("percentage");
        setEditDiscountValue("");
        alert("割引種別を更新しました");
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("割引種別更新エラー:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDiscountType = async () => {
    if (!discountTypeToDelete) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/discount-types/${discountTypeToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchDiscountTypes();
        setIsDeleteDialogOpen(false);
        setDiscountTypeToDelete(null);
        alert("割引種別を削除しました");
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("割引種別削除エラー:", error);
      alert("削除エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (discountType: DiscountType) => {
    setEditingDiscountType(discountType);
    setEditName(discountType.name);
    setEditDiscountType(discountType.discount_type);
    setEditDiscountValue(discountType.discount_value.toString());
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (discountType: DiscountType) => {
    setDiscountTypeToDelete(discountType);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            割引種別一覧
          </span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                割引種別追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>割引種別を追加</DialogTitle>
                <DialogDescription>
                  新しい割引種別を追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-discount-type-name">割引種別名 *</Label>
                  <Input
                    id="new-discount-type-name"
                    value={newDiscountTypeName}
                    onChange={(e) => setNewDiscountTypeName(e.target.value)}
                    placeholder="例: 会員割引"
                  />
                </div>
                <div>
                  <Label htmlFor="new-discount-type">割引タイプ *</Label>
                  <Select
                    value={newDiscountType}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setNewDiscountType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="割引タイプを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">割合（%）</SelectItem>
                      <SelectItem value="fixed">固定金額（円）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-discount-value">
                    {newDiscountType === "percentage"
                      ? "割引率（%）"
                      : "割引金額（円）"}{" "}
                    *
                  </Label>
                  <Input
                    id="new-discount-value"
                    type="number"
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    placeholder={
                      newDiscountType === "percentage" ? "例: 10" : "例: 1000"
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={submitting}
                >
                  キャンセル
                </Button>
                <Button onClick={handleAddDiscountType} disabled={submitting}>
                  {submitting ? "追加中..." : "追加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>割引種別の追加・編集・削除を行います</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {discountTypes.map((discountType) => (
            <div
              key={discountType.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-medium">{discountType.name}</span>
                  <div className="text-sm text-gray-500">
                    {discountType.discount_type === "percentage"
                      ? `${discountType.discount_value}%`
                      : `¥${discountType.discount_value.toLocaleString()}`}
                  </div>
                </div>
                <Badge
                  variant={discountType.is_active ? "default" : "secondary"}
                >
                  {discountType.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(discountType)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDeleteDialog(discountType)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {discountTypes.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              割引種別が登録されていません
            </div>
          )}
        </div>
      </CardContent>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>割引種別を編集</DialogTitle>
            <DialogDescription>割引種別情報を変更します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-discount-type-name">割引種別名 *</Label>
              <Input
                id="edit-discount-type-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例: 会員割引"
              />
            </div>
            <div>
              <Label htmlFor="edit-discount-type">割引タイプ *</Label>
              <Select
                value={editDiscountType}
                onValueChange={(value: "percentage" | "fixed") =>
                  setEditDiscountType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="割引タイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">割合（%）</SelectItem>
                  <SelectItem value="fixed">固定金額（円）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-discount-value">
                {editDiscountType === "percentage"
                  ? "割引率（%）"
                  : "割引金額（円）"}{" "}
                *
              </Label>
              <Input
                id="edit-discount-value"
                type="number"
                value={editDiscountValue}
                onChange={(e) => setEditDiscountValue(e.target.value)}
                placeholder={
                  editDiscountType === "percentage" ? "例: 10" : "例: 1000"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button onClick={handleUpdateDiscountType} disabled={submitting}>
              {submitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>割引種別を削除</DialogTitle>
            <DialogDescription>
              「{discountTypeToDelete?.name}」を削除しますか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDiscountType}
              disabled={submitting}
            >
              {submitting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
