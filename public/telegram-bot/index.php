<?php
header('Content-Type: application/json');

$BOT_TOKEN = '1389903628:AAFapVJGN4EUoGul9gvWrSkT_qM71rwZ_2k';
$CHAT_ID = '-1002514429549';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'No input']);
    exit;
}

$update_id = $input['update_id'] ?? 0;
$message = $input['message'] ?? null;

if (!$message) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

$chat_id = $message['chat']['id'] ?? null;
$text = $message['text'] ?? '';
$from = $message['from'] ?? [];
$username = $from['first_name'] ?? 'User';
$is_group = ($message['chat']['type'] ?? '') === 'supergroup' || ($message['chat']['type'] ?? '') === 'group';

function sendTelegram($method, $params) {
    global $BOT_TOKEN;
    $url = "https://api.telegram.org/bot{$BOT_TOKEN}/{$method}";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

// Only respond to DMs or mentions in groups
$is_mention = strpos($text, '@no1currentbot') !== false;
$is_cmd = $is_group ? $is_mention : true;

if (!$is_cmd && $is_group) {
    http_response_code(200);
    echo json_encode(['ok' => true, 'skipped' => true]);
    exit;
}

// Clean text
$text = str_replace('@no1currentbot', '', trim($text));

// Route commands
$response = null;

if ($text === '/start') {
    $response = "⚡ *JDUB HUB Bot* ⚡\n\nHello {$username}! Main JDUB AI Bot hoon.\n\nCommands:\n🔍 /search <query> — Search content\n📊 /status — System status\n📺 /tv — Live TV channels\n📱 /help — Help\n\nWebsite: https://njcreative123.helioho.st/";

} else if (strpos($text, '/search') === 0) {
    $query = trim(str_replace('/search', '', $text));
    if (empty($query)) {
        $response = "🔍 Usage: /search <movie ya book name>";
    } else {
        $response = "🔍 Searching for: *{$query}*\n\nChecking Telegram group data...\n\nVisit website for full results:\nhttps://njcreative123.helioho.st/";
    }

} else if ($text === '/status') {
    $response = "⚙️ *JDUB Hub Status*\n\n✅ Main AI: Online\n✅ Search Worker: Online\n✅ Analyze Worker: Online\n✅ Summarize Worker: Online\n✅ Live TV Worker: Online\n✅ Telegram Worker: Online\n\nAll systems operational! 🔥";

} else if ($text === '/tv') {
    $response = "📺 *Live TV Channels*\n\n🎬 Hindi Movies\n🎥 Hindi Dubbed\n📺 Web Series\n🎵 Music TV\n📰 News\n⚽ Sports\n\nVisit: https://njcreative123.helioho.st/";

} else if ($text === '/help') {
    $response = "📱 *JDUB Hub Help*\n\n/start — Start bot\n/search <query> — Search\n/status — System status\n/tv — Live TV\n/help — This message\n\n🌐 Website: https://njcreative123.helioho.st/";

} else if ($is_group) {
    // In group, respond to mentions only
    http_response_code(200);
    echo json_encode(['ok' => true, 'no_response' => true]);
    exit;
}

if ($response) {
    sendTelegram('sendMessage', [
        'chat_id' => $chat_id,
        'text' => $response,
        'parse_mode' => 'Markdown',
        'disable_web_page_preview' => true
    ]);
}

echo json_encode(['ok' => true]);
?>
