<?php
/**
 * ParamGo — Abonelik Modeli
 *
 * Abonelik ve ödeme geçmişi veritabanı işlemleri.
 * v2: 7 gün deneme + Standart/Kurumsal ücretli planlar
 */

class Abonelik {

    private PDO $db;

    // Plan fiyatları (TL) — App Store Connect fiyat dilimleri
    public const FIYATLAR = [
        'standart' => [
            'aylik'  => 399.99,
            'yillik' => 3999.99,
        ],
        'kurumsal' => [
            'aylik'  => 599.99,
            'yillik' => 5999.99,
        ],
    ];

    // Deneme süresi (gün)
    public const DENEME_SURESI_GUN = 7;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // ─────────────────────────────────────────
    // PLAN BİLGİSİ
    // ─────────────────────────────────────────

    /**
     * Şirketin aktif abonelik kaydını döndür
     */
    public function guncelPlan(int $sirket_id): ?array {
        $stmt = $this->db->prepare("
            SELECT a.*, s.abonelik_plani, s.abonelik_bitis, s.deneme_bitis
            FROM abonelikler a
            JOIN sirketler s ON s.id = a.sirket_id
            WHERE a.sirket_id = :sirket_id
              AND a.durum = 'aktif'
            ORDER BY a.olusturma_tarihi DESC
            LIMIT 1
        ");
        $stmt->execute([':sirket_id' => $sirket_id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Sirketler tablosundan doğrudan plan bilgisini oku
     * guncelPlan() null döndürdüğünde fallback olarak kullanılır
     */
    public function sirketPlanBilgisi(int $sirket_id): ?array {
        $stmt = $this->db->prepare("
            SELECT abonelik_plani, abonelik_bitis, deneme_bitis
            FROM sirketler
            WHERE id = :sirket_id
        ");
        $stmt->execute([':sirket_id' => $sirket_id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Şirketin abonelik planını güncelle
     * Hem sirketler tablosunu hem abonelikler tablosunu günceller
     */
    public function planGuncelle(
        int     $sirket_id,
        string  $plan_adi,
        ?string $odeme_donemi,
        ?string $odeme_kanali,
        ?string $bitis_tarihi
    ): int {
        $this->db->beginTransaction();
        try {
            // Eski aktif aboneliği pasife çek
            $stmt = $this->db->prepare("
                UPDATE abonelikler
                SET durum = 'pasif'
                WHERE sirket_id = :sirket_id AND durum = 'aktif'
            ");
            $stmt->execute([':sirket_id' => $sirket_id]);

            // Yeni abonelik kaydı oluştur
            $stmt = $this->db->prepare("
                INSERT INTO abonelikler
                    (sirket_id, plan_adi, odeme_donemi, odeme_kanali, baslangic_tarihi, bitis_tarihi, durum)
                VALUES
                    (:sirket_id, :plan_adi, :odeme_donemi, :odeme_kanali, NOW(), :bitis_tarihi, 'aktif')
            ");
            $stmt->execute([
                ':sirket_id'    => $sirket_id,
                ':plan_adi'     => $plan_adi,
                ':odeme_donemi' => $odeme_donemi,
                ':odeme_kanali' => $odeme_kanali,
                ':bitis_tarihi' => $bitis_tarihi,
            ]);
            $abonelik_id = (int) $this->db->lastInsertId();

            // sirketler tablosunu da güncelle (hızlı erişim için)
            $stmt = $this->db->prepare("
                UPDATE sirketler
                SET abonelik_plani = :plan_adi,
                    abonelik_bitis = :bitis_tarihi
                WHERE id = :sirket_id
            ");
            $stmt->execute([
                ':plan_adi'     => $plan_adi,
                ':bitis_tarihi' => $bitis_tarihi,
                ':sirket_id'    => $sirket_id,
            ]);

            $this->db->commit();
            return $abonelik_id;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Yeni kayıt için deneme planı oluştur
     * sirketler tablosuna deneme_bitis yazar
     */
    public function denemeBaslat(int $sirket_id): int {
        $bitis = date('Y-m-d H:i:s', strtotime('+' . self::DENEME_SURESI_GUN . ' days'));

        // sirketler tablosuna deneme bitiş tarihi yaz
        $stmt = $this->db->prepare("
            UPDATE sirketler
            SET deneme_bitis = :bitis
            WHERE id = :sirket_id
        ");
        $stmt->execute([
            ':bitis'     => $bitis,
            ':sirket_id' => $sirket_id,
        ]);

        // Abonelik kaydı oluştur
        return $this->planGuncelle($sirket_id, 'deneme', null, null, $bitis);
    }

    // ─────────────────────────────────────────
    // DENEME SÜRESİ KONTROL
    // ─────────────────────────────────────────

    /**
     * Şirketin deneme süresi dolmuş mu?
     * Deneme planında değilse false döner
     */
    public function denemeSuresiDolduMu(int $sirket_id): bool {
        $stmt = $this->db->prepare("
            SELECT abonelik_plani, deneme_bitis
            FROM sirketler
            WHERE id = :sirket_id
        ");
        $stmt->execute([':sirket_id' => $sirket_id]);
        $sirket = $stmt->fetch();

        if (!$sirket) {
            return false;
        }

        // Ücretli aktif plan varsa süresi dolmamış demektir
        $plan = $sirket['abonelik_plani'] ?? 'deneme';
        if (in_array($plan, ['standart', 'kurumsal'], true)) {
            // Ücretli plan var — abonelik_bitis kontrolü yap
            $stmt2 = $this->db->prepare("
                SELECT COUNT(*) FROM abonelikler
                WHERE sirket_id = :sirket_id AND durum = 'aktif'
                  AND plan_adi IN ('standart','kurumsal')
            ");
            $stmt2->execute([':sirket_id' => $sirket_id]);
            if ((int) $stmt2->fetchColumn() > 0) {
                return false; // Aktif ücretli abonelik var
            }
            // Aktif abonelik kaydı yok ama sirketler'de ücretli plan yazıyor
            // Veri tutarsızlığı — dolmamış say (admin incelemeli)
            return false;
        }

        // Deneme planı — bitis tarihine bak
        if (!$sirket['deneme_bitis']) {
            return true; // deneme_bitis yoksa süresi dolmuş kabul et
        }

        return strtotime($sirket['deneme_bitis']) < time();
    }

    /**
     * Deneme süresinden kalan gün sayısı
     * Deneme planında değilse veya süre dolmuşsa 0 döner
     */
    public function denemeKalanGun(int $sirket_id): int {
        $stmt = $this->db->prepare("
            SELECT abonelik_plani, deneme_bitis
            FROM sirketler
            WHERE id = :sirket_id
        ");
        $stmt->execute([':sirket_id' => $sirket_id]);
        $sirket = $stmt->fetch();

        if (!$sirket || $sirket['abonelik_plani'] !== 'deneme' || !$sirket['deneme_bitis']) {
            return 0;
        }

        $kalan = (strtotime($sirket['deneme_bitis']) - time()) / 86400;
        return max(0, (int) ceil($kalan));
    }

    // ─────────────────────────────────────────
    // ÖDEME GEÇMİŞİ
    // ─────────────────────────────────────────

    /**
     * Aynı gün aynı plan+dönem için ödeme kaydı var mı kontrol et
     */
    public function bugunOdemeVarMi(int $sirket_id, string $plan_adi, string $odeme_donemi): bool {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM odeme_gecmisi
            WHERE sirket_id = :sirket_id
              AND plan_adi = :plan_adi
              AND odeme_donemi = :odeme_donemi
              AND DATE(odeme_tarihi) = CURDATE()
        ");
        $stmt->execute([
            ':sirket_id'     => $sirket_id,
            ':plan_adi'      => $plan_adi,
            ':odeme_donemi'  => $odeme_donemi,
        ]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Ödeme kaydı oluştur
     */
    public function odemeKaydet(int $sirket_id, ?int $abonelik_id, array $veri): int {
        $stmt = $this->db->prepare("
            INSERT INTO odeme_gecmisi
                (sirket_id, abonelik_id, plan_adi, odeme_donemi, odeme_kanali,
                 tutar, para_birimi, referans_no, durum, odeme_tarihi)
            VALUES
                (:sirket_id, :abonelik_id, :plan_adi, :odeme_donemi, :odeme_kanali,
                 :tutar, :para_birimi, :referans_no, :durum, :odeme_tarihi)
        ");
        $stmt->execute([
            ':sirket_id'    => $sirket_id,
            ':abonelik_id'  => $abonelik_id,
            ':plan_adi'     => $veri['plan_adi'],
            ':odeme_donemi' => $veri['odeme_donemi'],
            ':odeme_kanali' => $veri['odeme_kanali'],
            ':tutar'        => $veri['tutar'],
            ':para_birimi'  => $veri['para_birimi'] ?? 'TRY',
            ':referans_no'  => $veri['referans_no'] ?? null,
            ':durum'        => $veri['durum'] ?? 'tamamlandi',
            ':odeme_tarihi' => $veri['odeme_tarihi'] ?? date('Y-m-d H:i:s'),
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Şirketin ödeme geçmişini döndür
     */
    public function gecmis(int $sirket_id): array {
        $stmt = $this->db->prepare("
            SELECT id, plan_adi, odeme_donemi, odeme_kanali, tutar, para_birimi,
                   referans_no, durum, odeme_tarihi, olusturma_tarihi
            FROM odeme_gecmisi
            WHERE sirket_id = :sirket_id
            ORDER BY olusturma_tarihi DESC
        ");
        $stmt->execute([':sirket_id' => $sirket_id]);
        return $stmt->fetchAll();
    }

    // ─────────────────────────────────────────
    // REVENUECAT ENTEGRASYONU
    // ─────────────────────────────────────────

    /**
     * RevenueCat müşteri ID'sini sirketler tablosuna kaydet
     */
    public function revenueCatMusteriIdKaydet(int $sirket_id, string $musteri_id): void {
        $stmt = $this->db->prepare("
            UPDATE sirketler
            SET revenuecat_musteri_id = :musteri_id
            WHERE id = :sirket_id
        ");
        $stmt->execute([
            ':musteri_id' => $musteri_id,
            ':sirket_id'  => $sirket_id,
        ]);
    }

    /**
     * RevenueCat event'inden sirket_id çıkar
     * Müşteri ID formatı: "sirket_123" → 123
     */
    public function sirketIdRevenueCatMusteriden(string $musteri_id): ?int {
        if (!preg_match('/^sirket_(\d+)$/', $musteri_id, $m)) {
            return null;
        }
        return (int) $m[1];
    }

    // ─────────────────────────────────────────
    // PLAN LİSTESİ (statik)
    // ─────────────────────────────────────────

    /**
     * Tüm planları fiyatlarıyla döndür
     */
    public function planListesi(): array {
        return [
            [
                'id'         => 'deneme',
                'ad'         => '7 Gün Ücretsiz Deneme',
                'aciklama'   => 'Tüm özellikleri 7 gün boyunca ücretsiz deneyin',
                'fiyat'      => ['aylik' => 0, 'yillik' => 0],
                'ozellikler' => [
                    '7 gün tüm özellikler açık',
                    '2 kullanıcıya kadar',
                    'Sınırsız cari hesap',
                    '50 çek/senet kaydı (aylık)',
                    'Sınırsız kasa yönetimi',
                    'PDF & Excel rapor',
                ],
                'kisitlamalar' => [
                    '7 gün sonra plan seçimi gerekir',
                ],
            ],
            [
                'id'         => 'standart',
                'ad'         => 'Standart',
                'aciklama'   => 'Büyüyen işletmeler için tam özellik seti',
                'fiyat'      => [
                    'aylik'            => self::FIYATLAR['standart']['aylik'],
                    'yillik'           => self::FIYATLAR['standart']['yillik'],
                    'yillik_aylik_kar' => round(self::FIYATLAR['standart']['aylik'] * 12 - self::FIYATLAR['standart']['yillik'], 2),
                    'urun_id_aylik'    => 'com.paramgo.app.standart.aylik',
                    'urun_id_yillik'   => 'com.paramgo.app.standart.yillik',
                ],
                'ozellikler' => [
                    '2 kullanıcıya kadar',
                    'Sınırsız cari hesap',
                    '50 çek/senet kaydı (aylık, sıfırlanır)',
                    'Sınırsız kasa yönetimi',
                    'Ödeme takibi',
                    'Vade hesaplayıcı',
                    'PDF & Excel rapor',
                    'Veri dışa aktarma',
                    'WhatsApp desteği',
                ],
            ],
            [
                'id'         => 'kurumsal',
                'ad'         => 'Kurumsal',
                'aciklama'   => 'Büyük ekipler için tam kontrol ve öncelikli destek',
                'fiyat'      => [
                    'aylik'            => self::FIYATLAR['kurumsal']['aylik'],
                    'yillik'           => self::FIYATLAR['kurumsal']['yillik'],
                    'yillik_aylik_kar' => round(self::FIYATLAR['kurumsal']['aylik'] * 12 - self::FIYATLAR['kurumsal']['yillik'], 2),
                    'urun_id_aylik'    => 'com.paramgo.app.kurumsal.aylik',
                    'urun_id_yillik'   => 'com.paramgo.app.kurumsal.yillik',
                ],
                'ozellikler' => [
                    '10 kullanıcıya kadar',
                    'Sınırsız her şey',
                    'Tüm Standart özellikler',
                    'Gelişmiş raporlama & analiz',
                    'Özel entegrasyon desteği',
                    'Şirket bazlı yetkilendirme',
                    'Öncelikli 7/24 destek',
                ],
            ],
        ];
    }
}
