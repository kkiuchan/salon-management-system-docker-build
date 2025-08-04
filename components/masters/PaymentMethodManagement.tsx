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
import { PaymentMethod } from "@/types";
import { CreditCard, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentMethodManagement() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [editingPaymentMethod, setEditingPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [editPaymentMethodName, setEditPaymentMethodName] = useState("");
  const [editPaymentMethodActive, setEditPaymentMethodActive] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/masters/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error("支払い方法取得エラー:", error);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) return;

    try {
      const response = await fetch("/api/masters/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPaymentMethod }),
      });

      if (response.ok) {
        setNewPaymentMethod("");
        setDialogOpen(false);
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("支払い方法追加エラー:", error);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!editingPaymentMethod || !editPaymentMethodName.trim()) return;

    try {
      const response = await fetch(
        `/api/masters/payment-methods/${editingPaymentMethod.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editPaymentMethodName,
            is_active: editPaymentMethodActive,
          }),
        }
      );

      if (response.ok) {
        setEditingPaymentMethod(null);
        setEditPaymentMethodName("");
        setEditPaymentMethodActive(true);
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("支払い方法更新エラー:", error);
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    if (!confirm("この支払い方法を削除しますか？")) return;

    try {
      const response = await fetch(`/api/masters/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        alert(error.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("支払い方法削除エラー:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支払い方法一覧
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                支払い方法追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>支払い方法追加</DialogTitle>
                <DialogDescription>
                  新しい支払い方法を追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-method-name">支払い方法名</Label>
                  <Input
                    id="payment-method-name"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    placeholder="例: 現金、クレジットカード、電子マネー"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddPaymentMethod}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          支払い方法の追加・編集・削除を行います
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {paymentMethods.map((paymentMethod) => (
            <div
              key={paymentMethod.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{paymentMethod.name}</span>
                <Badge
                  variant={paymentMethod.is_active ? "default" : "secondary"}
                >
                  {paymentMethod.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPaymentMethod(paymentMethod);
                    setEditPaymentMethodName(paymentMethod.name);
                    setEditPaymentMethodActive(paymentMethod.is_active);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              支払い方法が登録されていません
            </div>
          )}
        </div>
      </CardContent>

      {/* 編集ダイアログ */}
      {editingPaymentMethod && (
        <Dialog
          open={!!editingPaymentMethod}
          onOpenChange={() => setEditingPaymentMethod(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>支払い方法編集</DialogTitle>
              <DialogDescription>
                支払い方法の情報を編集します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-payment-method-name">支払い方法名</Label>
                <Input
                  id="edit-payment-method-name"
                  value={editPaymentMethodName}
                  onChange={(e) => setEditPaymentMethodName(e.target.value)}
                  placeholder="支払い方法名を入力"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-payment-method-active"
                  checked={editPaymentMethodActive}
                  onChange={(e) => setEditPaymentMethodActive(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="edit-payment-method-active">アクティブ</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingPaymentMethod(null)}
              >
                キャンセル
              </Button>
              <Button onClick={handleUpdatePaymentMethod}>更新</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
