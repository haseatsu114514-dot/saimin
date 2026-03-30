// ============================================================
// LINE × Google Calendar Bot
// Google Apps Script (GAS) で動作するWebhookサーバー
//
// 【セットアップ】
// 1. スクリプトプロパティに以下を設定:
//    - LINE_CHANNEL_ACCESS_TOKEN : LINE Developers Console で取得
//    - CLAUDE_API_KEY            : console.anthropic.com で取得
//    - CALENDAR_ID               : "primary" または特定のカレンダーID
// 2. プロジェクト設定 > タイムゾーン を Asia/Tokyo に設定
// 3. デプロイ > 新しいデプロイ > ウェブアプリ
//    - 実行ユーザー：自分
//    - アクセス：全員
// 4. authorizeCalendar() を手動実行してカレンダー権限を付与
// ============================================================

// ============================================================
// CONFIG
// ============================================================
var CONFIG = {
  LINE_CHANNEL_ACCESS_TOKEN: PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
  CLAUDE_API_KEY:            PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY'),
  CALENDAR_ID:               PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') || 'primary',
  CLAUDE_MODEL:              'claude-haiku-4-5-20251001',
  CLAUDE_API_URL:            'https://api.anthropic.com/v1/messages',
  LINE_REPLY_URL:            'https://api.line.me/v2/bot/message/reply',
  DEFAULT_EVENT_DURATION_MIN: 60  // 終了時刻が不明な場合のデフォルト時間（分）
};

// ============================================================
// WEBHOOK ENTRY POINT
// ============================================================
/**
 * LINE Messaging API から POST リクエストを受信するエントリーポイント
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var events = body.events;
    if (!events || events.length === 0) {
      return ContentService.createTextOutput('OK');
    }
    for (var i = 0; i < events.length; i++) {
      handleLineEvent(events[i]);
    }
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
  }
  // LINE は常に HTTP 200 を期待する
  return ContentService.createTextOutput('OK');
}

// ============================================================
// EVENT HANDLER
// ============================================================
/**
 * LINE イベントを処理する。テキストメッセージのみ対応。
 */
function handleLineEvent(event) {
  // テキストメッセージ以外は無視
  if (event.type !== 'message' || event.message.type !== 'text') return;

  var replyToken = event.replyToken;
  var userText   = event.message.text;

  try {
    var parsed = parseEventWithClaude(userText);

    if (!parsed || parsed.error) {
      replyToLine(replyToken, buildErrorMessage(parsed ? parsed.error : '解析に失敗しました'));
      return;
    }

    var calEvent = createCalendarEvent(parsed);
    replyToLine(replyToken, buildConfirmationMessage(calEvent, parsed));

  } catch (err) {
    Logger.log('handleLineEvent error: ' + err.toString());
    replyToLine(replyToken, buildErrorMessage('エラーが発生しました: ' + err.message));
  }
}

// ============================================================
// NLP: CLAUDE API
// ============================================================
/**
 * Claude API に自然言語テキストを送り、予定情報をJSONで返す。
 *
 * 返り値の形式:
 * {
 *   title: "予定タイトル",
 *   date: "YYYY-MM-DD",
 *   startTime: "HH:MM",
 *   endTime: "HH:MM" または null,
 *   error: null
 * }
 *
 * エラー時:
 * {
 *   title: null, date: null, startTime: null, endTime: null,
 *   error: "エラーメッセージ"
 * }
 */
function parseEventWithClaude(userText) {
  var today = getToday();

  var systemPrompt = [
    'あなたは日本語のスケジュール文章から予定情報を抽出するアシスタントです。',
    '必ず以下のJSON形式のみで返答してください。余分な文字・Markdownコードブロック・説明文は一切含めないでください。',
    '',
    '出力形式:',
    '{',
    '  "title": "予定のタイトル（文章から抽出。なければ「予定」）",',
    '  "date": "YYYY-MM-DD",',
    '  "startTime": "HH:MM",',
    '  "endTime": "HH:MM または null（終了時刻が不明な場合）",',
    '  "error": null',
    '}',
    '',
    'エラー時（予定として解釈できない場合）:',
    '{',
    '  "title": null, "date": null, "startTime": null, "endTime": null,',
    '  "error": "予定の情報が読み取れませんでした"',
    '}',
    '',
    '日付解釈ルール（今日の日付: ' + today + '）:',
    '- 「今日」→ ' + today,
    '- 「明日」→ 翌日',
    '- 「明後日」→ 翌々日',
    '- 「今週の〇曜日」→ 今週（月曜始まり）の該当曜日',
    '- 「来週の〇曜日」→ 来週の該当曜日',
    '- 月日のみの表記（例: 3月30日）→ 今年の該当日。すでに過去の場合は来年',
    '- 時刻の曖昧表現: 「午前」→ AM, 「午後」→ PM（12時間制を24時間制に変換）',
    '- 「夜」「夜に」→ 19:00（特定の時刻が文脈にない場合）',
    '- 「朝」「朝に」→ 08:00',
    '- 「昼」「お昼」→ 12:00',
    '- 時刻が全く不明な場合は startTime を "09:00" とする',
    '- endTime は明示されていない場合 null を返す',
    '- 「〜から〜まで」「〜〜時〜〜時」などは開始・終了時刻を両方抽出する',
    '- タイトルは「の予定」「について」などの助詞を除いた核心部分を抽出する',
  ].join('\n');

  var userPrompt = '次の文章から予定を抽出してください:\n' + userText;

  var payload = {
    model: CONFIG.CLAUDE_MODEL,
    max_tokens: 256,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': CONFIG.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response     = UrlFetchApp.fetch(CONFIG.CLAUDE_API_URL, options);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();

  if (responseCode !== 200) {
    Logger.log('Claude API error ' + responseCode + ': ' + responseText);
    throw new Error('Claude API がエラーを返しました (HTTP ' + responseCode + ')');
  }

  var responseJson = JSON.parse(responseText);
  var rawContent   = responseJson.content[0].text.trim();

  // Claude が指示に反してMarkdownコードブロックを付けた場合に除去
  rawContent = rawContent.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();

  return JSON.parse(rawContent);
}

// ============================================================
// CALENDAR
// ============================================================
/**
 * Google Calendar にイベントを作成する。
 * parseEventWithClaude の返り値を受け取る。
 */
function createCalendarEvent(parsed) {
  var calendar;
  if (CONFIG.CALENDAR_ID === 'primary') {
    calendar = CalendarApp.getDefaultCalendar();
  } else {
    calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  }

  if (!calendar) {
    throw new Error('カレンダーが見つかりません: ' + CONFIG.CALENDAR_ID);
  }

  var startDateTime = new Date(parsed.date + 'T' + parsed.startTime + ':00');

  if (isNaN(startDateTime.getTime())) {
    throw new Error('日時の解析に失敗しました: ' + parsed.date + ' ' + parsed.startTime);
  }

  var endDateTime;
  if (parsed.endTime) {
    endDateTime = new Date(parsed.date + 'T' + parsed.endTime + ':00');
  } else {
    endDateTime = new Date(startDateTime.getTime() + CONFIG.DEFAULT_EVENT_DURATION_MIN * 60 * 1000);
  }

  return calendar.createEvent(parsed.title, startDateTime, endDateTime);
}

// ============================================================
// LINE MESSAGING
// ============================================================
/**
 * LINE Reply API でメッセージを返信する。
 */
function replyToLine(replyToken, message) {
  var payload = {
    replyToken: replyToken,
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(CONFIG.LINE_REPLY_URL, options);
  if (response.getResponseCode() !== 200) {
    Logger.log('LINE reply error: ' + response.getContentText());
  }
}

/**
 * カレンダー登録成功時の確認メッセージを作成する。
 */
function buildConfirmationMessage(calEvent, parsed) {
  var start    = calEvent.getStartTime();
  var end      = calEvent.getEndTime();
  var dateStr  = Utilities.formatDate(start, 'Asia/Tokyo', 'M月d日(EEE)');
  var startStr = Utilities.formatDate(start, 'Asia/Tokyo', 'HH:mm');
  var endStr   = Utilities.formatDate(end,   'Asia/Tokyo', 'HH:mm');

  return [
    '✅ カレンダーに登録しました！',
    '',
    '📅 ' + dateStr,
    '⏰ ' + startStr + ' 〜 ' + endStr,
    '📝 ' + calEvent.getTitle(),
  ].join('\n');
}

/**
 * エラー時のメッセージを作成する。
 */
function buildErrorMessage(reason) {
  return [
    '⚠️ 予定の登録に失敗しました。',
    '',
    reason || 'もう一度、日付と時間を含めて送ってみてください。',
    '',
    '例：「4月5日の14時からミーティング」',
    '例：「来週月曜日の午後3時に歯医者」',
  ].join('\n');
}

// ============================================================
// UTILITIES
// ============================================================
/**
 * 今日の日付を Asia/Tokyo で YYYY-MM-DD 形式で返す。
 * GAS のデフォルトは UTC なので Utilities.formatDate で変換が必要。
 */
function getToday() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
}

/**
 * カレンダーへのアクセス権限を付与するための初期化関数。
 * デプロイ前に一度だけ手動実行してください。
 */
function authorizeCalendar() {
  CalendarApp.getDefaultCalendar();
  Logger.log('✅ カレンダーの認証が完了しました。');
}
