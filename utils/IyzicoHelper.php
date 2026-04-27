<?php
/**
 * ParamGo — iyzico Abonelik Yardımcısı
 *
 * iyzico Subscription API ile tüm iletişim buradan yönetilir.
 * SDK: vendor/iyzico/iyzipay-php/IyzipayBootstrap.php
 */

require_once __DIR__ . '/../vendor/iyzico/iyzipay-php/IyzipayBootstrap.php';

// SDK autoloader'ını absolute path ile başlat (sadece bir kez)
if (!class_exists('Iyzipay\Options', false)) {
    $iyzicoSrcPath = __DIR__ . '/../vendor/iyzico/iyzipay-php/src';
    $iyzicoLoader = new SplClassLoader('Iyzipay', $iyzicoSrcPath);
    $iyzicoLoader->register();
}

class IyzicoHelper {

    // iyzico panelinde oluşturulan plan referans kodları
    public const PLAN_KODLARI = [
        'standart' => [
            'aylik'  => '06d2cecf-bdb9-44b4-8740-bb0fa42d8968',
            'yillik' => '2e8611ba-bd74-48dc-8db3-49a3c16a4931',
        ],
        'kurumsal' => [
            'aylik'  => 'ffdeb3cb-de30-4c14-8a36-f5791797bf48',
            'yillik' => '129785d6-3cee-44e6-9f36-d3061caedb61',
        ],
    ];

    // Web fiyatları (TL, KDV hariç)
    public const WEB_FIYATLAR = [
        'standart' => [
            'aylik'  => 360.00,
            'yillik' => 3600.00,
        ],
        'kurumsal' => [
            'aylik'  => 540.00,
            'yillik' => 5400.00,
        ],
    ];

    private static function options(): \Iyzipay\Options {
        $options = new \Iyzipay\Options();
        $options->setApiKey(getenv('IYZICO_API_KEY'));
        $options->setSecretKey(getenv('IYZICO_SECRET_KEY'));
        $options->setBaseUrl(getenv('IYZICO_BASE_URL') ?: 'https://api.iyzipay.com');
        return $options;
    }

    /**
     * Checkout Form başlat — ödeme sayfası URL'i döndür
     */
    public static function checkoutBaslat(
        string $plan_adi,
        string $odeme_donemi,
        array  $musteri,
        string $callback_url
    ): array {
        $plan_kodu = self::PLAN_KODLARI[$plan_adi][$odeme_donemi] ?? null;
        if (!$plan_kodu) {
            throw new \RuntimeException("Geçersiz plan: {$plan_adi}/{$odeme_donemi}");
        }

        $request = new \Iyzipay\Request\Subscription\SubscriptionCreateCheckoutFormRequest();
        $request->setLocale('tr');
        $request->setConversationId('pg-' . $musteri['sirket_id'] . '-' . time());
        $request->setPricingPlanReferenceCode($plan_kodu);
        $request->setSubscriptionInitialStatus('ACTIVE');
        $request->setCallbackUrl($callback_url);

        $customer = new \Iyzipay\Model\Customer();
        $customer->setName($musteri['ad']);
        $customer->setSurname($musteri['soyad']);
        $customer->setEmail($musteri['email']);

        // Telefon: iyzico formatı +90XXXXXXXXXX (13 karakter, geçerli TR ön eki)
        $ham_telefon = $musteri['telefon'] ?? '';
        $sadece_rakam = preg_replace('/\D/', '', $ham_telefon);

        if (strlen($sadece_rakam) === 10 && str_starts_with($sadece_rakam, '5')) {
            $telefon = '+90' . $sadece_rakam;         // 5XXXXXXXXX → +905XXXXXXXXX
        } elseif (strlen($sadece_rakam) === 11 && str_starts_with($sadece_rakam, '05')) {
            $telefon = '+9' . $sadece_rakam;           // 05XXXXXXXXX → +905XXXXXXXXX
        } elseif (strlen($sadece_rakam) === 12 && str_starts_with($sadece_rakam, '90')) {
            $telefon = '+' . $sadece_rakam;            // 905XXXXXXXXX → +905XXXXXXXXX
        } elseif (strlen($sadece_rakam) === 11 && str_starts_with($sadece_rakam, '90')) {
            $telefon = '+' . $sadece_rakam;            // 905XXXXXXXX → +905XXXXXXXX (nadir)
        } else {
            $telefon = '+905550000000';                 // geçerli dummy (555 = Turkcell)
        }

        // Sonuç +905XXXXXXXXX formatında değilse dummy kullan
        if (!preg_match('/^\+905\d{9}$/', $telefon)) {
            error_log('iyzico: telefon formatlanamadi ham=' . $ham_telefon . ' islenmis=' . $telefon . ' dummy kullaniliyor');
            $telefon = '+905550000000';
        }

        $customer->setGsmNumber($telefon);
        $customer->setIdentityNumber('11111111111'); // iyzico test/abonelik standart değeri

        $fatura_ad = $musteri['ad'] . ' ' . $musteri['soyad'];
        // Adres: müşteriden gelen unique adres (firma adı dahil), iyzico anti-fraud için
        // generic "Türkiye" yerine anlamlı bir değer kullanıyoruz
        $musteri_adres = $musteri['adres'] ?? 'ParamGo Müşterisi';

        $customer->setShippingContactName($fatura_ad);
        $customer->setShippingCity('İstanbul');
        $customer->setShippingCountry('Turkey');
        $customer->setShippingAddress($musteri_adres);
        $customer->setShippingZipCode('34000');

        $customer->setBillingContactName($fatura_ad);
        $customer->setBillingCity('İstanbul');
        $customer->setBillingCountry('Turkey');
        $customer->setBillingAddress($musteri_adres);
        $customer->setBillingZipCode('34000');

        $request->setCustomer($customer);

        // Debug: iyzico'ya gönderilen tam veriyi logla
        error_log('iyzico checkoutBaslat istek: '
            . 'plan=' . $plan_adi . '/' . $odeme_donemi
            . ' kod=' . $plan_kodu
            . ' email=' . $musteri['email']
            . ' tel=' . $telefon
            . ' callback=' . $callback_url);

        $result = \Iyzipay\Model\Subscription\SubscriptionCreateCheckoutForm::create(
            $request,
            self::options()
        );

        if ($result->getStatus() !== 'success') {
            error_log('iyzico checkoutBaslat hatasi: ' . $result->getErrorMessage()
                . ' kod=' . $result->getErrorCode()
                . ' ham=' . substr($result->getRawResult() ?? '', 0, 500));
            throw new \RuntimeException($result->getErrorMessage() ?: 'iyzico bağlantı hatası');
        }

        return [
            'token'        => $result->getToken(),
            'form_content' => $result->getCheckoutFormContent(),
        ];
    }

    /**
     * Checkout Form sonucu sorgula
     */
    public static function checkoutSonucSorgula(string $token): array {
        $request = new \Iyzipay\Request\Subscription\RetrieveSubscriptionCreateCheckoutFormRequest();
        $request->setCheckoutFormToken($token);

        $result = \Iyzipay\Model\Subscription\RetrieveSubscriptionCheckoutForm::retrieve(
            $request,
            self::options()
        );

        if ($result->getStatus() !== 'success') {
            error_log('iyzico checkoutSonuc hatasi: ' . $result->getErrorMessage()
                . ' ham=' . substr($result->getRawResult() ?? '', 0, 800));
            return ['basarili' => false, 'hata' => $result->getErrorMessage()];
        }

        // iyzico'nun döndürdüğü tüm alanları ham olarak alalım — plan_kodu için
        $ham = json_decode($result->getRawResult() ?? '{}', true) ?: [];

        return [
            'basarili'     => true,
            'abonelik_ref' => $result->getReferenceCode(),
            'musteri_ref'  => method_exists($result, 'getCustomerReferenceCode') ? $result->getCustomerReferenceCode() : null,
            'plan_kodu'    => $ham['pricingPlanReferenceCode']
                              ?? $ham['data']['pricingPlanReferenceCode']
                              ?? null,
            'ham'          => $ham,
        ];
    }

    /**
     * Müşteri referans koduna göre aktif abonelikleri listele
     * @return array Aktif aboneliklerin listesi
     */
    public static function aktifAbonelikleriListele(string $musteri_ref): array {
        $request = new \Iyzipay\Request\Subscription\SubscriptionSearchRequest();
        $request->setLocale('tr');
        $request->setPage(1);
        $request->setCount(20);
        $request->setSubscriptionStatus('ACTIVE');
        $request->setCustomerReferenceCode($musteri_ref);

        $result = \Iyzipay\Model\Subscription\RetrieveList::subscriptions(
            $request,
            self::options()
        );

        if ($result->getStatus() !== 'success') {
            error_log('iyzico aktifAbonelikler hatasi: ' . $result->getErrorMessage());
            return [];
        }

        $ham = json_decode($result->getRawResult() ?? '{}', true) ?: [];
        return $ham['data']['items'] ?? $ham['items'] ?? [];
    }

    /**
     * Abonelik referans kodu ile detay sorgula
     */
    public static function abonelikDetay(string $abonelik_ref): array {
        $request = new \Iyzipay\Request\Subscription\SubscriptionDetailsRequest();
        $request->setLocale('tr');
        $request->setSubscriptionReferenceCode($abonelik_ref);

        $result = \Iyzipay\Model\Subscription\SubscriptionDetails::retrieve(
            $request,
            self::options()
        );

        if ($result->getStatus() !== 'success') {
            error_log('iyzico abonelikDetay hatasi: ' . $result->getErrorMessage() . ' ref=' . $abonelik_ref);
            return ['basarili' => false, 'hata' => $result->getErrorMessage()];
        }

        $ham = json_decode($result->getRawResult() ?? '{}', true) ?: [];
        $data = $ham['data'] ?? $ham;

        return [
            'basarili'         => true,
            'durum'            => $data['subscriptionStatus'] ?? null,
            'plan_kodu'        => $data['pricingPlanReferenceCode'] ?? null,
            'musteri_ref'      => $data['customerReferenceCode'] ?? null,
            'baslangic_tarihi' => $data['startDate'] ?? null,
            'ham'              => $data,
        ];
    }

    /**
     * Aboneliği iptal et
     */
    public static function abonelikIptal(string $abonelik_ref): bool {
        $request = new \Iyzipay\Request\Subscription\SubscriptionCancelRequest();
        $request->setLocale('tr');
        $request->setSubscriptionReferenceCode($abonelik_ref);

        $result = \Iyzipay\Model\Subscription\SubscriptionCancel::cancel(
            $request,
            self::options()
        );

        if ($result->getStatus() !== 'success') {
            error_log('iyzico iptal hatasi: ' . $result->getErrorMessage() . ' ref=' . $abonelik_ref);
            return false;
        }

        return true;
    }

    /**
     * Webhook imza doğrulama — V3 (öncelikli) + V1 (geriye uyumlu)
     *
     * V3 algoritması:
     *   signature = base64(HMAC_SHA256(secretKey, randomString + rawBody))
     *   Headers: X-IYZ-SIGNATURE-V3 + X-IYZ-RND
     *
     * V1 algoritması (eski iyzico, hâlâ aktif):
     *   signature = base64(HMAC_SHA1(secretKey, rawBody))
     *   Headers: X-IYZ-SIGNATURE
     *
     * @return array ['gecerli' => bool, 'versiyon' => 'V3'|'V1'|'-']
     */
    public static function webhookImzaDogrula(
        string  $rawBody,
        ?string $sigV3,
        ?string $rnd,
        ?string $sigV1
    ): array {
        $secret = getenv('IYZICO_SECRET_KEY');
        if (!$secret) {
            error_log('iyzico webhook: IYZICO_SECRET_KEY tanimli degil');
            return ['gecerli' => false, 'versiyon' => '-'];
        }

        // V3 önce dene (varsa)
        if ($sigV3 && $rnd) {
            $beklenen = base64_encode(hash_hmac('sha256', $rnd . $rawBody, $secret, true));
            if (hash_equals($beklenen, $sigV3)) {
                return ['gecerli' => true, 'versiyon' => 'V3'];
            }
            return ['gecerli' => false, 'versiyon' => 'V3'];
        }

        // V1 fallback
        if ($sigV1) {
            // V1 algoritması — iyzico hash_hmac('sha1', body, secret) kullanır
            $beklenenV1 = base64_encode(hash_hmac('sha1', $rawBody, $secret, true));
            if (hash_equals($beklenenV1, $sigV1)) {
                return ['gecerli' => true, 'versiyon' => 'V1'];
            }
            // Bazı iyzico versiyonlarında secret + body yapısı kullanılır
            $beklenenV1Alt = base64_encode(sha1($secret . $rawBody, true));
            if (hash_equals($beklenenV1Alt, $sigV1)) {
                return ['gecerli' => true, 'versiyon' => 'V1-alt'];
            }
            return ['gecerli' => false, 'versiyon' => 'V1'];
        }

        return ['gecerli' => false, 'versiyon' => '-'];
    }
}
