<?php
/**
 * BibleAlpha API - Notas de Estudo (Study Notes)
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
            $verse_start = isset($_GET['verse']) ? (int)$_GET['verse'] : 0;
            $note_type = $_GET['type'] ?? '';
            
            $sql = "SELECT * FROM study_notes WHERE 1=1";
            $params = [];
            
            if (!empty($book)) {
                $sql .= " AND book_id = ?";
                $params[] = $book;
            }
            if ($chapter > 0) {
                $sql .= " AND chapter = ?";
                $params[] = $chapter;
            }
            if ($verse_start > 0) {
                $sql .= " AND verse_start = ?";
                $params[] = $verse_start;
            }
            if (!empty($note_type)) {
                $sql .= " AND note_type = ?";
                $params[] = $note_type;
            }
            
            $sql .= " ORDER BY chapter, verse_start";
            
            $notes = query($sql, $params);
            echo json_encode(['data' => $notes, 'count' => count($notes)]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action']) && $input['action'] === 'create') {
                $id = bin2hex(random_bytes(16));
                $book = $input['book_id'] ?? '';
                $chapter = $input['chapter'] ?? 0;
                $verse_start = $input['verse_start'] ?? 0;
                $verse_end = $input['verse_end'] ?? null;
                $note_type = $input['note_type'] ?? 'commentary';
                $content = $input['content'] ?? '';
                $title = $input['title'] ?? null;
                $source = $input['source'] ?? null;
                
                execute(
                    "INSERT INTO study_notes (id, book_id, chapter, verse_start, verse_end, note_type, content, title, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [$id, $book, $chapter, $verse_start, $verse_end, $note_type, $content, $title, $source]
                );
                
                echo json_encode(['success' => true, 'id' => $id]);
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