<?php
// =============================================================
// CekSenetController.php — Çek/Senet Modülü API Kontrol Merkezi
// Finans Kalesi SaaS — Aşama 1.4
//
// KRİTİK NOT: AuthMiddleware::dogrula() JWT payload döndürür.
// Payload yapısı:
//   $payload['sub']       → Kullanıcı ID
//   $payload['sirket_id'] → Şirket ID
//   $payload['rol']       → Yetki rolü
//   $payload['tip']       → 'access'
// =============================================================

class CekSenetController {
    private $cekSenet;

    public function __construct($db) {
        $this->cekSenet = new CekSenet($db);
    }

    // ─── GET /api/cek-senet ───
    public function listele($payload) {
        try {
            $adet = isset($_GET['adet']) ? min((int)$_GET['adet'], 500) : 50;
            $filtreler = array(
                'tur'                 => isset($_GET['tur']) ? $_GET['tur'] : null,
                'durum'               => isset($_GET['durum']) ? $_GET['durum'] : null,
                'cari_id'             => isset($_GET['cari_id']) ? $_GET['cari_id'] : null,
                'arama'               => isset($_GET['arama']) ? $_GET['arama'] : null,
                'vade_baslangic'      => isset($_GET['vade_baslangic']) ? $_GET['vade_baslangic'] : null,
                'vade_bitis'          => isset($_GET['vade_bitis']) ? $_GET['vade_bitis'] : null,
                'sadece_vadesi_gecmis'=> isset($_GET['sadece_vadesi_gecmis']) ? $_GET['sadece_vadesi_gecmis'] : null,
                'siralama'            => isset($_GET['siralama']) ? $_GET['siralama'] : 'vade_asc',
                'sayfa'               => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'                => $adet,
            );

            $sonuc = $this->cekSenet->listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('CekSenet listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cek/senet listesi alinamadi');
        }
    }

    // ─── GET /api/cek-senet/ozet ───
    public function ozet($payload) {
        try {
            $ist = $this->cekSenet->ozet_istatistikler($payload['sirket_id']);

            // Frontend'in beklediği hiyerarşik yapıya dönüştür
            $veri = array_merge($ist, array(
                'portfoyde' => array(
                    'toplam' => (float)$ist['portfoyde_tutar'],
                    'adet'   => (int)$ist['portfoyde_adet'],
                ),
                'tahsilde' => array(
                    'toplam' => (float)$ist['tahsile_tutar'],
                ),
                'odendi' => array(
                    'toplam' => (float)$ist['odendi_tutar'],
                ),
                'karsilıksız' => array(
                    'toplam' => (float)$ist['sorunlu_tutar'],
                    'adet'   => (int)$ist['sorunlu_adet'],
                ),
            ));

            Response::basarili($veri);
        } catch (Exception $e) {
            error_log('CekSenet ozet hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Istatistikler alinamadi');
        }
    }

    // ─── GET /api/cek-senet/{id} ───
    public function detay($payload, $cek_id) {
        try {
            $cek = $this->cekSenet->getir($payload['sirket_id'], $cek_id);

            if (!$cek) {
                Response::bulunamadi('Cek/senet bulunamadi');
                return;
            }

            Response::basarili($cek);
        } catch (Exception $e) {
            error_log('CekSenet detay hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cek/senet detayi alinamadi');
        }
    }

    // ─── POST /api/cek-senet ───
    public function olustur($payload, $girdi) {
        try {
            $veri = $girdi;

            // Zorunlu alan kontrolleri
            if (empty($veri['tur'])) {
                Response::dogrulama_hatasi(array('tur' => 'Tur zorunludur'));
                return;
            }

            $gecerli_turler = array('alacak_ceki', 'borc_ceki', 'alacak_senedi', 'borc_senedi');
            if (!in_array($veri['tur'], $gecerli_turler)) {
                Response::dogrulama_hatasi(array('tur' => 'Geçerli değerler: alacak_ceki, borc_ceki, alacak_senedi, borc_senedi'));
                return;
            }

            if (empty($veri['vade_tarihi'])) {
                Response::dogrulama_hatasi(array('vade_tarihi' => 'Vade tarihi zorunludur'));
                return;
            }

            if (!isset($veri['tutar']) || (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sıfırdan büyük olmalıdır'));
                return;
            }

            // Doviz kodu kontrolu
            if (!empty($veri['doviz_kodu'])) {
                $gecerli_dovizler = array('TRY', 'USD', 'EUR', 'GBP');
                if (!in_array(strtoupper($veri['doviz_kodu']), $gecerli_dovizler)) {
                    Response::dogrulama_hatasi(array('doviz_kodu' => 'Geçerli: TRY, USD, EUR, GBP'));
                    return;
                }
                $veri['doviz_kodu'] = strtoupper($veri['doviz_kodu']);
            }

            // Doviz secilmis ama kur girilmemisse
            if (!empty($veri['doviz_kodu']) && $veri['doviz_kodu'] !== 'TRY' && empty($veri['kur'])) {
                Response::dogrulama_hatasi(array('kur' => 'Döviz seçildiğinde kur değeri zorunludur'));
                return;
            }

            // Seri no benzersizlik kontrolu
            if (!empty($veri['seri_no'])) {
                if ($this->cekSenet->seri_no_var_mi($payload['sirket_id'], $veri['seri_no'])) {
                    Response::dogrulama_hatasi(array('seri_no' => 'Bu seri no zaten kayitli'));
                    return;
                }
            }

            // Plan sınırı kontrolü
            SinirKontrol::kontrol($payload, 'cek');

            $cek = $this->cekSenet->olustur($payload['sirket_id'], $veri, $payload['sub']);
            Response::basarili($cek, 'Cek/senet kaydedildi', 201);
        } catch (Exception $e) {
            error_log('CekSenet olustur hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cek/senet olusturulamadi');
        }
    }

    // ─── PUT /api/cek-senet/{id} ───
    public function guncelle($payload, $cek_id, $girdi) {
        try {
            $mevcut = $this->cekSenet->getir($payload['sirket_id'], $cek_id);
            if (!$mevcut) {
                Response::bulunamadi('Cek/senet bulunamadi');
                return;
            }

            $veri = $girdi;

            // Tur degistirilemez
            if (!empty($veri['tur'])) {
                Response::dogrulama_hatasi(array('tur' => 'Tür değiştirilemez. Silip yeniden ekleyin'));
                return;
            }

            if (isset($veri['tutar']) && (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sıfırdan büyük olmalıdır'));
                return;
            }

            if (!empty($veri['doviz_kodu'])) {
                $gecerli_dovizler = array('TRY', 'USD', 'EUR', 'GBP');
                if (!in_array(strtoupper($veri['doviz_kodu']), $gecerli_dovizler)) {
                    Response::dogrulama_hatasi(array('doviz_kodu' => 'Geçerli: TRY, USD, EUR, GBP'));
                    return;
                }
                $veri['doviz_kodu'] = strtoupper($veri['doviz_kodu']);
            }

            // Seri no degisiyorsa benzersizlik kontrolu
            if (!empty($veri['seri_no'])) {
                if ($this->cekSenet->seri_no_var_mi($payload['sirket_id'], $veri['seri_no'], $cek_id)) {
                    Response::dogrulama_hatasi(array('seri_no' => 'Bu seri no baska bir kayita ait'));
                    return;
                }
            }

            $cek = $this->cekSenet->guncelle($payload['sirket_id'], $cek_id, $veri);

            if (!$cek) {
                Response::hata('Guncellenecek alan bulunamadi', 422);
                return;
            }

            Response::basarili($cek, 'Cek/senet guncellendi');
        } catch (Exception $e) {
            error_log('CekSenet guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cek/senet guncellenemedi');
        }
    }

    // ─── PUT /api/cek-senet/{id}/durum ───
    public function durum_degistir($payload, $cek_id, $girdi) {
        try {
            $mevcut = $this->cekSenet->getir($payload['sirket_id'], $cek_id);
            if (!$mevcut) {
                Response::bulunamadi('Cek/senet bulunamadi');
                return;
            }

            $veri = $girdi;

            if (empty($veri['durum'])) {
                Response::dogrulama_hatasi(array('durum' => 'Yeni durum zorunludur'));
                return;
            }

            $gecerli_durumlar = array(
                'portfoyde', 'tahsile_verildi', 'tahsil_edildi',
                'cirolandi', 'karsiliksiz', 'iade_edildi', 'odendi', 'protestolu'
            );
            if (!in_array($veri['durum'], $gecerli_durumlar)) {
                Response::dogrulama_hatasi(array('durum' => 'Geçersiz durum değeri'));
                return;
            }

            // Durum geçiş kuralları — mantıksız geçişleri engelle
            $gecis_kurallari = array(
                'portfoyde'       => array('tahsile_verildi', 'cirolandi', 'karsiliksiz', 'iade_edildi', 'odendi'),
                'tahsile_verildi' => array('tahsil_edildi', 'karsiliksiz', 'iade_edildi', 'portfoyde'),
                'tahsil_edildi'   => array(), // Son durum — geri alınamaz
                'cirolandi'       => array('karsiliksiz', 'iade_edildi'),
                'karsiliksiz'     => array('protestolu', 'iade_edildi'),
                'iade_edildi'     => array('portfoyde'),
                'odendi'          => array(), // Son durum
                'protestolu'      => array(), // Son durum
            );
            $mevcut_durum = $mevcut['durum'] ?? 'portfoyde';
            $izinli_gecisler = $gecis_kurallari[$mevcut_durum] ?? array();
            if (!in_array($veri['durum'], $izinli_gecisler)) {
                Response::dogrulama_hatasi(array(
                    'durum' => "'$mevcut_durum' durumundan '$veri[durum]' durumuna gecis yapilamaz"
                ));
                return;
            }

            // Ciro durumu icin ciro_edilen_cari_id zorunlu
            if ($veri['durum'] === 'cirolandi' && empty($veri['ciro_edilen_cari_id'])) {
                Response::dogrulama_hatasi(array('ciro_edilen_cari_id' => 'Ciro durumunda ciro edilen cari zorunludur'));
                return;
            }

            $ekstra = array(
                'tahsil_tarihi'       => isset($veri['tahsil_tarihi']) ? $veri['tahsil_tarihi'] : null,
                'ciro_edilen_cari_id' => isset($veri['ciro_edilen_cari_id']) ? $veri['ciro_edilen_cari_id'] : null,
                'ciro_tarihi'         => isset($veri['ciro_tarihi']) ? $veri['ciro_tarihi'] : null,
                'ekleyen_id'          => (int)$payload['sub'],
            );

            $cek = $this->cekSenet->durum_degistir($payload['sirket_id'], $cek_id, $veri['durum'], $ekstra);

            if (!$cek) {
                Response::sunucu_hatasi('Durum degistirilemedi');
                return;
            }

            // Karşılıksız çek → acil bildirim maili
            if ($veri['durum'] === 'karsiliksiz') {
                try {
                    $db   = Database::baglan();

                    // Şirket sahibinin emailini al
                    $stmt = $db->prepare(
                        "SELECT k.email, k.ad_soyad, s.firma_adi
                         FROM kullanicilar k
                         JOIN sirketler s ON s.id = k.sirket_id
                         WHERE k.sirket_id = :sid AND k.rol = 'sahip' AND k.aktif_mi = 1
                         LIMIT 1"
                    );
                    $stmt->execute([':sid' => (int)$payload['sirket_id']]);
                    $sahip = $stmt->fetch();

                    // Cari bakiyesi (opsiyonel — hata olsa da mail gitsin)
                    $cari_bakiye = 0;
                    if (!empty($mevcut['cari_id'])) {
                        $stmt2 = $db->prepare(
                            "SELECT bakiye FROM cari_kartlar WHERE id = :id AND sirket_id = :sid"
                        );
                        $stmt2->execute([
                            ':id'  => (int)$mevcut['cari_id'],
                            ':sid' => (int)$payload['sirket_id'],
                        ]);
                        $cari_row = $stmt2->fetch();
                        if ($cari_row) $cari_bakiye = (float)$cari_row['bakiye'];
                    }

                    if ($sahip) {
                        $cek_detay = [
                            'cek_id'     => $cek_id,
                            'seri_no'    => $mevcut['seri_no'] ?? ('ÇEK-' . $cek_id),
                            'cari_adi'   => $mevcut['cari_adi'] ?? '—',
                            'tutar'      => $mevcut['tutar'] ?? 0,
                            'vade_tarihi'=> $mevcut['vade_tarihi'] ?? date('Y-m-d'),
                        ];

                        $html = MailSablonlar::karsilıksızCek(
                            $sahip['firma_adi'],
                            $cek_detay,
                            $cari_bakiye
                        );

                        MailHelper::gonder(
                            $sahip['email'],
                            'ACİL: Karşılıksız Çek Bildirimi',
                            $html,
                            (int)$payload['sirket_id'],
                            (int)$payload['sub'],
                            'karsilıksız_cek'
                        );
                    }
                } catch (Exception $e) {
                    error_log('Karşılıksız çek maili gönderilemedi: ' . $e->getMessage());
                }
            }

            Response::basarili($cek, 'Durum guncellendi: ' . $veri['durum']);
        } catch (Exception $e) {
            error_log('CekSenet durum hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Durum degistirilemedi');
        }
    }

    // ─── DELETE /api/cek-senet/{id} ───
    public function sil($payload, $cek_id) {
        try {
            $mevcut = $this->cekSenet->getir($payload['sirket_id'], $cek_id);
            if (!$mevcut) {
                Response::bulunamadi('Cek/senet bulunamadi');
                return;
            }

            $silindi = $this->cekSenet->sil($payload['sirket_id'], $cek_id);

            if ($silindi) {
                Response::basarili(null, 'Cek/senet silindi');
            } else {
                Response::sunucu_hatasi('Cek/senet silinemedi');
            }
        } catch (Exception $e) {
            error_log('CekSenet sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cek/senet silinemedi');
        }
    }
}
