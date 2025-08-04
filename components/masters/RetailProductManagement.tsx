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
import { RetailProduct } from "@/types";
import { Edit, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function RetailProductManagement() {
  const [retailProducts, setRetailProducts] = useState<RetailProduct[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [editingProduct, setEditingProduct] = useState<RetailProduct | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<RetailProduct | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // カテゴリ一覧を取得
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    retailProducts.forEach((product) => {
      if (product.category && product.category.trim() !== "") {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [retailProducts]);

  // カテゴリ別に商品をグループ化
  const groupedProducts = useMemo(() => {
    const grouped: { [key: string]: RetailProduct[] } = {};

    retailProducts.forEach((product) => {
      const category = product.category || "未分類";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });

    // 各カテゴリ内で商品をソート
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [retailProducts]);

  // フィルター適用後のカテゴリ
  const filteredCategories = useMemo(() => {
    if (categoryFilter === "all") {
      return Object.keys(groupedProducts).sort();
    }
    return Object.keys(groupedProducts).filter((cat) => cat === categoryFilter);
  }, [groupedProducts, categoryFilter]);

  const fetchRetailProducts = async () => {
    try {
      const response = await fetch("/api/masters/retail-products");
      if (response.ok) {
        const data = await response.json();
        setRetailProducts(data);
      }
    } catch (error) {
      console.error("店頭販売商品取得エラー:", error);
    }
  };

  useEffect(() => {
    fetchRetailProducts();
  }, []);

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/masters/retail-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProductName.trim(),
          category: newProductCategory.trim() || null,
          price: newProductPrice ? parseInt(newProductPrice) : null,
        }),
      });

      if (response.ok) {
        await fetchRetailProducts();
        setNewProductName("");
        setNewProductCategory("");
        setNewProductPrice("");
        setIsAddDialogOpen(false);
        alert("店頭販売商品を追加しました");
      } else {
        const error = await response.json();
        alert(`追加に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("店頭販売商品追加エラー:", error);
      alert("追加エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !editName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/retail-products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            category: editCategory.trim() || null,
            price: editPrice ? parseInt(editPrice) : null,
          }),
        }
      );

      if (response.ok) {
        await fetchRetailProducts();
        setEditingProduct(null);
        setEditName("");
        setEditCategory("");
        setEditPrice("");
        setIsEditDialogOpen(false);
        alert("店頭販売商品を更新しました");
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("店頭販売商品更新エラー:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/retail-products/${productToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchRetailProducts();
        setProductToDelete(null);
        setIsDeleteDialogOpen(false);
        alert("店頭販売商品を削除しました");
      } else {
        const error = await response.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("店頭販売商品削除エラー:", error);
      alert("削除エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product: RetailProduct) => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/masters/retail-products/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: product.name,
            category: product.category,
            price: product.price,
            is_active: !product.is_active,
          }),
        }
      );

      if (response.ok) {
        await fetchRetailProducts();
        alert(`商品を${product.is_active ? "無効化" : "有効化"}しました`);
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error("商品状態更新エラー:", error);
      alert("更新エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (product: RetailProduct) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category || "");
    setEditPrice(product.price?.toString() || "");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: RetailProduct) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            店頭販売商品一覧
          </span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                商品追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>店頭販売商品を追加</DialogTitle>
                <DialogDescription>
                  新しい店頭販売商品を追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-product-name">商品名 *</Label>
                  <Input
                    id="new-product-name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="例: シャンプー"
                  />
                </div>
                <div>
                  <Label htmlFor="new-product-category">カテゴリ</Label>
                  <Select
                    value={
                      newProductCategory === ""
                        ? "no-category"
                        : newProductCategory
                    }
                    onValueChange={(value) =>
                      setNewProductCategory(
                        value === "no-category" ? "" : value
                      )
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
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    placeholder="新しいカテゴリ名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="new-product-price">価格（円）</Label>
                  <Input
                    id="new-product-price"
                    type="number"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="例: 2000"
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
                <Button onClick={handleAddProduct} disabled={submitting}>
                  {submitting ? "追加中..." : "追加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          店頭販売商品の追加・編集・削除を行います
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* カテゴリ別アコーディオン表示 */}
        <Accordion type="multiple" className="space-y-2">
          {filteredCategories.map((category) => {
            const activeProducts = groupedProducts[category].filter(
              (product) => product.is_active
            );
            const inactiveProducts = groupedProducts[category].filter(
              (product) => !product.is_active
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
                      <Package className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">{category}</span>
                      <Badge variant="outline" className="ml-2">
                        {activeProducts.length}件
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* アクティブ商品 */}
                  {activeProducts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        アクティブ
                      </h4>
                      {activeProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg space-y-2 sm:space-y-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-medium truncate">
                              {product.name}
                            </span>
                            <Badge variant="default" className="flex-shrink-0">
                              ¥{product.price?.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(product)}
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
                              onClick={() => openEditDialog(product)}
                              className="p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(product)}
                              className="p-1 sm:p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 非アクティブ商品 */}
                  {inactiveProducts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        非アクティブ
                      </h4>
                      {inactiveProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 sm:space-y-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-medium text-gray-600 truncate">
                              {product.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="flex-shrink-0"
                            >
                              ¥{product.price?.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(product)}
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
                              onClick={() => openEditDialog(product)}
                              className="p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(product)}
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
            <DialogTitle>店頭販売商品を編集</DialogTitle>
            <DialogDescription>商品情報を変更します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-product-name">商品名 *</Label>
              <Input
                id="edit-product-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例: シャンプー"
              />
            </div>
            <div>
              <Label htmlFor="edit-product-category">カテゴリ</Label>
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
              <Label htmlFor="edit-product-price">価格（円）</Label>
              <Input
                id="edit-product-price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="例: 2000"
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
            <Button onClick={handleUpdateProduct} disabled={submitting}>
              {submitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>店頭販売商品を削除</DialogTitle>
            <DialogDescription>
              「{productToDelete?.name}」を削除しますか？
              <br />
              この操作は取り消せません。
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                注意:
                使用中の商品でも削除できます。既存の施術データには影響しません。
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
              onClick={handleDeleteProduct}
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
