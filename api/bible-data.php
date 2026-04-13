<?php
/**
 * BibleAlpha API - Dados Bíblicos Adicionais
 * Cross References, Dictionary, People, Places, Lexicon
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
$type = $_GET['type'] ?? '';

try {
    switch ($type) {
        case 'crossrefs':
            $book = $_GET['book'] ?? '';
            $chapter = isset($_GET['chapter']) ? (int)$_GET['chapter'] : 0;
            
            $sql = "SELECT * FROM bible_cross_references WHERE 1=1";
            $params = [];
            
            if (!empty($book)) {
                $sql .= " AND book_id = ?";
                $params[] = $book;
            }
            if ($chapter > 0) {
                $sql .= " AND chapter = ?";
                $params[] = $chapter;
            }
            
            $data = query($sql, $params);
            echo json_encode(['data' => $data]);
            break;
            
        case 'dictionary':
            $term = $_GET['term'] ?? '';
            
            if (!empty($term)) {
                $data = query(
                    "SELECT * FROM bible_dictionary WHERE term LIKE ? LIMIT 10",
                    ['%' . $term . '%']
                );
            } else {
                $data = query("SELECT * FROM bible_dictionary ORDER BY term LIMIT 50");
            }
            echo json_encode(['data' => $data]);
            break;
            
        case 'people':
            $name = $_GET['name'] ?? '';
            
            if (!empty($name)) {
                $data = query(
                    "SELECT * FROM bible_people WHERE name LIKE ? LIMIT 10",
                    ['%' . $name . '%']
                );
            } else {
                $data = query("SELECT * FROM bible_people ORDER BY name LIMIT 50");
            }
            echo json_encode(['data' => $data]);
            break;
            
        case 'places':
            $name = $_GET['name'] ?? '';
            
            if (!empty($name)) {
                $data = query(
                    "SELECT * FROM bible_places WHERE name LIKE ? LIMIT 10",
                    ['%' . $name . '%']
                );
            } else {
                $data = query("SELECT * FROM bible_places ORDER BY name LIMIT 50");
            }
            echo json_encode(['data' => $data]);
            break;
            
        case 'lexicon':
            $strongs = $_GET['strongs'] ?? '';
            $search = $_GET['search'] ?? '';
            
            if (!empty($strongs)) {
                $data = query("SELECT * FROM strongs_lexicon WHERE strongs_number = ?", [$strongs]);
            } elseif (!empty($search)) {
                $data = query(
                    "SELECT * FROM strongs_lexicon WHERE original_word LIKE ? OR gloss LIKE ? LIMIT 10",
                    ['%' . $search . '%', '%' . $search . '%']
                );
            } else {
                $data = query("SELECT * FROM strongs_lexicon LIMIT 50");
            }
            echo json_encode(['data' => $data]);
            break;
            
        case 'interlinear':
            $book = $_GET['book'] ?? '';
            $chapter = isset($_GET['chapter']) ? (int)$_GET['chapter'] : 0;
            $verse = isset($_GET['verse']) ? (int)$_GET['verse'] : 0;
            
            $sql = "SELECT * FROM interlinear_words WHERE 1=1";
            $params = [];
            
            if (!empty($book)) {
                $sql .= " AND book_id = ?";
                $params[] = $book;
            }
            if ($chapter > 0) {
                $sql .= " AND chapter = ?";
                $params[] = $chapter;
            }
            if ($verse > 0) {
                $sql .= " AND verse = ?";
                $params[] = $verse;
            }
            
            $sql .= " ORDER BY word_num";
            
            $data = query($sql, $params);
            echo json_encode(['data' => $data]);
            break;
            
        default:
            echo json_encode(['error' => 'Invalid type. Use: crossrefs, dictionary, people, places, lexicon, interlinear']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}