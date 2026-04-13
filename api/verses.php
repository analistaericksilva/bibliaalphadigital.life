<?php
/**
 * BibleAlpha API - Versículos
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
            $book = $_GET['book'] ?? '';
            $chapter = isset($_GET['chapter']) ? (int)$_GET['chapter'] : 0;
            
            if (empty($book)) {
                echo json_encode(['error' => 'Book parameter required']);
                break;
            }
            
            if ($chapter > 0) {
                $verses = query(
                    "SELECT * FROM bible_verses WHERE book_id = ? AND chapter = ? ORDER BY verse_number",
                    [$book, $chapter]
                );
            } else {
                $verses = query(
                    "SELECT * FROM bible_verses WHERE book_id = ? ORDER BY chapter, verse_number LIMIT 100",
                    [$book]
                );
            }
            
            echo json_encode(['data' => $verses, 'count' => count($verses)]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action']) && $input['action'] === 'search') {
                $search = $input['query'] ?? '';
                $results = query(
                    "SELECT * FROM bible_verses WHERE text LIKE ? LIMIT 20",
                    ['%' . $search . '%']
                );
                echo json_encode(['data' => $results]);
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