<?php
/**
 * BibleAlpha API - Usuários (Profiles, Auth)
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $user_id = $_GET['user_id'] ?? '';
            $email = $_GET['email'] ?? '';
            
            if (!empty($user_id)) {
                $profile = queryOne("SELECT * FROM profiles WHERE user_id = ?", [$user_id]);
            } elseif (!empty($email)) {
                $profile = queryOne("SELECT * FROM profiles WHERE email = ?", [$email]);
            } else {
                echo json_encode(['error' => 'user_id or email required']);
                break;
            }
            
            if ($profile) {
                // Get user role
                $role = queryOne("SELECT role FROM user_roles WHERE user_id = ?", [$profile['user_id']]);
                $profile['role'] = $role ? $role['role'] : 'subscriber';
            }
            
            echo json_encode(['data' => $profile]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action']) && $input['action'] === 'register') {
                $id = bin2hex(random_bytes(16));
                $user_id = bin2hex(random_bytes(16));
                $email = $input['email'] ?? '';
                $full_name = $input['full_name'] ?? '';
                
                // Check if email exists
                $exists = queryOne("SELECT id FROM profiles WHERE email = ?", [$email]);
                if ($exists) {
                    echo json_encode(['error' => 'Email already registered']);
                    break;
                }
                
                execute(
                    "INSERT INTO profiles (id, user_id, email, full_name, status) VALUES (?, ?, ?, ?, ?)",
                    [$id, $user_id, $email, $full_name, 'pending']
                );
                
                execute(
                    "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)",
                    [bin2hex(random_bytes(16)), $user_id, 'subscriber']
                );
                
                echo json_encode(['success' => true, 'user_id' => $user_id]);
            } else {
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        default:
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}