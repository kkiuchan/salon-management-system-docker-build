#!/bin/bash

echo "🔧 美容室管理システム - 権限修正ツール"
echo ""

# 現在の状況確認
echo "📋 現在の状況確認..."
echo "現在のユーザー: $(whoami)"
echo "現在のUID/GID: $(id)"
echo ""

# ディレクトリ存在確認
echo "📁 ディレクトリ確認..."
for dir in data logs data/uploads; do
    if [ -d "$dir" ]; then
        echo "✅ $dir: 存在"
        ls -la "$dir" | head -3
    else
        echo "❌ $dir: 存在しません"
        mkdir -p "$dir"
        echo "✅ $dir: 作成しました"
    fi
done
echo ""

# 権限修正
echo "🔧 権限修正を実行..."

# Method 1: sudo を使用
if command -v sudo >/dev/null 2>&1; then
    echo "Method 1: sudo を使用した権限設定"
    if sudo chown -R 1001:1001 data logs; then
        echo "✅ sudo での権限設定成功"
        sudo chmod -R 755 data logs
        echo "✅ chmod 完了"
    else
        echo "❌ sudo での権限設定失敗"
    fi
else
    echo "⚠️  sudo が利用できません"
fi

echo ""

# Method 2: 直接実行
echo "Method 2: 直接権限設定を試行"
if chown -R 1001:1001 data logs 2>/dev/null; then
    echo "✅ 直接権限設定成功"
    chmod -R 755 data logs 2>/dev/null
else
    echo "❌ 直接権限設定失敗（通常の動作）"
fi

echo ""

# 最終確認
echo "📊 最終確認..."
for dir in data logs; do
    if [ -d "$dir" ]; then
        echo "📁 $dir の権限:"
        ls -ld "$dir"
    fi
done

echo ""
echo "🏥 修正完了！"
echo "次に実行: ./start-docker.sh"