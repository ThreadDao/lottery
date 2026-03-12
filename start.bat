@echo off
REM 一键启动抽签系统（Windows）

REM 1. 切换到当前脚本所在目录
cd /d "%~dp0"

REM 2. 如果还没有安装依赖，先安装并初始化数据库、编译
if not exist "node_modules" (
  echo [首次运行] 正在安装依赖，时间可能比較久，請耐心等待...
  npm install
  if errorlevel 1 (
    echo npm install 失敗，請檢查是否已安裝 Node.js 和 npm。
    pause
    goto :eof
  )

  echo 初始化數據庫...
  npm run db:init
  echo 編譯項目...
  npm run build
)

REM 3. 啟動服務（http://localhost:3000）
echo 啟動抽簽服務中...
npm start

echo.
echo 抽簽系統已停止，按任意鍵關閉窗口。
pause

