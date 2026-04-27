<?php
/**
 * ParamGo — iyzico Ödeme Sonrası Dönüş Sayfası
 *
 * iyzico ödeme tamamlandıktan sonra kullanıcıyı buraya yönlendirir.
 * Statik PHP sayfa — React app açılmaz, kullanıcının ana sekmesi etkilenmez.
 *
 * URL: https://paramgo.com/odeme-tamamlandi.php
 */

$plan  = $_GET['plan']  ?? '';
$donem = $_GET['donem'] ?? '';
$token = $_GET['token'] ?? '';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ParamGo — Ödeme Alındı</title>
    <link rel="icon" type="image/png" href="/frontend-build/favicon.png">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #ECFDF5 0%, #F8F9FA 100%);
            color: #111827;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .kart {
            max-width: 480px;
            width: 100%;
            background: #fff;
            border-radius: 20px;
            padding: 36px 28px;
            box-shadow: 0 20px 60px rgba(16,185,129,0.12);
            text-align: center;
        }

        .ikon-daire {
            width: 84px;
            height: 84px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #10B981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(16,185,129,0.35);
            animation: ikonZipla 0.6s ease-out;
        }
        @keyframes ikonZipla {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); }
        }
        .ikon-daire svg {
            width: 44px;
            height: 44px;
            color: #fff;
        }

        h1 {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .alt-baslik {
            font-size: 15px;
            color: #4B5563;
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .bilgi-kutu {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 24px;
            text-align: left;
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }
        .bilgi-kutu-ikon {
            color: #059669;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .bilgi-kutu-yazi {
            font-size: 13px;
            color: #065F46;
            line-height: 1.6;
        }

        .btn-grup {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .btn {
            display: inline-block;
            width: 100%;
            padding: 14px 22px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            text-align: center;
        }
        .btn-ana {
            background: linear-gradient(135deg, #10B981, #059669);
            color: #fff;
            box-shadow: 0 4px 14px rgba(16,185,129,0.25);
        }
        .btn-ana:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(16,185,129,0.35);
        }
        .btn-ikincil {
            background: #fff;
            color: #6B7280;
            border: 1px solid #E5E7EB;
        }
        .btn-ikincil:hover {
            background: #F9FAFB;
            color: #374151;
        }

        .alt-not {
            margin-top: 18px;
            font-size: 11px;
            color: #9CA3AF;
            line-height: 1.6;
        }

        @media (max-width: 480px) {
            .kart { padding: 28px 20px; }
            h1 { font-size: 21px; }
            .ikon-daire { width: 72px; height: 72px; }
        }
    </style>
</head>
<body>

    <div class="kart">

        <div class="ikon-daire">
            <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
        </div>

        <h1>Ödemeniz Alındı</h1>
        <p class="alt-baslik">
            Aboneliğiniz birkaç saniye içinde aktifleştirilecek.<br>
            7 gün boyunca ücretsiz kullanabilirsiniz.
        </p>

        <div class="bilgi-kutu">
            <svg class="bilgi-kutu-ikon" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412l-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            <div class="bilgi-kutu-yazi">
                <strong>Ne zaman ücret alınacak?</strong><br>
                7 günlük deneme süreniz bittikten sonra. İptal etmek istediğinizde
                hesap ayarlarından tek tıkla yapabilirsiniz.
            </div>
        </div>

        <div class="btn-grup">
            <a href="/" class="btn btn-ana">
                Uygulamaya Geri Dön
            </a>
            <button type="button" class="btn btn-ikincil" onclick="window.close()">
                Bu Sekmeyi Kapat
            </button>
        </div>

        <p class="alt-not">
            Plan bilgileriniz arka planda güncelleniyor.<br>
            Sorun yaşarsanız: <a href="mailto:destek@paramgo.com" style="color:#10B981; text-decoration: none;">destek@paramgo.com</a>
        </p>

    </div>

</body>
</html>
