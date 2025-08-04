"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { TreatmentMenu } from "@/types";
import { Edit, Plus, Scissors, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function TreatmentMenuManagement() {
  const [menus, setMenus] = useState<TreatmentMenu[]>([]);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [editingMenu, setEditingMenu] = useState<TreatmentMenu | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<TreatmentMenu | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // カテゴリ一覧を取得
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    menus.forEach((menu) => {
      if (menu.category && menu.category.trim() !== "") {
        categorySet.add(menu.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [menus]);

  // カテゴリ別にメニューをグループ化
  const groupedMenus = useMemo(() => {
    const grouped: { [key: string]: TreatmentMenu[] } = {};

    menus.forEach((menu) => {
      const category = menu.category || "未分類";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(menu);
    });

    // 各カテゴリ内でメニューをソート
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [menus]);

  // フィルター適用後のカテゴリ
  const filteredCategories = useMemo(() => {
    if (categoryFilter === "all") {
      return Object.keys(groupedMenus).sort();
    }
    return Object.keys(groupedMenus).filter((cat) => cat === categoryFilter);
  }, [groupedMenus, categoryFilter]);

  const fetchMenus = async () => {
    try {
      const response = await fetch("/api/masters/treatment-menus");
      if (response.ok) {
        const data = await response.json();
        setMenus(data);
      }
    } catch (error) {
      console.error("施術メニュー取得エラー:", error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAddMenu = async () => {
    if (!newMenuName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/masters/treatment-menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMenuName.trim(),
          category: newMenuCategory.trim() || null,
          price: newMenuPrice ? parseInt(newMenuPrice) : null,
        }),
      });

      if (response.ok) {
        await fetchMenus();
        setNewMenuName("");
        setNewMenuCategory("");
        setNewMenuPrice("");
        setIsAddDialogOpen(false);
        alert("施術メニューを追加しました");
      } else {
        const error = await response.json();
        alert(`追加に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術メニュー追加エラー:", error);
      alert("追加エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu || !editName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/treatment-menus/${editingMenu.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            category: editCategory.trim() || null,
            price: editPrice ? parseInt(editPrice) : null,
            is_active: editingMenu.is_active, // 既存のis_active値を保持
          }),
        }
      );

      if (response.ok) {
        await fetchMenus();
        setIsEditDialogOpen(false);
        setEditingMenu(null);
        setEditName("");
        setEditCategory("");
        setEditPrice("");
        alert("施術メニューを更新しました");
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術メニュー更新エラー:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!menuToDelete) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/treatment-menus/${menuToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const result = await response.json();
        await fetchMenus();
        setIsDeleteDialogOpen(false);
        setMenuToDelete(null);

        // 使用中だった場合は警告メッセージを表示
        if (result.wasInUse) {
          alert(
            `施術メニュー「${result.deletedMenu}」を削除しました。\n\n注意: このメニューは${result.usageCount}件の施術で使用されていましたが、既存の施術データには影響しません。`
          );
        } else {
          alert(`施術メニュー「${result.deletedMenu}」を削除しました`);
        }
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術メニュー削除エラー:", error);
      alert("削除エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (menu: TreatmentMenu) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/masters/treatment-menus/${menu.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: menu.name,
          category: menu.category,
          price: menu.price,
          is_active: !menu.is_active,
        }),
      });

      if (response.ok) {
        await fetchMenus();
        alert(
          menu.is_active
            ? "施術メニューを無効化しました"
            : "施術メニューを有効化しました"
        );
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("施術メニュー更新エラー:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (menu: TreatmentMenu) => {
    setEditingMenu(menu);
    setEditName(menu.name);
    setEditCategory(menu.category || "");
    setEditPrice(menu.price?.toString() || "");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (menu: TreatmentMenu) => {
    setMenuToDelete(menu);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            施術メニュー一覧
          </span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                メニュー追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>施術メニューを追加</DialogTitle>
                <DialogDescription>
                  新しい施術メニューを追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-menu-name">メニュー名 *</Label>
                  <Input
                    id="new-menu-name"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="例: カット"
                  />
                </div>
                <div>
                  <Label htmlFor="new-menu-category">カテゴリ</Label>
                  <Select
                    value={
                      newMenuCategory === "" ? "no-category" : newMenuCategory
                    }
                    onValueChange={(value) =>
                      setNewMenuCategory(value === "no-category" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択または入力" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-category">カテゴリなし</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    placeholder="新しいカテゴリ名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="new-menu-price">料金（円）</Label>
                  <Input
                    id="new-menu-price"
                    type="number"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    placeholder="例: 3000"
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
                <Button onClick={handleAddMenu} disabled={submitting}>
                  {submitting ? "追加中..." : "追加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          施術メニューの追加・編集・削除を行います
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* カテゴリ別アコーディオン表示 */}
        <Accordion type="multiple" className="space-y-2">
          {filteredCategories.map((category) => {
            const activeMenus = groupedMenus[category].filter(
              (menu) => menu.is_active
            );
            const inactiveMenus = groupedMenus[category].filter(
              (menu) => !menu.is_active
            );

            return (
              <AccordionItem
                key={category}
                value={category}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Scissors className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold">{category}</span>
                      <Badge variant="outline" className="ml-2">
                        {activeMenus.length}件
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* アクティブメニュー */}
                  {activeMenus.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        アクティブ
                      </h4>
                      {activeMenus.map((menu) => (
                        <div
                          key={menu.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg space-y-2 sm:space-y-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-medium truncate">
                              {menu.name}
                            </span>
                            <Badge variant="default" className="flex-shrink-0">
                              ¥{menu.price?.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(menu)}
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <span className="hidden sm:inline">
                                非アクティブ
                              </span>
                              <span className="sm:hidden">無効</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(menu)}
                              className="p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(menu)}
                              className="p-1 sm:p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 非アクティブメニュー */}
                  {inactiveMenus.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        非アクティブ
                      </h4>
                      {inactiveMenus.map((menu) => (
                        <div
                          key={menu.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 sm:space-y-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-medium text-gray-600 truncate">
                              {menu.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="flex-shrink-0"
                            >
                              ¥{menu.price?.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(menu)}
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <span className="hidden sm:inline">
                                アクティブ
                              </span>
                              <span className="sm:hidden">有効</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(menu)}
                              className="p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(menu)}
                              className="p-1 sm:p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>施術メニューを編集</DialogTitle>
            <DialogDescription>メニュー情報を変更します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-menu-name">メニュー名 *</Label>
              <Input
                id="edit-menu-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例: カット"
              />
            </div>
            <div>
              <Label htmlFor="edit-menu-category">カテゴリ</Label>
              <Select
                value={editCategory === "" ? "no-category" : editCategory}
                onValueChange={(value) =>
                  setEditCategory(value === "no-category" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択または入力" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-category">カテゴリなし</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="新しいカテゴリ名を入力"
              />
            </div>
            <div>
              <Label htmlFor="edit-menu-price">料金（円）</Label>
              <Input
                id="edit-menu-price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="例: 3000"
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
            <Button onClick={handleUpdateMenu} disabled={submitting}>
              {submitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>施術メニューを削除</DialogTitle>
            <DialogDescription>
              「{menuToDelete?.name}」を削除しますか？
              <br />
              この操作は取り消せません。
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                注意:
                使用中のメニューでも削除できます。既存の施術データには影響しません。
              </span>
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
              onClick={handleDeleteMenu}
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
