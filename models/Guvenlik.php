<?php
/**
 * ParamGo — Güvenlik Modeli
 *
 * Güvenlik modülü veritabanı sorguları:
 * - Aktif oturumlar (refresh_tokens)
 * - Giriş geçmişi (giris_gecmisi)
 * - Güvenlik ayarları (guvenlik_ayarlari)
 * - 2FA yönetimi (kullanicilar tablosu)
 * - Sistem logları (sistem_loglari)
 */

class Guvenlik {

    private $db;

    public function __construct() {
        $this->db = Database::baglan();
    }

    // ─── AKTİF OTURUMLAR ──────────────────────────────────────────

    /**
     * Kullanıcının aktif oturumlarını listele
     */
    public function oturumlari_listele(int $kullanici_id): array {
        $sql = "SELECT id, cihaz_bilgisi, ip_adresi, son_kullanim, olusturma_tarihi, bitis_tarihi
                FROM refresh_tokens
                WHERE kullanici_id = :kid AND silindi_mi = 0 AND bitis_tarihi > NOW()
                ORDER BY son_kullanim DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':kid' => $kullanici_id]);
        return $stmt->fetchAll();
    }

    /**
     * Tek bir oturumu sonlandır (kullanıcıya ait olduğunu kontrol et)
     */
    public function oturum_sonlandir(int $oturum_id, int $kullanici_id): bool {
        $sql = "UPDATE refresh_tokens SET silindi_mi = 1
                WHERE id = :id AND kullanici_id = :kid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $oturum_id, ':kid' => $kullanici_id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Mevcut oturum hariç tüm oturumları sonlandır
     */
    public function diger_oturumlari_sonlandir(int $kullanici_id, string $mevcut_token_hash): int {
        $sql = "UPDATE refresh_tokens SET silindi_mi = 1
                WHERE kullanici_id = :kid AND token_hash != :hash AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':kid' => $kullanici_id, ':hash' => $mevcut_token_hash]);
        return $stmt->rowCount();
    }

    // ─── GİRİŞ GEÇMİŞİ ────────────────────────────────────────────

    /**
     * Giriş geçmişi kaydet
     */
    public function giris_kaydet(array $veri): void {
        $sql = "INSERT INTO giris_gecmisi
                    (sirket_id, kullanici_id, ip_adresi, cihaz_bilgisi, cihaz_turu, tarayici, isletim_sistemi, basarili_mi, basarisizlik_nedeni)
                VALUES (:sirket_id, :kullanici_id, :ip, :cihaz, :cihaz_turu, :tarayici, :os, :basarili, :neden)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':sirket_id'     => $veri['sirket_id'],
            ':kullanici_id'  => $veri['kullanici_id'],
            ':ip'            => $veri['ip_adresi'],
            ':cihaz'         => $veri['cihaz_bilgisi'] ?? null,
            ':cihaz_turu'    => $veri['cihaz_turu'] ?? null,
            ':tarayici'      => $veri['tarayici'] ?? null,
            ':os'            => $veri['isletim_sistemi'] ?? null,
            ':basarili'      => $veri['basarili_mi'] ?? 1,
            ':neden'         => $veri['basarisizlik_nedeni'] ?? null,
        ]);
    }

    /**
     * Giriş geçmişini listele (sayfalı)
     */
    public function giris_gecmisi_listele(int $sirket_id, int $kullanici_id = 0, int $sayfa = 1, int $limit = 20): array {
        $offset = ($sayfa - 1) * $limit;

        $where = "WHERE g.sirket_id = :sirket_id";
        $params = [':sirket_id' => $sirket_id];

        if ($kullanici_id > 0) {
            $where .= " AND g.kullanici_id = :kid";
            $params[':kid'] = $kullanici_id;
        }

        // Toplam sayı
        $sql_say = "SELECT COUNT(*) as toplam FROM giris_gecmisi g $where";
        $stmt = $this->db->prepare($sql_say);
        $stmt->execute($params);
        $toplam = (int) $stmt->fetch()['toplam'];

        // Kayıtlar
        $sql = "SELECT g.*, k.ad_soyad, k.email
                FROM giris_gecmisi g
                LEFT JOIN kullanicilar k ON k.id = g.kullanici_id
                $where
                ORDER BY g.tarih DESC
                LIMIT $limit OFFSET $offset";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $kayitlar = $stmt->fetchAll();

        return [
            'kayitlar' => $kayitlar,
            'toplam'   => $toplam,
            'sayfa'    => $sayfa,
            'limit'    => $limit,
            'toplam_sayfa' => ceil($toplam / $limit),
        ];
    }

    // ─── GÜVENLİK AYARLARI ─────────────────────────────────────────

    /**
     * Şirketin güvenlik ayarlarını getir (yoksa varsayılan döner)
     */
    public function ayarlar_getir(int $sirket_id): array {
        $sql = "SELECT * FROM guvenlik_ayarlari WHERE sirket_id = :sid LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sid' => $sirket_id]);
        $ayar = $stmt->fetch();

        if ($ayar) {
            // JSON alanları decode et
            $ayar['ip_beyaz_liste'] = $ayar['ip_beyaz_liste'] ? json_decode($ayar['ip_beyaz_liste'], true) : [];
            $ayar['ip_kara_liste']  = $ayar['ip_kara_liste']  ? json_decode($ayar['ip_kara_liste'], true) : [];
            return $ayar;
        }

        // Varsayılan ayarlar (henüz kaydedilmemiş)
        return [
            'sirket_id'                   => $sirket_id,
            'min_sifre_uzunlugu'          => 8,
            'sifre_buyuk_harf_zorunlu'    => 0,
            'sifre_sayi_zorunlu'          => 0,
            'sifre_ozel_karakter_zorunlu' => 0,
            'sifre_gecerlilik_gun'        => null,
            'hesap_kilitleme_deneme'      => 5,
            'hesap_kilitleme_sure_dk'     => 30,
            'ip_beyaz_liste'              => [],
            'ip_kara_liste'               => [],
        ];
    }

    /**
     * Güvenlik ayarlarını kaydet veya güncelle (UPSERT)
     */
    public function ayarlar_kaydet(int $sirket_id, array $veri): bool {
        $sql = "INSERT INTO guvenlik_ayarlari
                    (sirket_id, min_sifre_uzunlugu, sifre_buyuk_harf_zorunlu, sifre_sayi_zorunlu,
                     sifre_ozel_karakter_zorunlu, sifre_gecerlilik_gun,
                     hesap_kilitleme_deneme, hesap_kilitleme_sure_dk,
                     ip_beyaz_liste, ip_kara_liste)
                VALUES
                    (:sid, :min, :buyuk, :sayi, :ozel, :gecerlilik, :deneme, :sure, :beyaz, :kara)
                ON DUPLICATE KEY UPDATE
                    min_sifre_uzunlugu          = VALUES(min_sifre_uzunlugu),
                    sifre_buyuk_harf_zorunlu    = VALUES(sifre_buyuk_harf_zorunlu),
                    sifre_sayi_zorunlu          = VALUES(sifre_sayi_zorunlu),
                    sifre_ozel_karakter_zorunlu = VALUES(sifre_ozel_karakter_zorunlu),
                    sifre_gecerlilik_gun        = VALUES(sifre_gecerlilik_gun),
                    hesap_kilitleme_deneme      = VALUES(hesap_kilitleme_deneme),
                    hesap_kilitleme_sure_dk     = VALUES(hesap_kilitleme_sure_dk),
                    ip_beyaz_liste              = VALUES(ip_beyaz_liste),
                    ip_kara_liste               = VALUES(ip_kara_liste)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':sid'        => $sirket_id,
            ':min'        => $veri['min_sifre_uzunlugu'] ?? 8,
            ':buyuk'      => $veri['sifre_buyuk_harf_zorunlu'] ?? 0,
            ':sayi'       => $veri['sifre_sayi_zorunlu'] ?? 0,
            ':ozel'       => $veri['sifre_ozel_karakter_zorunlu'] ?? 0,
            ':gecerlilik' => $veri['sifre_gecerlilik_gun'] ?? null,
            ':deneme'     => $veri['hesap_kilitleme_deneme'] ?? 5,
            ':sure'       => $veri['hesap_kilitleme_sure_dk'] ?? 30,
            ':beyaz'      => !empty($veri['ip_beyaz_liste']) ? json_encode($veri['ip_beyaz_liste']) : null,
            ':kara'       => !empty($veri['ip_kara_liste'])  ? json_encode($veri['ip_kara_liste'])  : null,
        ]);
    }

    // ─── 2FA YÖNETİMİ ──────────────────────────────────────────────

    /**
     * 2FA secret'ı şifreli olarak kaydet
     */
    public function iki_faktor_secret_kaydet(int $kullanici_id, int $sirket_id, string $secret_sifreli, string $yedek_kodlar_sifreli): bool {
        $sql = "UPDATE kullanicilar
                SET iki_faktor_gizli_sifreli = :secret,
                    iki_faktor_yedek_kodlar_sifreli = :yedek
                WHERE id = :id AND sirket_id = :sid";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':secret' => $secret_sifreli,
            ':yedek'  => $yedek_kodlar_sifreli,
            ':id'     => $kullanici_id,
            ':sid'    => $sirket_id,
        ]);
    }

    /**
     * 2FA'yı aktifleştir
     */
    public function iki_faktor_aktiflestir(int $kullanici_id, int $sirket_id): bool {
        $sql = "UPDATE kullanicilar SET iki_faktor_aktif = 1
                WHERE id = :id AND sirket_id = :sid";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $kullanici_id, ':sid' => $sirket_id]);
    }

    /**
     * 2FA'yı devre dışı bırak
     */
    public function iki_faktor_devre_disi(int $kullanici_id, int $sirket_id): bool {
        $sql = "UPDATE kullanicilar
                SET iki_faktor_aktif = 0,
                    iki_faktor_gizli_sifreli = NULL,
                    iki_faktor_yedek_kodlar_sifreli = NULL
                WHERE id = :id AND sirket_id = :sid";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $kullanici_id, ':sid' => $sirket_id]);
    }

    /**
     * Kullanıcının 2FA bilgilerini getir
     */
    public function iki_faktor_bilgi(int $kullanici_id, int $sirket_id): ?array {
        $sql = "SELECT iki_faktor_aktif, iki_faktor_gizli_sifreli, iki_faktor_yedek_kodlar_sifreli
                FROM kullanicilar
                WHERE id = :id AND sirket_id = :sid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $kullanici_id, ':sid' => $sirket_id]);
        return $stmt->fetch() ?: null;
    }

    // ─── HESAP KİLİTLEME ───────────────────────────────────────────

    /**
     * Başarısız giriş sayısını artır
     */
    public function basarisiz_giris_artir(int $kullanici_id): void {
        $sql = "UPDATE kullanicilar
                SET basarisiz_giris_sayisi = basarisiz_giris_sayisi + 1
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $kullanici_id]);
    }

    /**
     * Hesabı kilitle (belirli süre)
     */
    public function hesap_kilitle(int $kullanici_id, int $sure_dk): void {
        $sql = "UPDATE kullanicilar
                SET hesap_kilitli_kadar = DATE_ADD(NOW(), INTERVAL :sure MINUTE)
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sure' => $sure_dk, ':id' => $kullanici_id]);
    }

    /**
     * Başarısız giriş sayısını sıfırla (başarılı girişte)
     */
    public function basarisiz_giris_sifirla(int $kullanici_id): void {
        $sql = "UPDATE kullanicilar
                SET basarisiz_giris_sayisi = 0, hesap_kilitli_kadar = NULL
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $kullanici_id]);
    }

    /**
     * Hesap kilitli mi kontrol et
     */
    public function hesap_kilitli_mi(int $kullanici_id): ?string {
        $sql = "SELECT hesap_kilitli_kadar FROM kullanicilar
                WHERE id = :id AND hesap_kilitli_kadar > NOW()";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $kullanici_id]);
        $sonuc = $stmt->fetch();
        return $sonuc ? $sonuc['hesap_kilitli_kadar'] : null;
    }

    /**
     * Kullanıcının başarısız giriş sayısını al
     */
    public function basarisiz_giris_sayisi(int $kullanici_id): int {
        $sql = "SELECT basarisiz_giris_sayisi FROM kullanicilar WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $kullanici_id]);
        $sonuc = $stmt->fetch();
        return $sonuc ? (int) $sonuc['basarisiz_giris_sayisi'] : 0;
    }

    // ─── SİSTEM LOGLARI ─────────────────────────────────────────────

    /**
     * Sistem loglarını filtreli listele
     */
    public function loglar_listele(int $sirket_id, array $filtreler = [], int $sayfa = 1, int $limit = 30): array {
        $offset = ($sayfa - 1) * $limit;
        $where = "WHERE sirket_id = :sirket_id";
        $params = [':sirket_id' => $sirket_id];

        if (!empty($filtreler['islem_tipi'])) {
            $where .= " AND islem_tipi = :tip";
            $params[':tip'] = $filtreler['islem_tipi'];
        }

        if (!empty($filtreler['kullanici_id'])) {
            $where .= " AND kullanici_id = :kid";
            $params[':kid'] = (int) $filtreler['kullanici_id'];
        }

        if (!empty($filtreler['baslangic'])) {
            $where .= " AND tarih >= :baslangic";
            $params[':baslangic'] = $filtreler['baslangic'];
        }

        if (!empty($filtreler['bitis'])) {
            $where .= " AND tarih <= :bitis";
            $params[':bitis'] = $filtreler['bitis'];
        }

        // Toplam
        $sql_say = "SELECT COUNT(*) as toplam FROM sistem_loglari $where";
        $stmt = $this->db->prepare($sql_say);
        $stmt->execute($params);
        $toplam = (int) $stmt->fetch()['toplam'];

        // Kayıtlar
        $sql = "SELECT * FROM sistem_loglari $where ORDER BY tarih DESC LIMIT $limit OFFSET $offset";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $kayitlar = $stmt->fetchAll();

        return [
            'kayitlar' => $kayitlar,
            'toplam'   => $toplam,
            'sayfa'    => $sayfa,
            'limit'    => $limit,
            'toplam_sayfa' => ceil($toplam / $limit),
        ];
    }

    // ─── KVKK VERİ DIŞA AKTARMA ────────────────────────────────────

    /**
     * Kullanıcının tüm verilerini topla (KVKK uyumluluğu)
     */
    public function veri_disa_aktar(int $sirket_id): array {
        $veri = [];

        // Şirket bilgileri
        $stmt = $this->db->prepare("SELECT * FROM sirketler WHERE id = :sid");
        $stmt->execute([':sid' => $sirket_id]);
        $veri['sirket'] = $stmt->fetch();

        // Kullanıcılar
        $stmt = $this->db->prepare("SELECT id, ad_soyad, email, telefon, rol, aktif_mi, son_giris, olusturma_tarihi FROM kullanicilar WHERE sirket_id = :sid");
        $stmt->execute([':sid' => $sirket_id]);
        $veri['kullanicilar'] = $stmt->fetchAll();

        // Cari kartlar (şifreli alanlar çözülecek)
        $stmt = $this->db->prepare("SELECT * FROM cari_kartlar WHERE sirket_id = :sid AND silindi_mi = 0");
        $stmt->execute([':sid' => $sirket_id]);
        $cariler = $stmt->fetchAll();
        foreach ($cariler as &$cari) {
            $cari['cari_adi'] = SistemKripto::coz($cari['cari_adi_sifreli']);
            unset($cari['cari_adi_sifreli'], $cari['vergi_no_sifreli'], $cari['telefon_sifreli'], $cari['email_sifreli'], $cari['adres_sifreli'], $cari['yetkili_kisi_sifreli']);
        }
        $veri['cariler'] = $cariler;

        // Sistem logları (son 90 gün)
        $stmt = $this->db->prepare("SELECT * FROM sistem_loglari WHERE sirket_id = :sid AND tarih >= DATE_SUB(NOW(), INTERVAL 90 DAY) ORDER BY tarih DESC");
        $stmt->execute([':sid' => $sirket_id]);
        $veri['sistem_loglari'] = $stmt->fetchAll();

        // Giriş geçmişi (son 90 gün)
        $stmt = $this->db->prepare("SELECT * FROM giris_gecmisi WHERE sirket_id = :sid AND tarih >= DATE_SUB(NOW(), INTERVAL 90 DAY) ORDER BY tarih DESC");
        $stmt->execute([':sid' => $sirket_id]);
        $veri['giris_gecmisi'] = $stmt->fetchAll();

        $veri['disa_aktarma_tarihi'] = date('Y-m-d H:i:s');

        return $veri;
    }

    // ─── YARDIMCI ───────────────────────────────────────────────────

    /**
     * User-Agent string'inden cihaz bilgisi çıkar
     */
    public static function user_agent_cozumle(?string $ua): array {
        if (empty($ua)) {
            return ['cihaz_turu' => 'bilinmiyor', 'tarayici' => 'Bilinmiyor', 'isletim_sistemi' => 'Bilinmiyor'];
        }

        // Cihaz türü
        $cihaz_turu = 'masaustu';
        if (preg_match('/Mobile|Android.*Mobile|iPhone|iPod/i', $ua)) {
            $cihaz_turu = 'mobil';
        } elseif (preg_match('/iPad|Android(?!.*Mobile)|Tablet/i', $ua)) {
            $cihaz_turu = 'tablet';
        }

        // Tarayıcı
        $tarayici = 'Bilinmiyor';
        if (preg_match('/Edg\/(\d+)/i', $ua, $m))          $tarayici = 'Edge ' . $m[1];
        elseif (preg_match('/OPR\/(\d+)/i', $ua, $m))       $tarayici = 'Opera ' . $m[1];
        elseif (preg_match('/Chrome\/(\d+)/i', $ua, $m))     $tarayici = 'Chrome ' . $m[1];
        elseif (preg_match('/Firefox\/(\d+)/i', $ua, $m))    $tarayici = 'Firefox ' . $m[1];
        elseif (preg_match('/Safari\/(\d+)/i', $ua) && preg_match('/Version\/(\d+)/i', $ua, $m))
                                                              $tarayici = 'Safari ' . $m[1];

        // İşletim sistemi
        $os = 'Bilinmiyor';
        if (preg_match('/Windows NT 10/i', $ua))             $os = 'Windows 10/11';
        elseif (preg_match('/Windows NT/i', $ua))             $os = 'Windows';
        elseif (preg_match('/Mac OS X (\d+[\._]\d+)/i', $ua, $m))
                                                              $os = 'macOS ' . str_replace('_', '.', $m[1]);
        elseif (preg_match('/Android (\d+(\.\d+)?)/i', $ua, $m))
                                                              $os = 'Android ' . $m[1];
        elseif (preg_match('/iPhone OS (\d+)/i', $ua, $m))    $os = 'iOS ' . $m[1];
        elseif (preg_match('/Linux/i', $ua))                  $os = 'Linux';

        return [
            'cihaz_turu'      => $cihaz_turu,
            'tarayici'        => $tarayici,
            'isletim_sistemi' => $os,
        ];
    }
}
