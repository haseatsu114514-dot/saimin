// update.js — カレンダーID更新 + 再デプロイ + LINE Webhook更新
const https        = require('https');
const { execSync } = require('child_process');
const { spawnSync }= require('child_process');
const fs           = require('fs');
const path         = require('path');
const readline     = require('readline');

const SCRIPT_ID    = '1_WxwEmNPl-LTCTYd0BdQGTvk8pKAwAyS7SbHU6b5KigVjPhzN258X8Tu';
const LINE_TOKEN   = 'yurY0ucKSoXIkIUijwLCwArcMlZpyLUOjvylJkgy4a5TQNIIoo1hLywGQGTsqq/bElzU+DaU7dA2R6Hq6zpjpay9yYfT48uHTasxY7SJkiwWw2rdB0JfCmzTfBvv1wTi7TYbI7WymwLrivneRD8yegdB04t89/1O/w1cDnyilFU=';
const NEW_CAL_ID   = 'dafc8b598911cfc9b10f56e92993836fe3c9c11b90f0d270046ccc1943692e40@group.calendar.google.com';
const CODE_GS_PATH = path.join(__dirname, 'Code.gs');
const GAS_EDITOR   = `https://script.google.com/d/${SCRIPT_ID}/edit`;

function waitForEnter(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(msg, () => { rl.close(); r(); }));
}
function run(cmd) { execSync(cmd, { cwd: __dirname, stdio: 'inherit' }); }
function openChrome(url) { spawnSync('open', ['-a', 'Google Chrome', url]); }

const UPDATE_FN = `
function updateCalendarId() {
  PropertiesService.getScriptProperties().setProperty(
    'CALENDAR_ID',
    '${NEW_CAL_ID}'
  );
  Logger.log('✅ カレンダーID更新完了: ' + '${NEW_CAL_ID}');
}
`;

(async () => {
  console.log('\n[1/3] カレンダーID更新用コードをGASにアップロード中...');
  const original = fs.readFileSync(CODE_GS_PATH, 'utf8');
  fs.writeFileSync(CODE_GS_PATH, original + UPDATE_FN);
  run('clasp push --force');

  console.log('\n[2/3] GASエディタをChromeで開いています...');
  openChrome(GAS_EDITOR);

  console.log('\n============================================');
  console.log(' Chrome でこの手順を行ってください：');
  console.log('============================================');
  console.log('  1. ドロップダウンで「updateCalendarId」を選択');
  console.log('  2. ▶ 実行');
  console.log('  3. ログに「✅ カレンダーID更新完了」が出たらOK\n');

  await waitForEnter('「✅ カレンダーID更新完了」が出たら Enter: ');

  console.log('\n[3/3] 再デプロイ & LINE Webhook 更新中...');
  fs.writeFileSync(CODE_GS_PATH, original);
  run('clasp push --force');

  const out = execSync('clasp deploy --description "LINE Calendar Bot v3"', {
    cwd: __dirname, encoding: 'utf8'
  });
  console.log(out);

  const m = out.match(/Deployed\s+(\S+)\s+@/);
  if (!m) { console.error('デプロイIDが取得できませんでした'); process.exit(1); }
  const newDeployId = m[1];
  const newWebhook  = `https://script.google.com/macros/s/${newDeployId}/exec`;

  await setLineWebhook(LINE_TOKEN, newWebhook);

  console.log('\n====================================');
  console.log(' 🎉 完了！');
  console.log('====================================');
  console.log(' 新しいWebhook URL:');
  console.log('  ' + newWebhook);
  console.log('\n LINEで送ってテストしてみてください:');
  console.log('  「本日17時から24時まで作業」\n');
})();

function setLineWebhook(token, url) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ endpoint: url });
    const req  = https.request({
      hostname: 'api.line.me', path: '/v2/bot/channel/webhook/endpoint', method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('  LINE Webhook: ' + res.statusCode + ' ' + d);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}
