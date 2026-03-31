// ============================================================
// LINE × Google Calendar Bot — 自動セットアップスクリプト
// 使い方: node automate.js
//
// Playwright 不使用。承認は既存の Chrome で行います。
// ============================================================

const https        = require('https');
const { execSync, spawnSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');
const readline     = require('readline');

// ============================================================
// 設定値
// ============================================================
const SCRIPT_ID      = '1_WxwEmNPl-LTCTYd0BdQGTvk8pKAwAyS7SbHU6b5KigVjPhzN258X8Tu';
const PROD_DEPLOY_ID = 'AKfycbwOEMgIlsZwZWOJ6DvDR2vTOPPppz12rn-82xghwhrgS6xSj2meoFab32cGL8Fkvzm6mw';
const PROD_WEBHOOK   = `https://script.google.com/macros/s/${PROD_DEPLOY_ID}/exec`;

const LINE_TOKEN  = 'yurY0ucKSoXIkIUijwLCwArcMlZpyLUOjvylJkgy4a5TQNIIoo1hLywGQGTsqq/bElzU+DaU7dA2R6Hq6zpjpay9yYfT48uHTasxY7SJkiwWw2rdB0JfCmzTfBvv1wTi7TYbI7WymwLrivneRD8yegdB04t89/1O/w1cDnyilFU=';
const GEMINI_KEY  = 'AIzaSyCTEEZalAVd19w6sS8G2VBN4bekzvXx9nQ';
const SETUP_TOKEN = 'setup2026';

const CODE_GS_PATH = path.join(__dirname, 'Code.gs');

// ============================================================
// ユーティリティ
// ============================================================
function waitForEnter(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, () => { rl.close(); resolve(); }));
}

function run(cmd) {
  console.log('  $ ' + cmd);
  return execSync(cmd, { cwd: __dirname, encoding: 'utf8' });
}

function openInChrome(url) {
  spawnSync('open', ['-a', 'Google Chrome', url]);
}

// ============================================================
// GAS コードに一時的なセットアップ用 doGet を追加・削除
// ============================================================
const SETUP_DOGET = `
// ===== 一時セットアップ関数（自動で削除されます） =====
function doGet(e) {
  if ((e.parameter.token || '') !== '${SETUP_TOKEN}') {
    return ContentService.createTextOutput('unauthorized');
  }
  var p = PropertiesService.getScriptProperties();
  p.setProperty('LINE_CHANNEL_ACCESS_TOKEN', '${LINE_TOKEN}');
  p.setProperty('GEMINI_API_KEY', '${GEMINI_KEY}');
  p.setProperty('CALENDAR_ID', 'primary');
  CalendarApp.getDefaultCalendar(); // カレンダー権限を付与
  return ContentService.createTextOutput(
    '✅ セットアップ完了！\\nこのタブを閉じてターミナルで Enter を押してください。'
  );
}
// ===== ここまで =====
`;

function addSetupCode() {
  const original = fs.readFileSync(CODE_GS_PATH, 'utf8');
  fs.writeFileSync(CODE_GS_PATH, original + SETUP_DOGET);
  return original; // 元のコードを返す（後で復元するため）
}

function restoreCode(original) {
  fs.writeFileSync(CODE_GS_PATH, original);
}

// ============================================================
// メイン
// ============================================================
(async () => {
  console.log('\n====================================');
  console.log(' LINE Calendar Bot セットアップ開始');
  console.log('====================================\n');

  // ---- Step 1: Code.gs にセットアップ用 doGet を追加してプッシュ ----
  console.log('[1/4] セットアップ用コードを準備中...');
  const originalCode = addSetupCode();
  run('clasp push --force');

  // セットアップ用に一時デプロイ
  const deployOutput = run('clasp deploy --description "setup-temp"');
  console.log(deployOutput);

  // デプロイIDを取得
  const match = deployOutput.match(/Deployed\s+(\S+)\s+@/);
  if (!match) {
    console.error('❌ デプロイIDが取得できませんでした');
    restoreCode(originalCode);
    process.exit(1);
  }
  const setupDeployId = match[1];
  const setupUrl = `https://script.google.com/macros/s/${setupDeployId}/exec?token=${SETUP_TOKEN}`;

  console.log('\n[2/4] Chrome でセットアップページを開きます...');
  console.log('      URL: ' + setupUrl);
  openInChrome(setupUrl);

  console.log('\n  ⚠️  Chrome でこの手順を行ってください:');
  console.log('  1. 「このアプリはGoogleで確認されていません」が出たら「詳細」→「安全でないページに移動」');
  console.log('  2. Googleアカウントを選んで「許可」をクリック');
  console.log('  3. 画面に「✅ セットアップ完了！」と表示されたら完了\n');

  await waitForEnter('Chrome で「✅ セットアップ完了！」が表示されたら Enter を押してください: ');

  // ---- Step 2: コードを元に戻して再プッシュ ----
  console.log('\n[3/4] 一時セットアップコードを削除して本番コードを更新中...');
  restoreCode(originalCode);
  run('clasp push --force');

  // ---- Step 3: LINE Webhook を登録 ----
  console.log('\n[4/4] LINE Webhook URL を登録中...');
  await setLineWebhook(LINE_TOKEN, PROD_WEBHOOK);
  console.log('  ✅ LINE Webhook 登録完了');

  console.log('\n====================================');
  console.log(' 🎉 セットアップ完了！');
  console.log('====================================');
  console.log('\n Webhook URL:');
  console.log('  ' + PROD_WEBHOOK);
  console.log('\n LINEでテストしてみてください:');
  console.log('  「来週月曜日の午後3時にミーティング」');
  console.log('  「明日の14時から15時まで歯医者」');
  console.log('  「今週木曜日の夜に電話」\n');
})();

// ============================================================
// LINE Webhook URL を設定
// ============================================================
function setLineWebhook(token, webhookUrl) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ webhook: webhookUrl });
    const req  = https.request(
      {
        hostname: 'api.line.me',
        path:     '/v2/bot/channel/webhook/endpoint',
        method:   'PUT',
        headers: {
          'Authorization':  'Bearer ' + token,
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            console.error('  LINE API error: ' + res.statusCode + ' ' + data);
            resolve(data); // エラーでも続行
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
