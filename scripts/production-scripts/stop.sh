#!/bin/bash

# 美容室管理システム - ローカル本番停止スクリプト

set -e

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_info "美容室管理システムを停止します..."

# PIDファイルからプロセスIDを取得
if [ -f ".app.pid" ]; then
    APP_PID=$(cat .app.pid)
    log_info "プロセスID: $APP_PID"
    
    # プロセスが存在するかチェック
    if kill -0 $APP_PID 2>/dev/null; then
        log_info "プロセスを停止中..."
        kill $APP_PID
        
        # プロセスが停止するまで待機
        for i in {1..10}; do
            if ! kill -0 $APP_PID 2>/dev/null; then
                log_info "✅ プロセスが正常に停止しました"
                rm -f .app.pid
                exit 0
            fi
            sleep 1
        done
        
        # 強制終了
        log_warn "プロセスが停止しません。強制終了します..."
        kill -9 $APP_PID
        rm -f .app.pid
        log_info "✅ プロセスを強制終了しました"
    else
        log_warn "プロセスは既に停止しています"
        rm -f .app.pid
    fi
else
    # PIDファイルがない場合、プロセス名で検索
    log_info "PIDファイルが見つかりません。プロセス名で検索中..."
    
    PIDS=$(pgrep -f "node.*start" || true)
    if [ -n "$PIDS" ]; then
        log_info "見つかったプロセス: $PIDS"
        for pid in $PIDS; do
            log_info "プロセス $pid を停止中..."
            kill $pid
        done
        
        # プロセスが停止するまで待機
        sleep 3
        REMAINING_PIDS=$(pgrep -f "node.*start" || true)
        if [ -n "$REMAINING_PIDS" ]; then
            log_warn "強制終了が必要なプロセス: $REMAINING_PIDS"
            for pid in $REMAINING_PIDS; do
                kill -9 $pid
            done
        fi
        
        log_info "✅ すべてのプロセスを停止しました"
    else
        log_info "実行中のプロセスは見つかりませんでした"
    fi
fi

log_info "美容室管理システムの停止が完了しました" 