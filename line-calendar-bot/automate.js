// ============================================================
// LINE × Google Calendar Bot — 自動セットアップスクリプト
// 使い方: node automate.js
// ============================================================

const { chromium } = require('playwright');
const https        = require('https');
const { execSync } = require('child_process');
const path         = require('path');

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

// ============================================================
// メイン処理
// ============================================================
(async () => {
  // --- 事前: clasp push で最新コードを反映 ---
  console.log('\n[0/3] 最新コードをGASにアップロード中...');
  try {
    execSync('clasp push --force', { cwd: __dirname, stdio: 'inherit' });
    console.log('  ✅ コードアップロード完了');
  } catch (e) {
    console.error('  ⚠️  clasp push に失敗しました。続行します。');
  }

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page    = await browser.newPage();

  try {
    // ---- Step 1: スクリプトプロパティを設定 ----
    console.log('\n[1/3] GASのスクリプトプロパティを設定中...');
    await page.goto(`https://script.google.com/d/${SCRIPT_ID}/edit`);

    // Googleログインが必要な場合は待つ
    console.log('      → ブラウザでGoogleログインが求められたらログインしてください（60秒以内）');
    await page.waitForURL(/script\.google\.com/, { timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // 左サイドバーの歯車アイコン（プロジェクトの設定）をクリック
    const settingsBtn = page.locator('[aria-label="プロジェクトの設定"], [aria-label="Project Settings"]').first();
    await settingsBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await settingsBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 「スクリプトプロパティ」セクションまでスクロール
    const propHeader = page.getByText(/スクリプト プロパティ|Script properties/).first();
    await propHeader.scrollIntoViewIfNeeded().catch(() => {});

    // プロパティを1つずつ追加
    for (const [key, value] of Object.entries(SCRIPT_PROPERTIES)) {
      console.log(`      → ${key} を設定中...`);

      const addBtn = page.getByRole('button', { name: /プロパティを追加|Add script property/i }).first();
      await addBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(600);

      // 最後に追加されたキー入力欄に入力
      const keyInputs = page.locator('input[placeholder*="プロパティ"], input[placeholder*="Property"], input[aria-label*="プロパティ"]');
      const kc = await keyInputs.count();
      await keyInputs.nth(kc - 1).fill(key);

      // 最後に追加された値入力欄に入力
      const valInputs = page.locator('input[placeholder*="値"], input[placeholder*="Value"], input[aria-label*="値"]');
      const vc = await valInputs.count();
      await valInputs.nth(vc - 1).fill(value);
    }

    // 「スクリプトプロパティを保存」をクリック
    const saveBtn = page.getByRole('button', { name: /スクリプト プロパティを保存|Save script properties/i });
    await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log('  ✅ スクリプトプロパティ設定完了');

    // ---- Step 2: authorizeCalendar を実行 ----
    console.log('\n[2/3] カレンダーの権限を付与中...');
    await page.goto(`https://script.google.com/d/${SCRIPT_ID}/edit`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await page.waitForTimeout(3000);

    // 関数セレクタで authorizeCalendar を選択
    const funcSelector = page.locator('[aria-label*="関数"], [aria-label*="function"], .script-editor-toolbar select').first();
    await funcSelector.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});

    // ドロップダウン形式の場合
    const isSelect = await funcSelector.evaluate(el => el.tagName === 'SELECT').catch(() => false);
    if (isSelect) {
      await funcSelector.selectOption({ label: 'authorizeCalendar' }).catch(() => {});
    } else {
      await funcSelector.click().catch(() => {});
      await page.waitForTimeout(500);
      await page.getByText('authorizeCalendar').first().click().catch(() => {});
    }
    await page.waitForTimeout(800);

    // 実行ボタン（▶）をクリック
    const runBtn = page.locator('[aria-label*="実行"], [aria-label*="Run"], .run-button').first();
    await runBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await runBtn.click();

    // 権限ダイアログを処理
    try {
      const reviewBtn = page.getByRole('button', { name: /権限を確認|Review permissions/i });
      await reviewBtn.waitFor({ timeout: 10_000 });
      await reviewBtn.click();

      // ポップアップウィンドウ（Googleアカウント選択）を処理
      const popup = await page.waitForEvent('popup', { timeout: 15_000 });
      await popup.waitForLoadState('networkidle');

      // アカウントを選択（すでにログイン済みなら自動選択される場合がある）
      const accountBtn = popup.getByText('uranai.rokkon@gmail.com').first();
      if (await accountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await accountBtn.click();
        await popup.waitForLoadState('networkidle');
      }

      // 「許可」ボタンをクリック
      const allowBtn = popup.getByRole('button', { name: /許可|Allow/i });
      await allowBtn.waitFor({ timeout: 15_000 });
      await allowBtn.click();
      await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});
    } catch (e) {
      console.log('      → 権限ダイアログなし（すでに許可済みの可能性あり）');
    }

    await page.waitForTimeout(3000);
    console.log('  ✅ カレンダー権限付与完了');

    // ---- Step 3: LINE Webhook URL を登録 ----
    console.log('\n[3/3] LINE Webhook URLを登録中...');
    await setLineWebhook(SCRIPT_PROPERTIES.LINE_CHANNEL_ACCESS_TOKEN, WEBHOOK_URL);
    console.log('  ✅ LINE Webhook登録完了');

    console.log('\n=============================================');
    console.log(' 🎉 セットアップ完了！');
    console.log('=============================================');
    console.log('\n Webhook URL:');
    console.log(' ' + WEBHOOK_URL);
    console.log('\n LINEでテストしてみてください:');
    console.log('  「来週月曜日の午後3時にミーティング」');
    console.log('  「明日の14時から15時まで歯医者」');
    console.log('  「今週木曜日の夜に電話」\n');

  } catch (err) {
    console.error('\n❌ エラーが発生しました:', err.message);
    console.error('ブラウザは開いたままにします。手動で確認してください。');
    await page.waitForTimeout(30_000);
  } finally {
    await browser.close();
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
        headers:  {
          'Authorization':  'Bearer ' + token,
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error('LINE API error ' + res.statusCode + ': ' + data));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
