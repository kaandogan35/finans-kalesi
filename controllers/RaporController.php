<?php
/**
 * ParamGo — Rapor Controller
 *
 * Raporlama endpoint'leri:
 * - Cari yaşlandırma
 * - Nakit akış
 * - Çek/senet portföy
 * - Ödeme özet
 * - Genel özet
 * - Rapor geçmişi
 */

class RaporController {

    private Rapor $model;

    public function __construct() {
        $this->model = new Rapor();
    }

    // ─── Cari Yaşlandırma ──────────────────────────────────────────

    public function cariYaslandirma(array $payload): void {
        $sirket_id = (int)$payload['sirket_id'];

        $filtreler = [];
        if (!empty($_GET['cari_id']))           $filtreler['cari_id'] = (int)$_GET['cari_id'];
        if (!empty($_GET['cari_turu']))         $filtreler['cari_turu'] = $_GET['cari_turu'];
        if (!empty($_GET['baslangic_tarihi']))  $filtreler['baslangic_tarihi'] = $_GET['baslangic_tarihi'];
        if (!empty($_GET['bitis_tarihi']))      $filtreler['bitis_tarihi'] = $_GET['bitis_tarihi'];

        $veri = $this->model->cari_yaslandirma($sirket_id, $filtreler);

        // Geçmişe kaydet
        $kullanici_id = (int)$payload['sub'];
        $this->model->gecmis_kaydet($sirket_id, $kullanici_id, 'cari_yaslandirma', 'Cari Yaşlandırma Raporu', 'ekran', $filtreler ?: null);

        Response::basarili($veri);
    }

    // ─── Nakit Akış ────────────────────────────────────────────────

    public function nakitAkis(array $payload): void {
        $sirket_id = (int)$payload['sirket_id'];

        $filtreler = [];
        if (!empty($_GET['baslangic_tarihi'])) $filtreler['baslangic_tarihi'] = $_GET['baslangic_tarihi'];
        if (!empty($_GET['bitis_tarihi']))     $filtreler['bitis_tarihi'] = $_GET['bitis_tarihi'];

        $veri = $this->model->nakit_akis($sirket_id, $filtreler);

        $kullanici_id = (int)$payload['sub'];
        $this->model->gecmis_kaydet($sirket_id, $kullanici_id, 'nakit_akis', 'Nakit Akış Raporu', 'ekran', $filtreler ?: null);

        Response::basarili($veri);
    }

    // ─── Çek/Senet Portföy ────────────────────────────────────────

    public function cekPortfoy(array $payload): void {
        $sirket_id = (int)$payload['sirket_id'];

        $filtreler = [];
        if (!empty($_GET['tur']))              $filtreler['tur'] = $_GET['tur'];
        if (!empty($_GET['durum']))             $filtreler['durum'] = $_GET['durum'];
        if (!empty($_GET['baslangic_tarihi'])) $filtreler['baslangic_tarihi'] = $_GET['baslangic_tarihi'];
        if (!empty($_GET['bitis_tarihi']))     $filtreler['bitis_tarihi'] = $_GET['bitis_tarihi'];

        $veri = $this->model->cek_portfoy($sirket_id, $filtreler);

        $kullanici_id = (int)$payload['sub'];
        $this->model->gecmis_kaydet($sirket_id, $kullanici_id, 'cek_portfoy', 'Çek/Senet Portföy Raporu', 'ekran', $filtreler ?: null);

        Response::basarili($veri);
    }

    // ─── Ödeme Özet ───────────────────────────────────────────────

    public function odemeOzet(array $payload): void {
        $sirket_id = (int)$payload['sirket_id'];

        $filtreler = [];
        if (!empty($_GET['baslangic_tarihi'])) $filtreler['baslangic_tarihi'] = $_GET['baslangic_tarihi'];
        if (!empty($_GET['bitis_tarihi']))     $filtreler['bitis_tarihi'] = $_GET['bitis_tarihi'];
        if (!empty($_GET['durum']))             $filtreler['durum'] = $_GET['durum'];

        $veri = $this->model->odeme_ozet($sirket_id, $filtreler);

        $kullanici_id = (int)$payload['sub'];
        $this->model->gecmis_kaydet($sirket_id, $kullanici_id, 'odeme_ozet', 'Ödeme Özet Raporu', 'ekran', $filtreler ?: null);

        Response::basarili($veri);
    }

    // ─── Genel Özet ───────────────────────────────────────────────

    public function genelOzet(array $payload): void {
        $sirket_id = (int)$payload['sirket_id'];

        $veri = $this->model->genel_ozet($sirket_id);

        $kullanici_id = (int)$payload['sub'];
        $this->model->gecmis_kaydet($sirket_id, $kullanici_id, 'genel_ozet', 'Genel Finansal Özet', 'ekran');

        Response::basarili($veri);
    }

    // ─── Hesaplamalar ─────────────────────────────────────────────

    public function hesaplamalar(array $payload): void {
        $sirket_id = (int)$payload['sirket_id'];

        $veri = $this->model->hesaplamalar($sirket_id);

        Response::basarili($veri);
    }

    // ─── Rapor Geçmişi ────────────────────────────────────────────

    public function gecmis(array $payload): void {
        $sirket_id    = (int)$payload['sirket_id'];
        $kullanici_id = (int)$payload['sub'];
        $limit        = min((int)($_GET['limit'] ?? 20), 100);

        $veri = $this->model->gecmis_listele($sirket_id, $kullanici_id, $limit);

        Response::basarili($veri);
    }
}
