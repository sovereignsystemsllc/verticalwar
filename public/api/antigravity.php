<?php
header('Content-Type: application/json');

// --- CORS & Preflight ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// --- 1. EXTRACT AUTHORIZATION HEADER ---
$auth_header = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} else {
    $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
    if (isset($headers['Authorization'])) {
        $auth_header = $headers['Authorization'];
    }
}

if (empty($auth_header)) {
    http_response_code(401);
    echo json_encode(["error" => "Missing Authorization header"]);
    exit;
}

if (!preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid Authorization format. Expected Bearer <token>"]);
    exit;
}
$jwt = $matches[1];

// --- 2. VALIDATE JWT WITH SUPABASE ---
$supabase_url = 'https://zazzwdaexhkeusfjdphv.supabase.co';
$supabase_anon_key = 'sb_publishable_M2pQlMXjvnzLuYpkdOzTmQ_-zX0zQPg';

$ch = curl_init("$supabase_url/auth/v1/user");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabase_anon_key",
    "Authorization: Bearer $jwt"
]);

$user_response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized. Invalid JWT.", "details" => json_decode($user_response)]);
    exit;
}

// --- 2.5 RATE LIMITING (THE ARMOR) ---
$user_data = json_decode($user_response, true);
$user_id = $user_data['id'] ?? 'unknown_user';

$limit = 20; // Generous: 20 requests per minute
$window = 60; // 60 seconds

$rate_limit_dir = __DIR__ . '/.rates';
if (!is_dir($rate_limit_dir)) {
    @mkdir($rate_limit_dir, 0777, true);
}

// Create a small htaccess to block direct web access to the .rates directory
if (!file_exists($rate_limit_dir . '/.htaccess')) {
    @file_put_contents($rate_limit_dir . '/.htaccess', 'Require all denied');
}

$rate_file = $rate_limit_dir . '/rate_' . md5($user_id) . '.json';
$current_time = time();
$requests = [];

if (file_exists($rate_file)) {
    $content = @file_get_contents($rate_file);
    if ($content) {
        $requests = json_decode($content, true) ?: [];
    }
}

$requests = array_filter($requests, function($timestamp) use ($current_time, $window) {
    return ($current_time - $timestamp) < $window;
});

if (count($requests) >= $limit) {
    http_response_code(429);
    echo json_encode(["text" => "[ SYSTEM OVERLOAD :: Rate limit exceeded. Please wait 60 seconds before transmitting again. ]"]);
    exit;
}

$requests[] = $current_time;
@file_put_contents($rate_file, json_encode(array_values($requests)));

// --- 3. FORWARD REQUEST TO GEMINI API ---
$input_data = file_get_contents('php://input');
$data = json_decode($input_data, true);

if (!isset($data['contents'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing 'contents' in payload"]);
    exit;
}

$gemini_api_key = 'AIzaSyBWQyiNXrPjwW5umF2--fgAY9QPIbcOinQ';
$model = isset($data['model']) ? $data['model'] : 'gemini-1.5-pro-latest';

$gemini_payload = [
    "contents" => $data['contents']
];

$gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$gemini_api_key";

$ch_gemini = curl_init($gemini_url);
curl_setopt($ch_gemini, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_gemini, CURLOPT_POST, true);
curl_setopt($ch_gemini, CURLOPT_POSTFIELDS, json_encode($gemini_payload));
curl_setopt($ch_gemini, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

$gemini_response = curl_exec($ch_gemini);
$gemini_http_code = curl_getinfo($ch_gemini, CURLINFO_HTTP_CODE);
curl_close($ch_gemini);

// If error from Gemini
if ($gemini_http_code !== 200) {
    http_response_code(502);
    echo json_encode([
        "error" => "Error communicating with Gemini API", 
        "details" => json_decode($gemini_response)
    ]);
    exit;
}

// Parse Gemini Response
$gemini_json = json_decode($gemini_response, true);
$response_text = "";

if (isset($gemini_json['candidates'][0]['content']['parts'][0]['text'])) {
    $response_text = $gemini_json['candidates'][0]['content']['parts'][0]['text'];
} else {
    $response_text = "[ SYSTEM ERROR :: MALFORMED GEMINI RESPONSE ]\n" . json_encode($gemini_json);
}

// Return formatted text as expected by the frontend hook
http_response_code(200);
echo json_encode(["text" => $response_text]);
?>
