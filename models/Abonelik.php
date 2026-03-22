<?php
/**
 * Finans Kalesi — Abonelik Modeli
 *
 * Abonelik ve ödeme geçmişi veritabanı işlemleri.
 */

class Abonelik {

    private PDO $db;

    // Plan fiyatları (TL)
    public const FIYATLAR = [
        'standart' => [
            'aylik'  => 399.90,
            'yillik' => 3499.00,
        ],
        'kurumsal' => [
            'aylik'  => 749.90,
            'yillik' => 6490.00,
        ],
    ];

    // Lansman kampanya fiyatı (aylık, sabit)
    public const KAMPANYA_FIYAT = 99.90;

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
            SELECT a.*, s.abonelik_plani, s.abonelik_bitis, s.kampanya_kullanici
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
     * Şirketin abonelik planını güncelle
     * Hem sirketler tablosunu hem abonelikler tablosunu günceller
     */
    public function planGuncelle(
        int     $sirket_id,
        string  $plan_adi,
        ?string $odeme_donemi,
        ?string $odeme_kanali,
        ?string $bitis_tarihi,
        bool    $kampanya = false
    ): int {
        // Eski aktif aboneliği pasife çek
        $stmt = $this->db->prepare("
            UPDATE abonelikler
            SET durum = 'pasif'
            WHERE sirket_id = :sirket_id AND durum = 'aktif'
        ");
        $stmt->execute([':sirket_id' => $sirket_id]);

        // Kampanya fiyatını belirle
        $kampanya_fiyat = null;
        if ($kampanya && $plan_adi === 'standart' && $odeme_donemi === 'aylik') {
            $kampanya_fiyat = self::KAMPANYA_FIYAT;
        }

        // Yeni abonelik kaydı oluştur
        $stmt = $this->db->prepare("
            INSERT INTO abonelikler
                (sirket_id, plan_adi, odeme_donemi, odeme_kanali, baslangic_tarihi, bitis_tarihi,
                 kampanya_kullanici, kampanya_fiyat, durum)
            VALUES
                (:sirket_id, :plan_adi, :odeme_donemi, :odeme_kanali, NOW(), :bitis_tarihi,
                 :kampanya, :kampanya_fiyat, 'aktif')
        ");
        $stmt->execute([
            ':sirket_id'      => $sirket_id,
            ':plan_adi'       => $plan_adi,
            ':odeme_donemi'   => $odeme_donemi,
            ':odeme_kanali'   => $odeme_kanali,
            ':bitis_tarihi'   => $bitis_tarihi,
            ':kampanya'       => $kampanya ? 1 : 0,
            ':kampanya_fiyat' => $kampanya_fiyat,
        ]);
        $abonelik_id = (int) $this->db->lastInsertId();

        // sirketler tablosunu da güncelle (hızlı erişim için)
        $stmt = $this->db->prepare("
            UPDATE sirketler
            SET abonelik_plani   = :plan_adi,
                abonelik_bitis   = :bitis_tarihi,
                kampanya_kullanici = :kampanya
            WHERE id = :sirket_id
        ");
        $stmt->execute([
            ':plan_adi'    => $plan_adi,
            ':bitis_tarihi'=> $bitis_tarihi,
            ':kampanya'    => $kampanya ? 1 : 0,
            ':sirket_id'   => $sirket_id,
        ]);

        return $abonelik_id;
    }

    // ─────────────────────────────────────────
    // ÖDEME GEÇMİŞİ
    // ─────────────────────────────────────────

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
    // KAMPANYA
    // ─────────────────────────────────────────

    /**
     * Lansman kampanyası hâlâ aktif mi?
     * .env'deki LANSMAN_BITIS_TARIHI değerine bakar.
     */
    public function kampanyaAktifMi(): bool {
        $bitis = env('LANSMAN_BITIS_TARIHI', null);
        if (!$bitis) {
            return false;
        }
        return strtotime($bitis) > time();
    }

    /**
     * Kampanyadan yararlanan şirket sayısı (super admin için)
     */
    public function kampanyaKullanicilariSay(): int {
        $stmt = $this->db->query("SELECT COUNT(*) FROM sirketler WHERE kampanya_kullanici = 1");
        return (int) $stmt->fetchColumn();
    }

    // ─────────────────────────────────────────
    // PLAN LİSTESİ (statik)
    // ─────────────────────────────────────────

    /**
     * Tüm planları fiyatlarıyla döndür
     * Kampanya aktifse Standart plan için kampanya fiyatı eklenir
     */
    public function planListesi(): array {
        $kampanya = $this->kampanyaAktifMi();

        return [
            [
                'id'         => 'ucretsiz',
                'ad'         => 'Başlangıç',
                'aciklama'   => 'Yeni başlayanlar için temel özellikler',
                'fiyat'      => ['aylik' => 0, 'yillik' => 0],
                'ozellikler' => [
                    '1 kullanıcı',
                    '30 cari hesap',
                    '10 çek/senet kaydı (aylık, sıfırlanır)',
                    'Kasa yönetimi (1 yıl ücretsiz deneme)',
                    'Ödeme takibi',
                    'Vade hesaplayıcı',
                ],
                'kisitlamalar' => [
                    "PDF & Excel rapor (Standart'ta mevcut)",
                    "Çoklu kullanıcı (Standart'ta mevcut)",
                ],
                'kampanya' => false,
            ],
            [
                'id'         => 'standart',
                'ad'         => 'Standart',
                'aciklama'   => 'Büyüyen işletmeler için tam özellik seti',
                'fiyat'      => [
                    'aylik'            => self::FIYATLAR['standart']['aylik'],
                    'yillik'           => self::FIYATLAR['standart']['yillik'],
                    'yillik_aylik_kar' => round(self::FIYATLAR['standart']['aylik'] * 12 - self::FIYATLAR['standart']['yillik'], 2),
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
                ],
                'kampanya'        => $kampanya,
                'kampanya_fiyat'  => $kampanya ? self::KAMPANYA_FIYAT : null,
                'kampanya_mesaj'  => $kampanya ? 'İlk 3 Ay 99,90₺ — Sonsuza Kadar Sabit' : null,
            ],
            [
                'id'         => 'kurumsal',
                'ad'         => 'Kurumsal',
                'aciklama'   => 'Büyük ekipler için tam kontrol ve öncelikli destek',
                'fiyat'      => [
                    'aylik'            => self::FIYATLAR['kurumsal']['aylik'],
                    'yillik'           => self::FIYATLAR['kurumsal']['yillik'],
                    'yillik_aylik_kar' => round(self::FIYATLAR['kurumsal']['aylik'] * 12 - self::FIYATLAR['kurumsal']['yillik'], 2),
                ],
                'ozellikler' => [
                    '10 kullanıcıya kadar',
                    'Sınırsız her şey',
                    'Tüm Standart özellikler',
                    'Öncelikli destek',
                ],
                'kampanya' => false,
            ],
        ];
    }
}
