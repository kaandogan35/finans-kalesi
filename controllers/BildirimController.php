<?php
/**
 * Finans Kalesi — Bildirim Controller
 *
 * GET    /api/bildirimler                   → Bildirim listesi (sayfalı)
 * GET    /api/bildirimler/okunmamis-sayisi  → Badge için okunmamış sayı
 * PUT    /api/bildirimler/:id/oku           → Okundu işaretle
 * PUT    /api/bildirimler/tumunu-oku        → Tümünü okundu yap
 * DELETE /api/bildirimler/:id               → Bildirim sil
 * GET    /api/bildirimler/tercihler         → Tercihler
 * PUT    /api/bildirimler/tercihler         → Tercihleri güncelle
 */

class BildirimController {

    private $model;

    public function __construct() {
        $this->model = new Bildirim();
    }

    /**
     * GET /api/bildirimler
     */
    public function listele($payload) {
        $sayfa = isset($_GET['sayfa']) ? max(1, (int)$_GET['sayfa']) : 1;

        $filtreler = [];
        if (isset($_GET['okundu_mu']))  $filtreler['okundu_mu'] = $_GET['okundu_mu'];
        if (!empty($_GET['tip']))       $filtreler['tip'] = $_GET['tip'];
        if (!empty($_GET['oncelik']))   $filtreler['oncelik'] = $_GET['oncelik'];

        $sonuc = $this->model->listele(
            (int)$payload['sirket_id'],
            (int)$payload['sub'],
            $sayfa,
            20,
            $filtreler
        );

        Response::basarili($sonuc);
    }

    /**
     * GET /api/bildirimler/okunmamis-sayisi
     */
    public function okunmamisSayisi($payload) {
        $sayi = $this->model->okunmamis_sayisi(
            (int)$payload['sirket_id'],
            (int)$payload['sub']
        );

        Response::basarili(['sayi' => $sayi]);
    }

    /**
     * PUT /api/bildirimler/:id/oku
     */
    public function okunduYap($payload, int $id) {
        $sonuc = $this->model->okundu_yap(
            $id,
            (int)$payload['sirket_id'],
            (int)$payload['sub']
        );

        if (!$sonuc) {
            Response::bulunamadi('Bildirim bulunamadı veya zaten okunmuş');
            return;
        }

        Response::basarili(null, 'Bildirim okundu olarak işaretlendi');
    }

    /**
     * PUT /api/bildirimler/tumunu-oku
     */
    public function tumunuOkunduYap($payload) {
        $sayi = $this->model->tumunu_okundu_yap(
            (int)$payload['sirket_id'],
            (int)$payload['sub']
        );

        Response::basarili(['guncellenen' => $sayi], 'Tüm bildirimler okundu olarak işaretlendi');
    }

    /**
     * DELETE /api/bildirimler/:id
     */
    public function sil($payload, int $id) {
        $sonuc = $this->model->sil(
            $id,
            (int)$payload['sirket_id'],
            (int)$payload['sub']
        );

        if (!$sonuc) {
            Response::bulunamadi('Bildirim bulunamadı');
            return;
        }

        Response::basarili(null, 'Bildirim silindi');
    }

    /**
     * GET /api/bildirimler/tercihler
     */
    public function tercihlerGetir($payload) {
        $tercihler = $this->model->tercihleri_getir(
            (int)$payload['sirket_id'],
            (int)$payload['sub']
        );

        Response::basarili(['tercihler' => $tercihler]);
    }

    /**
     * PUT /api/bildirimler/tercihler
     */
    public function tercihlerKaydet($payload, $girdi) {
        if (empty($girdi) || !is_array($girdi)) {
            Response::dogrulama_hatasi(['tercihler' => 'Tercih verisi gereklidir']);
            return;
        }

        // Geçerli tipleri filtrele
        $gecerli_tipler = ['odeme_vade', 'cek_vade', 'geciken_odeme', 'guvenlik', 'sistem'];
        $temiz = [];
        foreach ($girdi as $tip => $ayar) {
            if (in_array($tip, $gecerli_tipler) && is_array($ayar)) {
                $temiz[$tip] = $ayar;
            }
        }

        if (empty($temiz)) {
            Response::dogrulama_hatasi(['tercihler' => 'Geçerli tercih verisi bulunamadı']);
            return;
        }

        $this->model->tercihleri_kaydet(
            (int)$payload['sirket_id'],
            (int)$payload['sub'],
            $temiz
        );

        Response::basarili(null, 'Bildirim tercihleri güncellendi');
    }
}
