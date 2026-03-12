<?php
// =============================================================
// migrate_v2.php — Aşama 1.8 & 1.9 Veritabanı Migrasyonu
// Finans Kalesi SaaS
//
// Yapılanlar:
//   1. Soft Delete: silindi_mi + silinme_tarihi eklendi (6 tablo)
//   2. PII Şifreleme: _sifreli sütunlar eklendi (4 tablo)
//
// ⚠️  SADECE BİR KEZ ÇALIŞTIRILACAK — Sonra silinecek!
// =============================================================

define('BASE_PATH', dirname(__DIR__));
require_once BASE_PATH . '/config/app.php';
require_once BASE_PATH . '/config/database.php';

// Güvenlik token'ı
$token = $_GET['token'] ?? '';
// if ($token !== 'fk_migrate_v2_2026') {
//    http_response_code(403);
//    die(json_encode(['hata' => 'Yetkisiz erişim']));
// }

header('Content-Type: application/json; charset=utf-8');

$db = Database::baglan();
$sonuclar = [];

// ─── Yardımcı: ALTER çalıştır, hata olursa kaydet ───
function alter_calistir($db, $aciklama, $sql) {
    try {
        $db->exec($sql);
        return ['adim' => $aciklama, 'durum' => 'OK'];
    } catch (PDOException $e) {
        $mesaj = $e->getMessage();
        // Sütun zaten varsa başarı say (idempotent)
        if (strpos($mesaj, 'Duplicate column') !== false ||
            strpos($mesaj, 'already exists')   !== false) {
            return ['adim' => $aciklama, 'durum' => 'ZATEN_MEVCUT'];
        }
        return ['adim' => $aciklama, 'durum' => 'HATA', 'mesaj' => $mesaj];
    }
}

// ══════════════════════════════════════════════════════════════
// PLAN 1: SOFT DELETE — 6 TABLO
// ══════════════════════════════════════════════════════════════

// 1. cari_kartlar
$sonuclar[] = alter_calistir($db,
    'cari_kartlar → silindi_mi ekle',
    "ALTER TABLE cari_kartlar
     ADD COLUMN silindi_mi TINYINT(1) NOT NULL DEFAULT 0,
     ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL"
);

// 2. cari_hareketler
$sonuclar[] = alter_calistir($db,
    'cari_hareketler → silindi_mi ekle',
    "ALTER TABLE cari_hareketler
     ADD COLUMN silindi_mi TINYINT(1) NOT NULL DEFAULT 0,
     ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL"
);

// 3. cek_senetler
$sonuclar[] = alter_calistir($db,
    'cek_senetler → silindi_mi ekle',
    "ALTER TABLE cek_senetler
     ADD COLUMN silindi_mi TINYINT(1) NOT NULL DEFAULT 0,
     ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL"
);

// 4. odeme_takip
$sonuclar[] = alter_calistir($db,
    'odeme_takip → silindi_mi ekle',
    "ALTER TABLE odeme_takip
     ADD COLUMN silindi_mi TINYINT(1) NOT NULL DEFAULT 0,
     ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL"
);

// 5. yatirim_kasasi
$sonuclar[] = alter_calistir($db,
    'yatirim_kasasi → silindi_mi ekle',
    "ALTER TABLE yatirim_kasasi
     ADD COLUMN silindi_mi TINYINT(1) NOT NULL DEFAULT 0,
     ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL"
);

// 6. ortak_carisi
$sonuclar[] = alter_calistir($db,
    'ortak_carisi → silindi_mi ekle',
    "ALTER TABLE ortak_carisi
     ADD COLUMN silindi_mi TINYINT(1) NOT NULL DEFAULT 0,
     ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL"
);

// kasa_hareketler: zaten var, atlanıyor
$sonuclar[] = ['adim' => 'kasa_hareketler → silindi_mi', 'durum' => 'ZATEN_MEVCUT (onceden eklendi)'];

// ══════════════════════════════════════════════════════════════
// PLAN 2: PII ŞİFRELEME SÜTUNLARI
// ══════════════════════════════════════════════════════════════

// cari_kartlar PII sütunları
$sonuclar[] = alter_calistir($db,
    'cari_kartlar → PII _sifreli sutunlar ekle',
    "ALTER TABLE cari_kartlar
     ADD COLUMN cari_adi_sifreli      TEXT NULL,
     ADD COLUMN vergi_no_sifreli      TEXT NULL,
     ADD COLUMN telefon_sifreli       TEXT NULL,
     ADD COLUMN email_sifreli         TEXT NULL,
     ADD COLUMN adres_sifreli         TEXT NULL,
     ADD COLUMN yetkili_kisi_sifreli  TEXT NULL"
);

// cari_hareketler PII sütunları
$sonuclar[] = alter_calistir($db,
    'cari_hareketler → PII _sifreli sutunlar ekle',
    "ALTER TABLE cari_hareketler
     ADD COLUMN aciklama_sifreli TEXT NULL"
);

// cek_senetler PII sütunları
$sonuclar[] = alter_calistir($db,
    'cek_senetler → PII _sifreli sutunlar ekle',
    "ALTER TABLE cek_senetler
     ADD COLUMN banka_adi_sifreli TEXT NULL,
     ADD COLUMN sube_sifreli      TEXT NULL,
     ADD COLUMN hesap_no_sifreli  TEXT NULL,
     ADD COLUMN aciklama_sifreli  TEXT NULL"
);

// odeme_takip PII sütunları
$sonuclar[] = alter_calistir($db,
    'odeme_takip → PII _sifreli sutunlar ekle',
    "ALTER TABLE odeme_takip
     ADD COLUMN firma_adi_sifreli    TEXT NULL,
     ADD COLUMN ilgili_kisi_sifreli  TEXT NULL,
     ADD COLUMN telefon_sifreli      TEXT NULL,
     ADD COLUMN gorusme_notu_sifreli TEXT NULL"
);

// ─── Özet ───
$hatalar = array_filter($sonuclar, fn($r) => $r['durum'] === 'HATA');
$tamam   = count($sonuclar) - count($hatalar);

echo json_encode([
    'ozet'    => [
        'toplam' => count($sonuclar),
        'basarili' => $tamam,
        'hatali'   => count($hatalar),
    ],
    'adimlar' => $sonuclar,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
