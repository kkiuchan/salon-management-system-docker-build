@echo off
setlocal enabledelayedexpansion

REM 美容室管理システム - Windows ローカル本番停止スクリプト

REM プロジェクトルートに移動
cd /d "%~dp0..\.."

echo [INFO] 美容室管理システムを停止します...

REM PIDファイルからプロセスIDを取得
if exist ".app.pid" (
    set /p APP_PID=<.app.pid
    echo [INFO] プロセスID: !APP_PID!
    
    REM プロセスが存在するかチェック
    tasklist /FI "PID eq !APP_PID!" 2>NUL | find /I /N "node.exe">NUL
    if "%ERRORLEVEL%"=="0" (
        echo [INFO] プロセスを停止中...
        taskkill /PID !APP_PID! /F >nul 2>&1
        
        REM プロセスが停止するまで待機
        for /l %%i in (1,1,10) do (
            tasklist /FI "PID eq !APP_PID!" 2>NUL | find /I /N "node.exe">NUL
            if not "%ERRORLEVEL%"=="0" (
                echo [INFO] ✅ プロセスが正常に停止しました
                del .app.pid
                goto :end
            )
            timeout /t 1 /nobreak >nul
        )
        
        REM 強制終了
        echo [WARN] プロセスが停止しません。強制終了します...
        taskkill /PID !APP_PID! /F >nul 2>&1
        del .app.pid
        echo [INFO] ✅ プロセスを強制終了しました
    ) else (
        echo [WARN] プロセスは既に停止しています
        del .app.pid
    )
) else (
    REM PIDファイルがない場合、プロセス名で検索
    echo [INFO] PIDファイルが見つかりません。プロセス名で検索中...
    
    tasklist /FI "IMAGENAME eq node.exe" /FO CSV | find "node.exe" >nul
    if "%ERRORLEVEL%"=="0" (
        echo [INFO] 見つかったプロセスを停止中...
        taskkill /F /IM node.exe >nul 2>&1
        
        REM プロセスが停止するまで待機
        timeout /t 3 /nobreak >nul
        
        REM 残っているプロセスを確認
        tasklist /FI "IMAGENAME eq node.exe" /FO CSV | find "node.exe" >nul
        if "%ERRORLEVEL%"=="0" (
            echo [WARN] 強制終了が必要なプロセスがあります
            taskkill /F /IM node.exe >nul 2>&1
        )
        
        echo [INFO] ✅ すべてのプロセスを停止しました
    ) else (
        echo [INFO] 実行中のプロセスは見つかりませんでした
    )
)

:end
echo [INFO] 美容室管理システムの停止が完了しました
pause 