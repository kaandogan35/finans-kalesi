<?php
/**
 * ParamGo — iyzico Ödeme Sayfası
 *
 * Bu sayfa, frontend'den gelen iyzico form_content'i güvenli ve
 * profesyonel bir ortamda render eder.
 *
 * Akış:
 *   1. Frontend → POST form_content
 *   2. Bu sayfa form_content'i HTML olarak yerleştirir
 *   3. iyzico iframe normal şekilde yüklenir
 *
 * URL: https://paramgo.com/odeme.php
 */

// Sadece POST kabul et — direkt URL erişimi yasak
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    echo 'Bu sayfaya doğrudan erişim yapılamaz.';
    exit;
}

$form_content = $_POST['form_content'] ?? '';
$plan_adi     = $_POST['plan_adi']     ?? 'Standart';
$tutar        = $_POST['tutar']        ?? '';

if (!$form_content) {
    http_response_code(400);
    echo 'Ödeme bilgisi eksik. Lütfen baştan deneyin.';
    exit;
}

// NOT: popup-mode'a dokunma — abonelik checkout için iyzico SDK'nın orijinal modunu kullanıyoruz.
// Daha önce responsive'e çevirmiştim, ama iyzico submit'i "Ödeme formu tamamlanmamış" diye reddetti.

error_log('iyzico ödeme sayfası açıldı — plan: ' . $plan_adi . ' tutar: ' . $tutar . ' form_len: ' . strlen($form_content));
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>ParamGo — Güvenli Ödeme</title>
    <link rel="icon" type="image/png" href="/frontend-build/favicon.png">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            background: #F8F9FA;
            color: #111827;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
        }

        /* Üst Bar */
        .ust-bar {
            background: #fff;
            border-bottom: 1px solid #E5E7EB;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 800;
            font-size: 18px;
            color: #111827;
            text-decoration: none;
        }
        .logo-kutu {
            width: 32px; height: 32px;
            background: linear-gradient(135deg, #10B981, #059669);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 800;
            font-size: 18px;
        }
        .logo-text-go { color: #10B981; }

        .ssl-rozet {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #059669;
            font-weight: 600;
        }
        .ssl-rozet-icon {
            width: 16px; height: 16px;
            display: inline-block;
        }

        /* İçerik */
        .icerik {
            max-width: 720px;
            margin: 24px auto;
            padding: 0 16px;
        }

        /* Plan Özeti Kartı */
        .ozet-kart {
            background: #fff;
            border-radius: 14px;
            padding: 20px 22px;
            margin-bottom: 16px;
            border: 1px solid #E5E7EB;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        .ozet-sol {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .ozet-ikon {
            width: 44px; height: 44px;
            background: rgba(16,185,129,0.12);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #059669;
            font-size: 22px;
        }
        .ozet-baslik {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
        }
        .ozet-alt {
            font-size: 12px;
            color: #6B7280;
            margin-top: 2px;
        }
        .ozet-tutar {
            text-align: right;
        }
        .ozet-tutar-deger {
            font-size: 20px;
            font-weight: 800;
            color: #111827;
        }
        .ozet-tutar-alt {
            font-size: 11px;
            color: #6B7280;
        }

        /* Ana Form Kartı */
        .form-kart {
            background: #fff;
            border-radius: 14px;
            padding: 24px 20px;
            border: 1px solid #E5E7EB;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }

        /* Güven Bilgisi (Footer) */
        .guven-alani {
            margin-top: 20px;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
            line-height: 1.7;
        }
        .guven-alani strong { color: #374151; }
        .guven-rozetler {
            display: flex;
            justify-content: center;
            gap: 18px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        .guven-rozet {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #4B5563;
            font-weight: 600;
        }
        .guven-rozet i {
            color: #059669;
            font-size: 13px;
        }

        /* iyzico form yükleniyor */
        #odeme-yukleniyor {
            text-align: center;
            padding: 40px 20px;
            color: #6B7280;
            font-size: 14px;
        }
        .yukleniyor-daire {
            width: 36px; height: 36px;
            border: 3px solid #E5E7EB;
            border-top-color: #10B981;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobil */
        @media (max-width: 600px) {
            .icerik { padding: 0 12px; margin: 16px auto; }
            .ozet-kart { padding: 16px; flex-direction: column; align-items: flex-start; }
            .ozet-tutar { text-align: left; }
            .form-kart { padding: 18px 14px; }
        }
    </style>
</head>
<body>

    <!-- Üst Bar -->
    <div class="ust-bar">
        <a href="https://paramgo.com" class="logo">
            <div class="logo-kutu">P</div>
            <span>Param<span class="logo-text-go">Go</span></span>
        </a>
        <div class="ssl-rozet">
            <svg class="ssl-rozet-icon" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a3 3 0 0 0-3 3v3H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a3 3 0 0 0-3-3zM6 4a2 2 0 1 1 4 0v3H6V4z"/>
            </svg>
            SSL Güvenli Bağlantı
        </div>
    </div>

    <!-- İçerik -->
    <div class="icerik">

        <!-- Kredi kartı uyarısı -->
        <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:12px 16px;margin-bottom:12px;font-size:13px;color:#92400E;">
            <strong>⚠ Önemli:</strong> Abonelik için <strong>kredi kartı</strong> kullanmanız gerekir. Banka kartı (debit) kabul edilmez.
        </div>

        <!-- Plan özeti -->
        <div class="ozet-kart">
            <div class="ozet-sol">
                <div class="ozet-ikon">★</div>
                <div>
                    <div class="ozet-baslik"><?= htmlspecialchars($plan_adi, ENT_QUOTES, 'UTF-8') ?> Plan</div>
                    <div class="ozet-alt">İlk 7 gün ücretsiz — istediğiniz zaman iptal edebilirsiniz</div>
                </div>
            </div>
            <?php if ($tutar): ?>
            <div class="ozet-tutar">
                <div class="ozet-tutar-deger">₺<?= htmlspecialchars($tutar, ENT_QUOTES, 'UTF-8') ?></div>
                <div class="ozet-tutar-alt">+ KDV / dönem</div>
            </div>
            <?php endif; ?>
        </div>

        <!-- iyzico ödeme formu -->
        <div class="form-kart">
            <!-- Yüklenirken gösterilen spinner — iyzico JS render ettiğinde gizlenir -->
            <div id="odeme-yukleniyor">
                <div class="yukleniyor-daire"></div>
                Ödeme formu yükleniyor...
            </div>

            <?php
            // form_content zaten div içeriyorsa doğrudan yaz.
            // İçermiyorsa (bazı SDK versiyonlarında sadece script döner) div'i biz ekleriz.
            if (strpos($form_content, 'id="iyzipay-checkout-form"') === false) {
                echo '<div id="iyzipay-checkout-form" class="responsive"></div>';
            }
            echo $form_content;
            ?>
        </div>

        <script>
        // iyzipay-checkout-form içi dolunca spinner'ı gizle
        (function() {
            var kontrol = setInterval(function() {
                var form = document.getElementById('iyzipay-checkout-form');
                var yukleniyor = document.getElementById('odeme-yukleniyor');
                if (form && form.children.length > 0) {
                    if (yukleniyor) yukleniyor.style.display = 'none';
                    clearInterval(kontrol);
                }
            }, 300);
            // 15 saniye sonra hata göster
            setTimeout(function() {
                clearInterval(kontrol);
                var yukleniyor = document.getElementById('odeme-yukleniyor');
                if (yukleniyor && yukleniyor.style.display !== 'none') {
                    yukleniyor.innerHTML = '<p style="color:#EF4444;font-weight:600;">Ödeme formu yüklenemedi.</p><p style="font-size:13px;color:#6B7280;margin-top:8px;">Sayfayı yenileyip tekrar deneyin ya da farklı bir tarayıcı kullanın.</p>';
                }
            }, 15000);
        })();
        </script>

        <!-- Güven alanı -->
        <div class="guven-alani">
            <p>
                Ödeme bilgileriniz <strong>iyzico</strong> güvenli ödeme altyapısı üzerinden işlenir.<br>
                ParamGo kart bilgilerinizi görmez ve saklamaz.
            </p>
            <div class="guven-rozetler">
                <div class="guven-rozet">
                    <span>🔒</span> 256-bit SSL
                </div>
                <div class="guven-rozet">
                    <span>🛡️</span> 3D Secure
                </div>
                <div class="guven-rozet">
                    <span>✓</span> BDDK Lisanslı
                </div>
                <div class="guven-rozet">
                    <span>💳</span> PCI-DSS
                </div>
            </div>
        </div>

    </div>

</body>
</html>
