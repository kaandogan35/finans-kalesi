<?php
// =============================================================
// CekSenetController.php — Çek/Senet Modülü API Kontrol Merkezi
// ParamGo SaaS — Aşama 1.4
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
    private $db;

    public function __construct($db) {
        $this->cekSenet = new CekSenet($db);
        $this->db = $db;
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
            PlanKontrol::yazmaKontrol($payload);
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
            PlanKontrol::yazmaKontrol($payload);
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
                'cirolandi'       => array('tahsil_edildi', 'portfoyde', 'karsiliksiz', 'iade_edildi'),
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

    // ─── POST /api/cek-senet/toplu ───
    // tab: portfoy | tahsil | kendi | ciro
    // Zorunlu alanlar: cari_adi, vade_tarihi, tutar, banka_adi
    // Tahsil tab ek zorunlu: teslim_bankasi  | Ciro tab ek zorunlu: ciro_edilen
    public function topluYukle($payload) {
        try {
            if (empty($_FILES['dosya']) || $_FILES['dosya']['error'] !== UPLOAD_ERR_OK) {
                Response::hata('Dosya yuklenemedi', 400);
                return;
            }

            $tab = trim($_POST['tab'] ?? '');
            $gecerli_tablar = ['portfoy', 'tahsil', 'kendi', 'ciro'];
            if (!in_array($tab, $gecerli_tablar)) {
                Response::hata('Gecersiz tab parametresi', 400);
                return;
            }

            // Tab'a göre tur/durum/cari_turu belirle
            $tab_ayar = [
                'portfoy' => ['tur' => 'alacak_ceki', 'durum' => 'portfoyde',       'cari_turu' => 'musteri'],
                'tahsil'  => ['tur' => 'alacak_ceki', 'durum' => 'tahsile_verildi', 'cari_turu' => 'musteri'],
                'kendi'   => ['tur' => 'borc_ceki',   'durum' => 'portfoyde',       'cari_turu' => 'tedarikci'],
                'ciro'    => ['tur' => 'alacak_ceki', 'durum' => 'cirolandi',       'cari_turu' => 'musteri'],
            ][$tab];

            // Kolon eşleştirme haritası
            $eslesme_ham = $_POST['kolon_eslesme'] ?? '{}';
            $kolon_eslesme = json_decode($eslesme_ham, true) ?? [];
            $eslesme = [];
            foreach ($kolon_eslesme as $csv_k => $sistem_k) {
                $eslesme[mb_strtolower(trim($csv_k))] = trim($sistem_k);
            }

            $dosya = $_FILES['dosya']['tmp_name'];
            $handle = fopen($dosya, 'r');
            if (!$handle) {
                Response::hata('Dosya acilamadi', 400);
                return;
            }

            $raw_basliklar = fgetcsv($handle, 0, ',');
            if (!$raw_basliklar) {
                fclose($handle);
                Response::hata('Dosya bos veya gecersiz', 400);
                return;
            }
            $raw_basliklar = array_map(function($b) { return mb_strtolower(trim($b)); }, $raw_basliklar);

            // Kolon eşleştirmesi uygula
            $sistem_basliklar = [];
            foreach ($raw_basliklar as $csv_k) {
                $sistem_basliklar[] = $eslesme[$csv_k] ?? $csv_k;
            }

            // Cari önbelleği oluştur (şifreli ad → id)
            $cari_cache = [];
            $stmt = $this->db->prepare(
                "SELECT id, cari_adi_sifreli FROM cari_kartlar WHERE sirket_id = ? AND silindi_mi = 0 AND aktif_mi = 1"
            );
            $stmt->execute([$payload['sirket_id']]);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $c) {
                if (!empty($c['cari_adi_sifreli'])) {
                    $adi = SistemKripto::coz($c['cari_adi_sifreli']);
                    if ($adi !== null) {
                        $cari_cache[mb_strtolower(trim($adi))] = (int)$c['id'];
                    }
                }
            }

            $basarili_sayisi = 0;
            $hatali_sayisi   = 0;
            $hatali_satirlar = [];
            $satirNo = 1;
            $toplam_islenen  = 0;
            $LIMIT = 50;

            while (($satir = fgetcsv($handle, 0, ',')) !== false) {
                // 50 satır limiti
                if ($toplam_islenen >= $LIMIT) {
                    $hatali_satirlar[] = ['satir' => $satirNo + 1, 'hata' => "Tek seferde en fazla {$LIMIT} kayit yuklenebilir"];
                    break;
                }
                $satirNo++;
                // Boş satırları atla
                if (implode('', array_map('trim', $satir)) === '') continue;
                $toplam_islenen++;
                if (count($satir) < count($sistem_basliklar)) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'Eksik sutun sayisi'];
                    continue;
                }

                $veri = array_combine($sistem_basliklar, array_map('trim', $satir));

                // ── Zorunlu alan kontrolleri ──
                if (empty($veri['cari_adi'])) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'cari_adi zorunludur'];
                    continue;
                }
                if (empty($veri['vade_tarihi'])) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'vade_tarihi zorunludur'];
                    continue;
                }
                if (empty($veri['banka_adi'])) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'banka_adi zorunludur'];
                    continue;
                }
                $tutar_ham = preg_replace('/[^\d,.]/', '', $veri['tutar'] ?? '');
                if ($tutar_ham === '') {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'tutar zorunludur'];
                    continue;
                }

                // Tab'a özel zorunlu alanlar
                if ($tab === 'tahsil' && empty($veri['teslim_bankasi'])) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'teslim_bankasi zorunludur'];
                    continue;
                }
                if ($tab === 'ciro' && empty($veri['ciro_edilen'])) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'ciro_edilen zorunludur'];
                    continue;
                }

                try {
                    // Plan sınırı
                    SinirKontrol::kontrol($payload, 'cek');

                    // Tutarı parse et (Türkçe ve İngilizce format desteği)
                    // 8.000.000 → 8000000  |  15.000 → 15000  |  15000.50 → 15000.50
                    // 1.500,75 → 1500.75   |  15000,50 → 15000.50
                    if (strpos($tutar_ham, ',') !== false && strpos($tutar_ham, '.') !== false) {
                        // Hem nokta hem virgül var (ör: 1.500,75 veya 1,500.75)
                        $last_dot   = strrpos($tutar_ham, '.');
                        $last_comma = strrpos($tutar_ham, ',');
                        if ($last_comma > $last_dot) {
                            $tutar_ham = str_replace('.', '', $tutar_ham);
                            $tutar_ham = str_replace(',', '.', $tutar_ham);
                        } else {
                            $tutar_ham = str_replace(',', '', $tutar_ham);
                        }
                    } elseif (strpos($tutar_ham, ',') !== false) {
                        // Sadece virgül var (ör: 15000,50)
                        $tutar_ham = str_replace(',', '.', $tutar_ham);
                    } elseif (strpos($tutar_ham, '.') !== false) {
                        // Sadece nokta var — binlik mi ondalık mı?
                        // Her nokta-grubunun son kısmı 3 haneyse → binlik ayraç
                        $parcalar = explode('.', $tutar_ham);
                        $binlik = true;
                        for ($pi = 1; $pi < count($parcalar); $pi++) {
                            if (strlen($parcalar[$pi]) !== 3) { $binlik = false; break; }
                        }
                        if ($binlik && count($parcalar) > 1) {
                            // 8.000.000 → 8000000  |  15.000 → 15000
                            $tutar_ham = str_replace('.', '', $tutar_ham);
                        }
                        // Aksi halde nokta ondalık ayracı: 15000.50 → 15000.50 (olduğu gibi)
                    }
                    $tutar = (float)$tutar_ham;
                    if ($tutar <= 0) {
                        $hatali_sayisi++;
                        $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'Tutar sifirdan buyuk olmalidir'];
                        continue;
                    }

                    // Vade tarihini normalize et (25.05.2026 / 25/05/2026 → 2026-05-25)
                    $veri['vade_tarihi'] = $this->_tarihNormalize($veri['vade_tarihi']);
                    if (!$veri['vade_tarihi']) {
                        $hatali_sayisi++;
                        $hatali_satirlar[] = ['satir' => $satirNo, 'hata' => 'vade_tarihi gecersiz format'];
                        continue;
                    }

                    // İşlem tarihi (yoksa bugün)
                    $kesilme_tarihi = !empty($veri['islem_tarihi'])
                        ? ($this->_tarihNormalize($veri['islem_tarihi']) ?: date('Y-m-d'))
                        : date('Y-m-d');

                    // Cari bul / oluştur
                    $cari_id = $this->_cariIdBul(
                        $payload['sirket_id'],
                        $veri['cari_adi'],
                        $tab_ayar['cari_turu'],
                        $cari_cache
                    );

                    // Ciro tab: kime verildi
                    $ciro_edilen_cari_id = null;
                    if ($tab === 'ciro') {
                        $ciro_edilen_cari_id = $this->_cariIdBul(
                            $payload['sirket_id'],
                            $veri['ciro_edilen'],
                            'tedarikci',
                            $cari_cache
                        );
                    }

                    // Tahsil tab: teslim bankasını açıklamaya ekle
                    $aciklama = $veri['aciklama'] ?? null;
                    if ($tab === 'tahsil' && !empty($veri['teslim_bankasi'])) {
                        $aciklama = '[Teslim Bankası: ' . $veri['teslim_bankasi'] . ']'
                                  . ($aciklama ? ' ' . $aciklama : '');
                    }

                    $cek_veri = [
                        'cari_id'        => $cari_id,
                        'tur'            => $tab_ayar['tur'],
                        'durum'          => $tab_ayar['durum'],
                        'seri_no'        => !empty($veri['seri_no'])   ? $veri['seri_no']  : null,
                        'banka_adi'      => $veri['banka_adi'],
                        'sube'           => !empty($veri['sube'])      ? $veri['sube']     : null,
                        'hesap_no'       => !empty($veri['hesap_no'])  ? $veri['hesap_no'] : null,
                        'kesilme_tarihi' => $kesilme_tarihi,
                        'vade_tarihi'    => $veri['vade_tarihi'],
                        'tutar'          => $tutar,
                        'doviz_kodu'     => 'TRY',
                        'kur'            => 1.0,
                        'aciklama'       => $aciklama,
                    ];

                    $yeni_cek = $this->cekSenet->olustur($payload['sirket_id'], $cek_veri, $payload['sub']);

                    // Ciro tab: ciro_edilen_cari_id ve ciro_tarihi ata
                    if ($tab === 'ciro' && $ciro_edilen_cari_id && $yeni_cek) {
                        $updStmt = $this->db->prepare(
                            "UPDATE cek_senetler SET ciro_edilen_cari_id = ?, ciro_tarihi = ?
                             WHERE id = ? AND sirket_id = ?"
                        );
                        $updStmt->execute([$ciro_edilen_cari_id, $kesilme_tarihi, (int)$yeni_cek['id'], (int)$payload['sirket_id']]);
                    }

                    $basarili_sayisi++;

                } catch (Exception $kayitHata) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = [
                        'satir' => $satirNo,
                        'hata'  => $kayitHata->getMessage(),
                    ];
                }
            }

            fclose($handle);

            Response::basarili([
                'basarili_sayisi' => $basarili_sayisi,
                'hatali_sayisi'   => $hatali_sayisi,
                'hatali_satirlar' => $hatali_satirlar,
            ], "{$basarili_sayisi} cek/senet yuklendi");

        } catch (Exception $e) {
            error_log('CekSenet toplu yukle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Toplu yukleme basarisiz');
        }
    }

    // ─── Yardımcı: Cari adına göre ID bul, yoksa oluştur ───
    // $cari_cache referans olarak alınır — yeni oluşturulan cariler önbelleğe eklenir
    private function _cariIdBul($sirket_id, $cari_adi, $cari_turu, array &$cari_cache) {
        $aranan = mb_strtolower(trim($cari_adi));
        if (isset($cari_cache[$aranan])) {
            return $cari_cache[$aranan];
        }
        // Yeni cari oluştur
        $cariKart = new CariKart($this->db);
        $yeni = $cariKart->olustur($sirket_id, [
            'cari_adi'  => trim($cari_adi),
            'cari_turu' => $cari_turu,
        ]);
        $cari_cache[$aranan] = (int)$yeni['id'];
        return (int)$yeni['id'];
    }

    // ─── Yardımcı: Tarih formatını YYYY-MM-DD'ye çevir ───
    // Desteklenen formatlar: 25.05.2026 | 25/05/2026 | 2026-05-25 | 2026/05/25
    private function _tarihNormalize($tarih) {
        $tarih = trim($tarih);
        if (empty($tarih)) return null;

        // Zaten YYYY-MM-DD ise
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $tarih)) {
            return $tarih;
        }
        // GG.AA.YYYY veya GG/AA/YYYY
        if (preg_match('#^(\d{1,2})[./](\d{1,2})[./](\d{4})$#', $tarih, $m)) {
            $gun = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $ay  = str_pad($m[2], 2, '0', STR_PAD_LEFT);
            $yil = $m[3];
            if (checkdate((int)$ay, (int)$gun, (int)$yil)) {
                return "{$yil}-{$ay}-{$gun}";
            }
        }
        // YYYY/MM/DD
        if (preg_match('#^(\d{4})[./](\d{1,2})[./](\d{1,2})$#', $tarih, $m)) {
            $yil = $m[1]; $ay = str_pad($m[2], 2, '0', STR_PAD_LEFT); $gun = str_pad($m[3], 2, '0', STR_PAD_LEFT);
            if (checkdate((int)$ay, (int)$gun, (int)$yil)) {
                return "{$yil}-{$ay}-{$gun}";
            }
        }
        return null;
    }

    // ─── DELETE /api/cek-senet/{id} ───
    public function sil($payload, $cek_id) {
        try {
            PlanKontrol::yazmaKontrol($payload);
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
