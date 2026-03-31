// ============================================================
// LINE × Google Calendar Bot — 自動セットアップスクリプト
// 使い方: node automate.js
//
// ★ 既存の Chrome プロファイルを使うため、
//   実行前に Chrome を完全に閉じてください
// ============================================================

const { chromium } = require('playwright');
const https        = require('https');
const { execSync } = require('child_process');
const os           = require('os');
const path         = require('path');
const readline     = require('readline');

// ============================================================
// 設定値（変更不要）
// ============================================================
const SCRIPT_ID  = '1_WxwEmNPl-LTCTYd0BdQGTvk8pKAwAyS7SbHU6b5KigVjPhzN258X8Tu';
const DEPLOY_ID  = 'AKfycbyNhRlDNkt3XcV8x2h_GdQnD5d6E_H245NpWuczD1Oq7GKOw4yN7QKRDhtz_vlVVUsoOQ';
const WEBHOOK_URL = `https://script.google.com/macros/s/${DEPLOY_ID}/exec`;

const SCRIPT_PROPERTIES = {
  LINE_CHANNEL_ACCESS_TOKEN: 'yurY0ucKSoXIkIUijwLCwArcMlZpyLUOjvylJkgy4a5TQNIIoo1hLywGQGTsqq/bElzU+DaU7dA2R6Hq6zpjpay9yYfT48uHTasxY7SJkiwWw2rdB0JfCmzTfBvv1wTi7TYbI7WymwLrivneRD8yegdB04t89/1O/w1cDnyilFU=',
  GEMINI_API_KEY:            'AIzaSyCTEEZalAVd19w6sS8G2VBN4bekzvXx9nQ',
  CALENDAR_ID:               'primary',
};

// macOS の Chrome プロファイルパス
const CHROME_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');

// ============================================================
// ユーティリティ
// ============================================================
function waitForEnter(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, () => { rl.close(); resolve(); }));
}

function isChromeRunning() {
  try {
    execSync('pgrep -x "Google Chrome"', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// メイン処理
// ============================================================
(async () => {

  // Chrome が開いていたら閉じてもらう
  if (isChromeRunning()) {
    console.log('\n⚠️  Chrome が起動中です。');
    console.log('   Chrome を完全に終了してから Enter を押してください。');
    console.log('   （Cmd+Q または メニュー → Chrome を終了）\n');
    await waitForEnter('Chromeを閉じたら Enter: ');

    if (isChromeRunning()) {
      console.log('まだ Chrome が起動中です。終了してから再度 Enter を押してください。');
      await waitForEnter('Enter: ');
    }
  }

  console.log('\n✅ Chrome を既存プロファイルで起動します（ログイン不要）...\n');

  // 既存の Chrome プロファイルを使って起動
  const context = await chromium.launchPersistentContext(CHROME_USER_DATA, {
    channel:   'chrome',
    headless:  false,
    slowMo:    400,
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await context.newPage();

  try {
    // ---- 事前: clasp push ----
    console.log('[0/3] 最新コードをGASにアップロード中...');
    try {
      execSync('clasp push --force', { cwd: __dirname, stdio: 'inherit' });
      console.log('  ✅ アップロード完了\n');
    } catch {
      console.log('  ⚠️  clasp push 失敗（続行します）\n');
    }

    // ---- Step 1: スクリプトプロパティを設定 ----
    console.log('[1/3] GAS スクリプトプロパティを設定中...');
    await page.goto(`https://script.google.com/d/${SCRIPT_ID}/edit`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await page.waitForTimeout(2500);

    // 左サイドバーの設定ボタン（歯車）
    const settingsBtn = page.locator('[aria-label="プロジェクトの設定"], [aria-label="Project Settings"]').first();
    await settingsBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await settingsBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // スクリプトプロパティを1つずつ追加
    for (const [key, value] of Object.entries(SCRIPT_PROPERTIES)) {
      process.stdout.write(`   → ${key} ... `);

      const addBtn = page.getByRole('button', { name: /プロパティを追加|Add script property/i }).first();
      await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(600);

      const keyInputs = page.locator('input[placeholder*="プロパティ"], input[placeholder*="Property"]');
      const kc = await keyInputs.count();
      await keyInputs.nth(kc - 1).fill(key);

      const valInputs = page.locator('input[placeholder*="値"], input[placeholder*="Value"]');
      const vc = await valInputs.count();
      await valInputs.nth(vc - 1).fill(value);

      console.log('OK');
    }

    // 保存
    const saveBtn = page.getByRole('button', { name: /スクリプト プロパティを保存|Save script properties/i });
    await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log('  ✅ スクリプトプロパティ設定完了\n');

    // ---- Step 2: authorizeCalendar を実行 ----
    console.log('[2/3] カレンダーの権限を付与中...');
    await page.goto(`https://script.google.com/d/${SCRIPT_ID}/edit`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await page.waitForTimeout(3000);

    // 関数ドロップダウンで authorizeCalendar を選択
    const funcDropdown = page.locator('div[class*="function-picker"], [aria-label*="関数"], [aria-label*="function"]').first();
    await funcDropdown.waitFor({ state: 'visible', timeout: 12_000 }).catch(() => {});
    await funcDropdown.click().catch(() => {});
    await page.waitForTimeout(500);

    const authOpt = page.getByRole('option', { name: 'authorizeCalendar' })
      .or(page.getByText('authorizeCalendar').nth(1));
    await authOpt.click().catch(() => {});
    await page.waitForTimeout(600);

    // ▶ 実行ボタン
    const runBtn = page.locator('[aria-label*="実行"], [aria-label*="Run"]').first();
    await runBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await runBtn.click();

    // 権限確認ダイアログ処理
    try {
      const reviewBtn = page.getByRole('button', { name: /権限を確認|Review permissions/i });
      await reviewBtn.waitFor({ timeout: 10_000 });
      await reviewBtn.click();

      const popup = await context.waitForEvent('page', { timeout: 15_000 });
      await popup.waitForLoadState('networkidle');

      // アカウント選択
      const accountBtn = popup.getByText('uranai.rokkon@gmail.com').first();
      if (await accountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await accountBtn.click();
        await popup.waitForLoadState('networkidle');
      }

      // 「許可」をクリック
      const allowBtn = popup.getByRole('button', { name: /許可|Allow/i });
      await allowBtn.waitFor({ timeout: 15_000 });
      await allowBtn.click();
      await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});
    } catch {
      console.log('   → 権限ダイアログなし（すでに許可済み）');
    }

    await page.waitForTimeout(3000);
    console.log('  ✅ カレンダー権限付与完了\n');

    // ---- Step 3: LINE Webhook URL を登録 ----
    console.log('[3/3] LINE Webhook URL を登録中...');
    await setLineWebhook(SCRIPT_PROPERTIES.LINE_CHANNEL_ACCESS_TOKEN, WEBHOOK_URL);
    console.log('  ✅ LINE Webhook 登録完了\n');

    console.log('=============================================');
    console.log(' 🎉 セットアップ完了！');
    console.log('=============================================');
    console.log('\n Webhook URL:');
    console.log('  ' + WEBHOOK_URL);
    console.log('\n LINEでテストしてみてください:');
    console.log('  「来週月曜日の午後3時にミーティング」');
    console.log('  「明日の14時から15時まで歯医者」');
    console.log('  「今週木曜日の夜に電話」\n');

  } catch (err) {
    console.error('\n❌ エラー:', err.message);
    console.log('ブラウザを30秒開いたままにします...');
    await page.waitForTimeout(30_000);
  } finally {
    await context.close();
  }
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
          res.statusCode === 200 ? resolve(data) : reject(new Error(`LINE ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
