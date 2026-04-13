<?php
/**
 * BibleAlpha API - Dados do Usuário
 * (Highlights, Favorites, Personal Notes, Reading History)
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $table = $_GET['table'] ?? '';
    $user_id = $_GET['user_id'] ?? '';
    
    if (empty($user_id)) {
        echo json_encode(['error' => 'user_id required']);
        exit;
    }
    
    switch ($method) {
        case 'GET':
            $allowed_tables = ['highlights', 'favorites', 'personal_notes', 'reading_history'];
            if (!in_array($table, $allowed_tables)) {
                echo json_encode(['error' => 'Invalid table']);
                break;
            }
            
            $data = query("SELECT * FROM $table WHERE user_id = ? ORDER BY created_at DESC", [$user_id]);
            echo json_encode(['data' => $data, 'count' => count($data)]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
            
            if ($action === 'add_highlight') {
                $id = bin2hex(random_bytes(16));
                execute(
                    "INSERT INTO highlights (id, user_id, book_id, chapter, verse, color) VALUES (?, ?, ?, ?, ?, ?)",
                    [$id, $user_id, $input['book_id'], $input['chapter'], $input['verse'], $input['color'] ?? '#ffeb3b']
                );
                echo json_encode(['success' => true, 'id' => $id]);
            } elseif ($action === 'add_favorite') {
                $id = bin2hex(random_bytes(16));
                execute(
                    "INSERT INTO favorites (id, user_id, book_id, chapter, verse, label) VALUES (?, ?, ?, ?, ?, ?)",
                    [$id, $user_id, $input['book_id'], $input['chapter'], $input['verse'], $input['label'] ?? '']
                );
                echo json_encode(['success' => true, 'id' => $id]);
            } elseif ($action === 'add_note') {
                $id = bin2hex(random_bytes(16));
                execute(
                    "INSERT INTO personal_notes (id, user_id, book_id, chapter, verse, content) VALUES (?, ?, ?, ?, ?, ?)",
                    [$id, $user_id, $input['book_id'], $input['chapter'], $input['verse'], $input['content']]
                );
                echo json_encode(['success' => true, 'id' => $id]);
            } elseif ($action === 'add_history') {
                $id = bin2hex(random_bytes(16));
                execute(
                    "INSERT INTO reading_history (id, user_id, book_id, chapter) VALUES (?, ?, ?, ?)",
                    [$id, $user_id, $input['book_id'], $input['chapter']]
                );
                echo json_encode(['success' => true, 'id' => $id]);
            } else {
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? '';
            $allowed_tables = ['highlights', 'favorites', 'personal_notes'];
            if (!in_array($table, $allowed_tables) || empty($id)) {
                echo json_encode(['error' => 'Invalid request']);
                break;
            }
            
            execute("DELETE FROM $table WHERE id = ? AND user_id = ?", [$id, $user_id]);
            echo json_encode(['success' => true]);
            break;
            
        default:
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}