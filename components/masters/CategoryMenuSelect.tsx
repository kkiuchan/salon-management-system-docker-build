"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RetailProduct, TreatmentMenu } from "@/types";
import { ChevronRight, Scissors, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface CategoryMenuSelectProps {
  value: string;
  onChange: (value: string) => void;
  type?: "treatment-menu" | "retail-product";
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function CategoryMenuSelect({
  value,
  onChange,
  type = "treatment-menu",
  placeholder,
  label,
  className = "",
}: CategoryMenuSelectProps) {
  const [menus, setMenus] = useState<TreatmentMenu[]>([]);
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // デフォルトのプレースホルダーとラベルを設定
  const defaultPlaceholder =
    type === "retail-product" ? "商品を選択" : "施術メニューを選択";
  const defaultLabel = type === "retail-product" ? "商品" : "施術メニュー";
  const finalPlaceholder = placeholder || defaultPlaceholder;
  const finalLabel = label || defaultLabel;

  // アイコンを取得
  const getIcon = () => {
    return type === "retail-product" ? (
      <ShoppingBag className="h-4 w-4" />
    ) : (
      <Scissors className="h-4 w-4" />
    );
  };

  // カテゴリ一覧を取得
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    const items = type === "retail-product" ? products : menus;

    items.forEach((item) => {
      if (item.category && item.category.trim() !== "" && item.is_active) {
        categorySet.add(item.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [menus, products, type]);

  // カテゴリ別にアイテムをグループ化
  const groupedItems = useMemo(() => {
    const items = type === "retail-product" ? products : menus;
    const grouped: { [key: string]: (TreatmentMenu | RetailProduct)[] } = {};

    items.forEach((item) => {
      if (!item.is_active) return;

      const category = item.category || "その他";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // 各カテゴリ内でアイテムをソート
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [menus, products, type]);

  // フィルター適用後のアイテム（カテゴリ選択のみ）
  const filteredItems = useMemo(() => {
    if (!selectedCategory) {
      return groupedItems;
    }

    const filtered: { [key: string]: (TreatmentMenu | RetailProduct)[] } = {};
    if (groupedItems[selectedCategory]) {
      filtered[selectedCategory] = groupedItems[selectedCategory];
    }

    return filtered;
  }, [groupedItems, selectedCategory]);

  // 選択されたアイテムの情報
  const selectedItem = useMemo(() => {
    const items = type === "retail-product" ? products : menus;
    return items.find((item) => item.name === value);
  }, [menus, products, value, type]);

  // ID部分を除去して表示名を取得
  const getDisplayName = (name: string) => {
    // "-数字" のパターンを除去
    return name.replace(/-\d+$/, "");
  };

  const fetchData = async () => {
    try {
      const endpoint =
        type === "retail-product"
          ? "/api/masters/retail-products"
          : "/api/masters/treatment-menus";
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (type === "retail-product") {
          setProducts(data);
        } else {
          setMenus(data);
        }
      }
    } catch (error) {
      console.error(
        `${type === "retail-product" ? "商品" : "施術メニュー"}取得エラー:`,
        error
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const handleItemSelect = (itemName: string) => {
    onChange(itemName);
    setIsDialogOpen(false);
    setSelectedCategory("");
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsDialogOpen(true)}
          >
            <div className="flex items-center gap-2">
              {getIcon()}
              <span
                className={value ? "text-foreground" : "text-muted-foreground"}
              >
                {value ? getDisplayName(value) : finalPlaceholder}
              </span>
            </div>
            {selectedItem && selectedItem.price && (
              <Badge variant="secondary" className="ml-2">
                ¥{selectedItem.price.toLocaleString()}
              </Badge>
            )}
            {selectedItem && !selectedItem.price && (
              <Badge variant="outline" className="ml-2 text-gray-500">
                未設定
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{finalLabel}を選択</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0">
            {/* カテゴリ選択 */}
            <div className="mb-4 flex-shrink-0">
              <Label className="text-sm font-medium mb-2 block">カテゴリ</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                >
                  すべて
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* アイテム一覧 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {Object.keys(filteredItems).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {`${
                    type === "retail-product" ? "商品" : "メニュー"
                  }がありません`}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(filteredItems)
                    .filter(
                      (category) =>
                        !selectedCategory || category === selectedCategory
                    )
                    .map((category) => (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getIcon()}
                            {category}
                            <Badge variant="outline" className="ml-auto">
                              {filteredItems[category].length}件
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 gap-2">
                            {filteredItems[category].map((item) => (
                              <Button
                                key={item.id}
                                variant="ghost"
                                className="justify-between h-auto p-3"
                                onClick={() => handleItemSelect(item.name)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {getDisplayName(item.name)}
                                  </span>
                                  {item.price ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      ¥{item.price.toLocaleString()}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500"
                                    >
                                      未設定
                                    </Badge>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
