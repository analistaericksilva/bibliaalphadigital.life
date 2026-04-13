<?php
/**
 * BibleAlpha - Setup Tables
 * Execute via browser: https://bibliaalphadigital.life/api/setup.php
 */

header('Content-Type: text/plain');
error_reporting(E_ALL);

echo "BibleAlpha - Database Setup\n";
echo "===========================\n\n";

$host = 'localhost';
$dbname = 'inte5419_biblia';
$user = 'inte5419';
$pass = 'Er158471';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    echo "[OK] Connected to database\n\n";
    
    $tables = [
        'bible_verses' => "
            CREATE TABLE IF NOT EXISTS bible_verses (
                id VARCHAR(36) PRIMARY KEY,
                book_id VARCHAR(10) NOT NULL,
                book_name VARCHAR(50) NOT NULL,
                chapter INT NOT NULL,
                verse_number INT NOT NULL,
                text TEXT NOT NULL,
                testament VARCHAR(20) DEFAULT 'old',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_book_chapter (book_id, chapter)
            )",
        'study_notes' => "
            CREATE TABLE IF NOT EXISTS study_notes (
                id VARCHAR(36) PRIMARY KEY,
                book_id VARCHAR(10) NOT NULL,
                chapter INT NOT NULL,
                verse_start INT NOT NULL,
                verse_end INT,
                note_type VARCHAR(50) DEFAULT 'commentary',
                title VARCHAR(255),
                content TEXT NOT NULL,
                source VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
        'profiles' => "
            CREATE TABLE IF NOT EXISTS profiles (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL UNIQUE,
                email VARCHAR(255),
                full_name VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
        'user_roles' => "
            CREATE TABLE IF NOT EXISTS user_roles (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                role VARCHAR(20) DEFAULT 'subscriber'
            )",
        'highlights' => "
            CREATE TABLE IF NOT EXISTS highlights (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                book_id VARCHAR(10) NOT NULL,
                chapter INT NOT NULL,
                verse INT NOT NULL,
                color VARCHAR(20) DEFAULT '#ffeb3b',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
        'favorites' => "
            CREATE TABLE IF NOT EXISTS favorites (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                book_id VARCHAR(10) NOT NULL,
                chapter INT NOT NULL,
                verse INT NOT NULL,
                label VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
        'personal_notes' => "
            CREATE TABLE IF NOT EXISTS personal_notes (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                book_id VARCHAR(10) NOT NULL,
                chapter INT NOT NULL,
                verse INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
        'reading_history' => "
            CREATE TABLE IF NOT EXISTS reading_history (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                book_id VARCHAR(10) NOT NULL,
                chapter INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"
    ];
    
    foreach ($tables as $name => $sql) {
        try {
            $pdo->exec($sql);
            echo "[OK] Table '$name' created/exists\n";
        } catch (PDOException $e) {
            echo "[ERROR] Table '$name': " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n[DONE] Setup complete!\n";
    
} catch (PDOException $e) {
    echo "[ERROR] Database connection failed: " . $e->getMessage() . "\n";
    echo "\nPlease check config.php for correct credentials.\n";
}