<?php
// =============================================================
// OdemeTakipController.php — Ödeme/Tahsilat Takip API Kontrol Merkezi
// Finans Kalesi SaaS — Aşama 2.0 (Yeni Tab Sistemi + aramaKaydi)
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
            $adet = isset($_GET['adet']) ? min((int)$_GET['adet'], 500) : 50;
            $filtreler = [
                'tab'              => $_GET['tab']              ?? null,
                'yon'              => $_GET['yon']              ?? null,
                'durum'            => $_GET['durum']            ?? null,
                'oncelik'          => $_GET['oncelik']          ?? null,
                'cari_id'          => $_GET['cari_id']          ?? null,
                'arama'            => $_GET['arama']            ?? null,
                'baslangic_tarihi' => $_GET['baslangic_tarihi'] ?? null,
                'bitis_tarihi'     => $_GET['bitis_tarihi']     ?? null,
                'siralama'         => $_GET['siralama']         ?? 'oncelik_desc',
                'sayfa'            => $_GET['sayfa']            ?? 1,
                'adet'             => $adet,
                // Eski uyumluluk
                'bugunun_hatirlatmalari' => $_GET['bugunun_hatirlatmalari'] ?? null,
                'sadece_gecmis'          => $_GET['sadece_gecmis']          ?? null,
            ];

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

            // cari_id VEYA firma_adi zorunlu
            if (empty($veri['cari_id']) && empty($veri['firma_adi'])) {
                Response::dogrulama_hatasi(['cari_id' => 'cari_id veya firma_adi zorunludur']);
                return;
            }

            // Duplicate kontrolü: aynı cari için aktif kayıt varsa reddet
            if (!empty($veri['cari_id'])) {
                if ($this->odemeTakip->aktif_kayit_var_mi($payload['sirket_id'], (int)$veri['cari_id'])) {
                    Response::hata('Bu cari zaten aktif ödeme takibinde. Önce mevcut kaydı tamamlayın veya iptal edin.', 409);
                    return;
                }
            }

            // yon kontrolü (opsiyonel, default tahsilat)
            if (!empty($veri['yon'])) {
                if (!in_array($veri['yon'], ['tahsilat', 'odeme'])) {
                    Response::dogrulama_hatasi(['yon' => 'Geçerli değerler: tahsilat, odeme']);
                    return;
                }
            }

            // Tutar kontrolü (opsiyonel)
            if (isset($veri['tutar']) && (float)$veri['tutar'] < 0) {
                Response::dogrulama_hatasi(['tutar' => 'Tutar negatif olamaz']);
                return;
            }

            // Durum kontrolü
            if (!empty($veri['durum'])) {
                $gecerli_durumlar = ['bekliyor', 'tamamlandi', 'iptal', 'cevap_vermedi', 'soz_verildi'];
                if (!in_array($veri['durum'], $gecerli_durumlar)) {
                    Response::dogrulama_hatasi(['durum' => 'Geçersiz durum değeri']);
                    return;
                }
            }

            if (!empty($veri['oncelik'])) {
                if (!in_array($veri['oncelik'], ['dusuk', 'normal', 'yuksek', 'kritik'])) {
                    Response::dogrulama_hatasi(['oncelik' => 'Geçerli değerler: dusuk, normal, yuksek, kritik']);
                    return;
                }
            }

            if (!empty($veri['doviz_kodu'])) {
                if (!in_array(strtoupper($veri['doviz_kodu']), ['TRY', 'USD', 'EUR', 'GBP'])) {
                    Response::dogrulama_hatasi(['doviz_kodu' => 'Geçerli: TRY, USD, EUR, GBP']);
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

            if (!empty($veri['yon']) && !in_array($veri['yon'], ['tahsilat', 'odeme'])) {
                Response::dogrulama_hatasi(['yon' => 'Geçersiz yön değeri']);
                return;
            }

            if (!empty($veri['durum'])) {
                $gecerli_durumlar = ['bekliyor', 'tamamlandi', 'iptal', 'cevap_vermedi', 'soz_verildi'];
                if (!in_array($veri['durum'], $gecerli_durumlar)) {
                    Response::dogrulama_hatasi(['durum' => 'Geçersiz durum değeri']);
                    return;
                }
            }

            if (!empty($veri['oncelik']) && !in_array($veri['oncelik'], ['dusuk', 'normal', 'yuksek', 'kritik'])) {
                Response::dogrulama_hatasi(['oncelik' => 'Geçersiz öncelik değeri']);
                return;
            }

            if (isset($veri['tutar']) && (float)$veri['tutar'] < 0) {
                Response::dogrulama_hatasi(['tutar' => 'Tutar negatif olamaz']);
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

    // ─── PUT /api/odemeler/{id}/arama-kaydi ───
    public function aramaKaydi($payload, $kayit_id, $girdi) {
        try {
            $mevcut = $this->odemeTakip->getir($payload['sirket_id'], $kayit_id);
            if (!$mevcut) {
                Response::bulunamadi('Kayit bulunamadi');
                return;
            }

            $aksiyon = $girdi['aksiyon'] ?? '';
            $gecerli_aksiyonlar = ['cevap_vermedi', 'soz_verildi', 'tamamlandi'];
            if (!in_array($aksiyon, $gecerli_aksiyonlar)) {
                Response::dogrulama_hatasi(['aksiyon' => 'Geçerli değerler: cevap_vermedi, soz_verildi, tamamlandi']);
                return;
            }

            // Aksiyon bazlı zorunlu alan kontrolleri
            if ($aksiyon === 'cevap_vermedi' && empty($girdi['hatirlatma_tarihi'])) {
                Response::dogrulama_hatasi(['hatirlatma_tarihi' => 'Cevap vermedi için tekrar arama tarihi zorunludur']);
                return;
            }

            if ($aksiyon === 'soz_verildi' && empty($girdi['soz_tarihi'])) {
                Response::dogrulama_hatasi(['soz_tarihi' => 'Söz tarihi zorunludur']);
                return;
            }

            $kayit = $this->odemeTakip->aramaKaydi(
                $payload['sirket_id'],
                $kayit_id,
                $girdi,
                $payload['sub']
            );

            if (!$kayit) {
                Response::sunucu_hatasi('Arama kaydi islenemedii');
                return;
            }

            Response::basarili($kayit, 'Arama kaydi islendi');
        } catch (Exception $e) {
            error_log('OdemeTakip aramaKaydi hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Arama kaydi islenemedii');
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
