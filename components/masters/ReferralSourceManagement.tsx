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
import { ReferralSource } from "@/types";
import { Edit, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ReferralSourceManagement() {
  const [sources, setSources] = useState<ReferralSource[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [editingSource, setEditingSource] = useState<ReferralSource | null>(
    null
  );
  const [editSourceName, setEditSourceName] = useState("");
  const [editSourceActive, setEditSourceActive] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch("/api/masters/referral-sources");
      if (response.ok) {
        const data = await response.json();
        setSources(data);
      }
    } catch (error) {
      console.error("来店きっかけ取得エラー:", error);
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return;

    try {
      const response = await fetch("/api/masters/referral-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSourceName }),
      });

      if (response.ok) {
        setNewSourceName("");
        setDialogOpen(false);
        fetchSources();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("来店きっかけ追加エラー:", error);
    }
  };

  const handleUpdateSource = async () => {
    if (!editingSource || !editSourceName.trim()) return;

    try {
      const response = await fetch(
        `/api/masters/referral-sources/${editingSource.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editSourceName,
            is_active: editSourceActive,
          }),
        }
      );

      if (response.ok) {
        setEditingSource(null);
        setEditSourceName("");
        setEditSourceActive(true);
        fetchSources();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("来店きっかけ更新エラー:", error);
    }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm("この来店きっかけを削除しますか？")) return;

    try {
      const response = await fetch(`/api/masters/referral-sources/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSources();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("来店きっかけ削除エラー:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            来店きっかけ一覧
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                来店きっかけ追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>来店きっかけ追加</DialogTitle>
                <DialogDescription>
                  新しい来店きっかけを追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="source-name">来店きっかけ名</Label>
                  <Input
                    id="source-name"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="来店きっかけを入力"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddSource}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          来店きっかけの追加・編集・削除を行います
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{source.name}</span>
                <Badge variant={source.is_active ? "default" : "secondary"}>
                  {source.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingSource(source);
                    setEditSourceName(source.name);
                    setEditSourceActive(source.is_active);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteSource(source.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {sources.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              来店きっかけが登録されていません
            </div>
          )}
        </div>
      </CardContent>

      {/* 編集ダイアログ */}
      {editingSource && (
        <Dialog
          open={!!editingSource}
          onOpenChange={() => setEditingSource(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>来店きっかけ編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-source-name">来店きっかけ名</Label>
                <Input
                  id="edit-source-name"
                  value={editSourceName}
                  onChange={(e) => setEditSourceName(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-source-active"
                  checked={editSourceActive}
                  onChange={(e) => setEditSourceActive(e.target.checked)}
                />
                <Label htmlFor="edit-source-active">アクティブ</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSource(null)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdateSource}>更新</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
