<?php
/**
 * BibleAlpha - Configuração do Banco de Dados
 * Napoleon Hosting
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'inte5419_biblia');
define('DB_USER', 'inte5419');
define('DB_PASS', 'Er158471');
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    return $pdo;
}

function query($sql, $params = []) {
    $pdo = getDB();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function queryOne($sql, $params = []) {
    $pdo = getDB();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetch() ?: null;
}

function execute($sql, $params = []) {
    $pdo = getDB();
    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}