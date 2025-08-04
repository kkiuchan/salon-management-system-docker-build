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
import { Staff } from "@/types";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffActive, setEditStaffActive] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/masters/staff");
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error("スタッフ取得エラー:", error);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim()) return;

    try {
      const response = await fetch("/api/masters/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStaffName }),
      });

      if (response.ok) {
        setNewStaffName("");
        setDialogOpen(false);
        fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("スタッフ追加エラー:", error);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !editStaffName.trim()) return;

    try {
      const response = await fetch(`/api/masters/staff/${editingStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editStaffName,
          is_active: editStaffActive,
        }),
      });

      if (response.ok) {
        setEditingStaff(null);
        setEditStaffName("");
        setEditStaffActive(true);
        fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("スタッフ更新エラー:", error);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("このスタッフを削除しますか？")) return;

    try {
      const response = await fetch(`/api/masters/staff/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchStaff();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("スタッフ削除エラー:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            スタッフ一覧
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                スタッフ追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>スタッフ追加</DialogTitle>
                <DialogDescription>
                  新しいスタッフを追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staff-name">スタッフ名</Label>
                  <Input
                    id="staff-name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="スタッフ名を入力"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddStaff}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>スタッフの追加・編集・削除を行います</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{member.name}</span>
                <Badge variant={member.is_active ? "default" : "secondary"}>
                  {member.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingStaff(member);
                    setEditStaffName(member.name);
                    setEditStaffActive(member.is_active);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteStaff(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              スタッフが登録されていません
            </div>
          )}
        </div>
      </CardContent>

      {/* 編集ダイアログ */}
      {editingStaff && (
        <Dialog
          open={!!editingStaff}
          onOpenChange={() => setEditingStaff(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>スタッフ編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-staff-name">スタッフ名</Label>
                <Input
                  id="edit-staff-name"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-staff-active"
                  checked={editStaffActive}
                  onChange={(e) => setEditStaffActive(e.target.checked)}
                />
                <Label htmlFor="edit-staff-active">アクティブ</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStaff(null)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdateStaff}>更新</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
