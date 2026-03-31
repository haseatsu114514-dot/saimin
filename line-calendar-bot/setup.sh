#!/bin/bash
# =============================================================
# LINE × Google Calendar Bot — GAS セットアップスクリプト
# このスクリプトをローカル端末のターミナルで実行してください
# =============================================================

set -e

echo "============================================="
echo " LINE Calendar Bot — GAS セットアップ開始"
echo "============================================="

# Node.js確認
if ! command -v node &> /dev/null; then
  echo "❌ Node.js が見つかりません。https://nodejs.org/ からインストールしてください。"
  exit 1
fi

# clasp インストール確認
if ! command -v clasp &> /dev/null; then
  echo "📦 clasp をインストール中..."
  npm install -g @google/clasp
fi

echo ""
echo "✅ clasp バージョン: $(clasp --version)"
echo ""

# Google ログイン
echo "🔑 Googleアカウントにログインします..."
echo "   ブラウザが開くので、カレンダーを登録したいGoogleアカウントでログインしてください。"
echo ""
clasp login

echo ""
echo "🚀 GAS プロジェクトを作成中..."
cd "$(dirname "$0")"

# プロジェクト作成（ウェブアプリとして）
clasp create --type webapp --title "LINE Calendar Bot"

echo ""
echo "📤 コードをアップロード中..."
clasp push --force

echo ""
echo "🌐 ウェブアプリとしてデプロイ中..."
DEPLOY_OUTPUT=$(clasp deploy --description "LINE Calendar Bot v1" 2>&1)
echo "$DEPLOY_OUTPUT"

# デプロイIDを取得
DEPLOY_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?<=- )[A-Za-z0-9_-]+(?= @)' | head -1)
SCRIPT_ID=$(cat .clasp.json | python3 -c "import sys,json; print(json.load(sys.stdin)['scriptId'])")

echo ""
echo "============================================="
echo " ✅ デプロイ完了！"
echo "============================================="
echo ""
echo "📋 GASプロジェクトURL:"
echo "   https://script.google.com/d/${SCRIPT_ID}/edit"
echo ""

if [ -n "$DEPLOY_ID" ]; then
  WEBHOOK_URL="https://script.google.com/macros/s/${DEPLOY_ID}/exec"
  echo "🔗 LINE Webhook URL（これをLINE Developers Consoleに登録）:"
  echo "   ${WEBHOOK_URL}"
  echo ""
  # webhook_url.txt に保存
  echo "$WEBHOOK_URL" > webhook_url.txt
  echo "   ↑ webhook_url.txt にも保存しました"
fi

echo ""
echo "============================================="
echo " 次のステップ"
echo "============================================="
echo ""
echo "1. GASプロジェクトを開く:"
echo "   https://script.google.com/d/${SCRIPT_ID}/edit"
echo ""
echo "2. 「プロジェクトの設定」→「スクリプトプロパティ」に以下を追加:"
echo "   LINE_CHANNEL_ACCESS_TOKEN = (LINE Developers Consoleで取得したトークン)"
echo "   CLAUDE_API_KEY            = (console.anthropic.comで取得したAPIキー)"
echo "   CALENDAR_ID               = primary"
echo ""
echo "3. エディタで「authorizeCalendar」関数を選択して▶実行"
echo "   → カレンダーのアクセス許可ダイアログが表示されるので「許可」をクリック"
echo ""
echo "4. LINE Developers Console → Webhook URL に上記URLを貼り付けて有効化"
echo ""
echo "5. LINEでテスト送信："
echo "   「来週月曜日の午後3時にミーティング」"
echo ""
