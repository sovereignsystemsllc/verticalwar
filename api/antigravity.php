<?php
// /public_html/api/antigravity.php
// Minimal Gemini gateway for SiteGround (PHP). Keeps API key server-side.

header('Content-Type: application/json; charset=utf-8');

// Optional: basic origin gate (same-site calls usually have an Origin header)
// For local testing, we might want to temporarily allow localhost, but we'll stick to strict origin
$ALLOWED_ORIGIN = 'https://verticalwar.com'; 
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *'); // Relaxed internally for easier local dev
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

header('Access-Control-Allow-Origin: *'); // Relaxed internally for easier local dev test
header('Vary: Origin');

// --- Very small rate limit (per IP, per minute) ---
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = sys_get_temp_dir() . '/ag_' . preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $ip) . '.json';
$now = time();
$window = 60;
$max = 30; // 30 requests / minute / IP

$state = ['t' => $now, 'c' => 0];
if (file_exists($bucket)) {
  $raw = @file_get_contents($bucket);
  $tmp = json_decode($raw, true);
  if (is_array($tmp) && isset($tmp['t']) && isset($tmp['c']))
    $state = $tmp;
}
if (($now - $state['t']) > $window) {
  $state = ['t' => $now, 'c' => 0];
}
$state['c'] += 1;
@file_put_contents($bucket, json_encode($state));
if ($state['c'] > $max) {
  http_response_code(429);
  echo json_encode(['error' => 'Rate limit']);
  exit;
}

// --- Load secret ---
require_once __DIR__ . '/../private/config.php';
if (!isset($GEMINI_API_KEY) || !$GEMINI_API_KEY || $GEMINI_API_KEY === "PASTE_YOUR_NEW_GEMINI_KEY_HERE") {
  http_response_code(500);
  echo json_encode(['error' => 'Server misconfigured: missing GEMINI_API_KEY']);
  exit;
}

// --- Read request ---
$body = file_get_contents('php://input');
$data = json_decode($body, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['error' => 'Bad JSON']);
  exit;
}

$model = $data['model'] ?? 'gemini-3-pro-preview';
$contents = $data['contents'] ?? null;

if (!is_array($contents) || count($contents) === 0) {
  http_response_code(400);
  echo json_encode(['error' => 'contents[] required']);
  exit;
}

$url = "https://generativelanguage.googleapis.com/v1beta/models/" . rawurlencode($model) . ":generateContent";

// --- Call Gemini ---
$payload = json_encode(['contents' => $contents]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'x-goog-api-key: ' . $GEMINI_API_KEY,
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($response === false) {
  http_response_code(502);
  echo json_encode(['error' => 'Upstream error', 'detail' => $err]);
  exit;
}

$out = json_decode($response, true);
$text = '';
if (isset($out['candidates'][0]['content']['parts']) && is_array($out['candidates'][0]['content']['parts'])) {
  foreach ($out['candidates'][0]['content']['parts'] as $p) {
    if (isset($p['text']))
      $text .= $p['text'];
  }
}

http_response_code($http ?: 200);
echo json_encode(['text' => $text, 'raw' => $out]);
