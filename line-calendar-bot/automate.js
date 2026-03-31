// ============================================================
// LINE × Google Calendar Bot — 自動セットアップスクリプト
// 使い方: node automate.js
// ============================================================

const https        = require('https');
const { execSync } = require('child_process');
const { spawnSync }= require('child_process');
const fs           = require('fs');
const path         = require('path');
const readline     = require('readline');

// ============================================================
// 設定値
// ============================================================
const SCRIPT_ID      = '1_WxwEmNPl-LTCTYd0BdQGTvk8pKAwAyS7SbHU6b5KigVjPhzN258X8Tu';
const PROD_DEPLOY_ID = 'AKfycbwOEMgIlsZwZWOJ6DvDR2vTOPPppz12rn-82xghwhrgS6xSj2meoFab32cGL8Fkvzm6mw';
const PROD_WEBHOOK   = `https://script.google.com/macros/s/${PROD_DEPLOY_ID}/exec`;

const LINE_TOKEN = 'yurY0ucKSoXIkIUijwLCwArcMlZpyLUOjvylJkgy4a5TQNIIoo1hLywGQGTsqq/bElzU+DaU7dA2R6Hq6zpjpay9yYfT48uHTasxY7SJkiwWw2rdB0JfCmzTfBvv1wTi7TYbI7WymwLrivneRD8yegdB04t89/1O/w1cDnyilFU=';
const GEMINI_KEY = 'AIzaSyCTEEZalAVd19w6sS8G2VBN4bekzvXx9nQ';

const CODE_GS_PATH   = path.join(__dirname, 'Code.gs');
const GAS_EDITOR_URL = `https://script.google.com/d/${SCRIPT_ID}/edit`;

// ============================================================
// ユーティリティ
// ============================================================
function waitForEnter(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, () => { rl.close(); resolve(); }));
}

function run(cmd) {
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

function openInChrome(url) {
  spawnSync('open', ['-a', 'Google Chrome', url]);
}

// ============================================================
// Code.gs に一時セットアップ関数を追加
// ============================================================
const INIT_FUNCTION = `
// ===== 一時セットアップ関数（実行後に自動削除されます） =====
function initBot() {
  var p = PropertiesService.getScriptProperties();
  p.setProperty('LINE_CHANNEL_ACCESS_TOKEN', '${LINE_TOKEN}');
  p.setProperty('GEMINI_API_KEY', '${GEMINI_KEY}');
  p.setProperty('CALENDAR_ID', 'primary');
  CalendarApp.getDefaultCalendar();
  Logger.log('✅ セットアップ完了！プロパティとカレンダー権限の設定が終わりました。');
}
// ===== ここまで =====
`;

(async () => {
  console.log('\n====================================');
  console.log(' LINE Calendar Bot セットアップ');
  console.log('====================================\n');

  // ---- Step 1: initBot 関数を追加してプッシュ ----
  console.log('[1/3] セットアップ用コードをGASにアップロード中...');
  const original = fs.readFileSync(CODE_GS_PATH, 'utf8');
  fs.writeFileSync(CODE_GS_PATH, original + INIT_FUNCTION);
  run('clasp push --force');

  // ---- Step 2: GASエディタをChromeで開く ----
  console.log('\n[2/3] GASエディタをChromeで開いています...\n');
  openInChrome(GAS_EDITOR_URL);

  console.log('============================================');
  console.log(' Chrome でこの手順を行ってください：');
  console.log('============================================');
  console.log('');
  console.log('  1. エディタ上部のドロップダウンで');
  console.log('     「initBot」を選択');
  console.log('');
  console.log('  2. ▶（実行）ボタンをクリック');
  console.log('');
  console.log('  3. 「権限を確認」ダイアログが出たら:');
  console.log('     → アカウントを選択');
  console.log('     → 「詳細」→「安全でないページに移動」');
  console.log('     → 「許可」をクリック');
  console.log('');
  console.log('  4. 実行ログに「✅ セットアップ完了！」が出たらOK');
  console.log('');

  await waitForEnter('「✅ セットアップ完了！」が出たら Enter を押してください: ');

  // ---- Step 3: コードを元に戻す & LINE Webhook 登録 ----
  console.log('\n[3/3] 後片付けと LINE Webhook 登録中...');
  fs.writeFileSync(CODE_GS_PATH, original);
  run('clasp push --force');

  await setLineWebhook(LINE_TOKEN, PROD_WEBHOOK);

  console.log('\n====================================');
  console.log(' 🎉 セットアップ完了！');
  console.log('====================================');
  console.log('\n LINE Webhook URL:');
  console.log('  ' + PROD_WEBHOOK);
  console.log('\n LINEで送ってテストしてみてください:');
  console.log('  「来週月曜日の午後3時にミーティング」');
  console.log('  「明日の14時から15時まで歯医者」\n');
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
            console.log('  ✅ LINE Webhook 登録完了');
            resolve(data);
          } else {
            console.error('  ⚠️  LINE API: ' + res.statusCode + ' ' + data);
            resolve(data);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
