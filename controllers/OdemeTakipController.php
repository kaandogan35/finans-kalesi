<?php
// =============================================================
// OdemeTakipController.php — Ödeme/Tahsilat Takip API Kontrol Merkezi
// Finans Kalesi SaaS — Aşama 1.5
//
// Payload: $payload['sub'] = kullanıcı ID, $payload['sirket_id'] = şirket ID
// =============================================================

class OdemeTakipController {
    private $odemeTakip;

    public function __construct($db) {
        $this->odemeTakip = new OdemeTakip($db);
    }

    // ─── GET /api/odemeler ───
    public function listele($payload) {
        try {
            $filtreler = array(
                'yon'                   => isset($_GET['yon']) ? $_GET['yon'] : null,
                'durum'                 => isset($_GET['durum']) ? $_GET['durum'] : null,
                'oncelik'               => isset($_GET['oncelik']) ? $_GET['oncelik'] : null,
                'cari_id'               => isset($_GET['cari_id']) ? $_GET['cari_id'] : null,
                'arama'                 => isset($_GET['arama']) ? $_GET['arama'] : null,
                'baslangic_tarihi'      => isset($_GET['baslangic_tarihi']) ? $_GET['baslangic_tarihi'] : null,
                'bitis_tarihi'          => isset($_GET['bitis_tarihi']) ? $_GET['bitis_tarihi'] : null,
                'bugunun_hatirlatmalari'=> isset($_GET['bugunun_hatirlatmalari']) ? $_GET['bugunun_hatirlatmalari'] : null,
                'sadece_gecmis'         => isset($_GET['sadece_gecmis']) ? $_GET['sadece_gecmis'] : null,
                'siralama'              => isset($_GET['siralama']) ? $_GET['siralama'] : 'oncelik_desc',
                'sayfa'                 => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'                  => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $sonuc = $this->odemeTakip->listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('OdemeTakip listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kayit listesi alinamadi');
        }
    }

    // ─── GET /api/odemeler/ozet ───
    public function ozet($payload) {
        try {
            $istatistikler = $this->odemeTakip->ozet_istatistikler($payload['sirket_id']);
            Response::basarili($istatistikler);
        } catch (Exception $e) {
            error_log('OdemeTakip ozet hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Istatistikler alinamadi');
        }
    }

    // ─── GET /api/odemeler/{id} ───
    public function detay($payload, $kayit_id) {
        try {
            $kayit = $this->odemeTakip->getir($payload['sirket_id'], $kayit_id);

            if (!$kayit) {
                Response::bulunamadi('Kayit bulunamadi');
                return;
            }

            Response::basarili($kayit);
        } catch (Exception $e) {
            error_log('OdemeTakip detay hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kayit detayi alinamadi');
        }
    }

    // ─── POST /api/odemeler ───
    public function olustur($payload, $girdi) {
        try {
            $veri = $girdi;

            // Zorunlu alan kontrolleri
            if (empty($veri['firma_adi'])) {
                Response::dogrulama_hatasi(array('firma_adi' => 'Firma adi zorunludur'));
                return;
            }

            if (empty($veri['yon'])) {
                Response::dogrulama_hatasi(array('yon' => 'Yon zorunludur'));
                return;
            }

            $gecerli_yonler = array('tahsilat', 'odeme');
            if (!in_array($veri['yon'], $gecerli_yonler)) {
                Response::dogrulama_hatasi(array('yon' => 'Gecerli degerler: tahsilat, odeme'));
                return;
            }

            if (empty($veri['soz_tarihi'])) {
                Response::dogrulama_hatasi(array('soz_tarihi' => 'Soz tarihi zorunludur'));
                return;
            }

            // Tutar kontrolü
            if (isset($veri['tutar']) && (float)$veri['tutar'] < 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar negatif olamaz'));
                return;
            }

            // Enum kontrolleri
            if (!empty($veri['durum'])) {
                $gecerli_durumlar = array('bekliyor', 'tamamlandi', 'iptal', 'ertelendi');
                if (!in_array($veri['durum'], $gecerli_durumlar)) {
                    Response::dogrulama_hatasi(array('durum' => 'Gecerli degerler: bekliyor, tamamlandi, iptal, ertelendi'));
                    return;
                }
            }

            if (!empty($veri['oncelik'])) {
                $gecerli_oncelikler = array('dusuk', 'normal', 'yuksek', 'kritik');
                if (!in_array($veri['oncelik'], $gecerli_oncelikler)) {
                    Response::dogrulama_hatasi(array('oncelik' => 'Gecerli degerler: dusuk, normal, yuksek, kritik'));
                    return;
                }
            }

            if (!empty($veri['doviz_kodu'])) {
                $gecerli_dovizler = array('TRY', 'USD', 'EUR', 'GBP');
                if (!in_array(strtoupper($veri['doviz_kodu']), $gecerli_dovizler)) {
                    Response::dogrulama_hatasi(array('doviz_kodu' => 'Gecerli: TRY, USD, EUR, GBP'));
                    return;
                }
            }

            $kayit = $this->odemeTakip->olustur($payload['sirket_id'], $veri, $payload['sub']);
            Response::basarili($kayit, 'Kayit olusturuldu', 201);
        } catch (Exception $e) {
            error_log('OdemeTakip olustur hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kayit olusturulamadi');
        }
    }

    // ─── PUT /api/odemeler/{id} ───
    public function guncelle($payload, $kayit_id, $girdi) {
        try {
            $mevcut = $this->odemeTakip->getir($payload['sirket_id'], $kayit_id);
            if (!$mevcut) {
                Response::bulunamadi('Kayit bulunamadi');
                return;
            }

            $veri = $girdi;

            if (!empty($veri['yon'])) {
                $gecerli_yonler = array('tahsilat', 'odeme');
                if (!in_array($veri['yon'], $gecerli_yonler)) {
                    Response::dogrulama_hatasi(array('yon' => 'Gecersiz yon degeri'));
                    return;
                }
            }

            if (!empty($veri['durum'])) {
                $gecerli_durumlar = array('bekliyor', 'tamamlandi', 'iptal', 'ertelendi');
                if (!in_array($veri['durum'], $gecerli_durumlar)) {
                    Response::dogrulama_hatasi(array('durum' => 'Gecersiz durum degeri'));
                    return;
                }
            }

            if (!empty($veri['oncelik'])) {
                $gecerli_oncelikler = array('dusuk', 'normal', 'yuksek', 'kritik');
                if (!in_array($veri['oncelik'], $gecerli_oncelikler)) {
                    Response::dogrulama_hatasi(array('oncelik' => 'Gecersiz oncelik degeri'));
                    return;
                }
            }

            if (isset($veri['tutar']) && (float)$veri['tutar'] < 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar negatif olamaz'));
                return;
            }

            $kayit = $this->odemeTakip->guncelle($payload['sirket_id'], $kayit_id, $veri);

            if (!$kayit) {
                Response::hata('Guncellenecek alan bulunamadi', 422);
                return;
            }

            Response::basarili($kayit, 'Kayit guncellendi');
        } catch (Exception $e) {
            error_log('OdemeTakip guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kayit guncellenemedi');
        }
    }

    // ─── PUT /api/odemeler/{id}/tamamla ───
    public function tamamla($payload, $kayit_id, $girdi) {
        try {
            $mevcut = $this->odemeTakip->getir($payload['sirket_id'], $kayit_id);
            if (!$mevcut) {
                Response::bulunamadi('Kayit bulunamadi');
                return;
            }

            if ($mevcut['durum'] === 'tamamlandi') {
                Response::hata('Bu kayit zaten tamamlandi', 422);
                return;
            }

            $gorusme_notu = isset($girdi['gorusme_notu']) ? $girdi['gorusme_notu'] : null;

            $kayit = $this->odemeTakip->tamamla(
                $payload['sirket_id'],
                $kayit_id,
                $payload['sub'],
                $gorusme_notu
            );

            if (!$kayit) {
                Response::sunucu_hatasi('Kayit tamamlanamadi');
                return;
            }

            Response::basarili($kayit, 'Kayit tamamlandi olarak islendi');
        } catch (Exception $e) {
            error_log('OdemeTakip tamamla hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kayit tamamlanamadi');
        }
    }

    // ─── DELETE /api/odemeler/{id} ───
    public function sil($payload, $kayit_id) {
        try {
            $mevcut = $this->odemeTakip->getir($payload['sirket_id'], $kayit_id);
            if (!$mevcut) {
                Response::bulunamadi('Kayit bulunamadi');
                return;
            }

            $silindi = $this->odemeTakip->sil($payload['sirket_id'], $kayit_id);

            if ($silindi) {
                Response::basarili(null, 'Kayit silindi');
            } else {
                Response::sunucu_hatasi('Kayit silinemedi');
            }
        } catch (Exception $e) {
            error_log('OdemeTakip sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kayit silinemedi');
        }
    }
}
