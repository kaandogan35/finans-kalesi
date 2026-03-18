---
name: finans-kalesi-mail
description: >
  Finans Kalesi SaaS uygulaması için kurumsal HTML mail şablonları tasarlar ve üretir.
  Kullanıcı "mail yaz", "mail şablonu", "mail tasarımı", "otomatik mail", "bildirim maili",
  "hoş geldin maili", "şifre sıfırlama maili", "güvenlik uyarısı", "nakit akış raporu",
  "haftalık özet", "aylık bilanço maili", "vade hatırlatma", "karşılıksız çek bildirimi"
  gibi ifadeler kullandığında bu skill mutlaka okunmalıdır. Finans Kalesi'ne ait tüm
  mail içeriklerini marka kimliğine uygun şekilde üretmek için bu skill'i kullan.
---

# Finans Kalesi — Mail Tasarım Skill'i

Bu skill, Finans Kalesi uygulamasının tüm otomatik ve sistem maillerini tutarlı,
kurumsal ve marka kimliğine uygun şekilde üretmek için kullanılır.

---

## MARKA KİMLİĞİ & RENK PALETİ

```
Lacivert (Navy) — Ana Renk
  Ana lacivert:   #0a2463
  Koyu lacivert:  #071a4a
  Açık lacivert:  #1e40af

Beyaz / Açık
  Sayfa arka planı: #f2f4f7
  Kart / panel:     #ffffff
  Border:           #e5e8f0

Gold — Vurgu Rengi
  Ana gold:       #b8860b

Durum Renkleri (yalnızca içerik bloklarında kullan)
  Başarı / pozitif bakiye: #16a34a
  Uyarı / vadesi yaklaşan: #d97706
  Tehlike / vadesi geçmiş: #dc2626
  Bilgi / nötr:            #1e40af
```

## TİPOGRAFİ

```
Başlıklar ve tutarlar: 'Libre Baskerville', Georgia, serif
Genel metin:           'Source Sans 3', 'Segoe UI', Arial, sans-serif
```

Google Fonts CDN'den yükle:
```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## TEMEL ŞABLON YAPISI

Her mail aşağıdaki HTML iskeletini kullanır. Asla bu yapıdan sapma.

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{MAIL_BAŞLIĞI}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #f2f4f7;
      font-family: 'Source Sans 3', 'Segoe UI', Arial, sans-serif;
      font-size: 15px;
      color: #1a1a2e;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e8f0;
    }
    /* HEADER */
    .header {
      background-color: #0a2463;
      padding: 28px 40px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo-icon {
      width: 36px;
      height: 36px;
      background: #b8860b;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-title {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.3px;
    }
    .header-subtitle {
      font-family: 'Source Sans 3', sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    /* CONTENT */
    .content {
      padding: 36px 40px;
    }
    .greeting {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #0a2463;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .body-text {
      font-size: 15px;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    /* STAT KARTLARI — nakit akış, özet vb. için */
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 24px 0;
    }
    .stat-card {
      background: #f2f4f7;
      border: 1px solid #e5e8f0;
      border-radius: 6px;
      padding: 16px 20px;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .stat-value {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #0a2463;
    }
    .stat-value.positive { color: #16a34a; }
    .stat-value.negative { color: #dc2626; }
    .stat-value.warning  { color: #d97706; }
    /* TABLO — ödeme listeleri, hareket geçmişi vb. için */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .data-table th {
      background: #0a2463;
      color: #ffffff;
      font-family: 'Source Sans 3', sans-serif;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 10px 14px;
      text-align: left;
    }
    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #e5e8f0;
      color: #374151;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:nth-child(even) td { background: #f9fafb; }
    /* UYARI BLOKLARI */
    .alert-block {
      border-left: 4px solid #b8860b;
      background: #fffbeb;
      border-radius: 0 6px 6px 0;
      padding: 14px 18px;
      margin: 20px 0;
    }
    .alert-block.danger {
      border-color: #dc2626;
      background: #fef2f2;
    }
    .alert-block.success {
      border-color: #16a34a;
      background: #f0fdf4;
    }
    .alert-block.info {
      border-color: #1e40af;
      background: #eff6ff;
    }
    .alert-title {
      font-family: 'Source Sans 3', sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .alert-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
    }
    /* CTA BUTON */
    .cta-wrapper { text-align: center; margin: 28px 0; }
    .cta-button {
      display: inline-block;
      background: #0a2463;
      color: #ffffff !important;
      font-family: 'Source Sans 3', sans-serif;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      letter-spacing: 0.3px;
    }
    .cta-button.gold {
      background: #b8860b;
    }
    /* AYIRICI */
    .divider {
      border: none;
      border-top: 1px solid #e5e8f0;
      margin: 24px 0;
    }
    /* FOOTER */
    .footer {
      background: #f2f4f7;
      border-top: 1px solid #e5e8f0;
      padding: 24px 40px;
      text-align: center;
    }
    .footer-brand {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 14px;
      font-weight: 700;
      color: #0a2463;
      margin-bottom: 6px;
    }
    .footer-text {
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .footer-text a { color: #0a2463; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- HEADER -->
    <div class="header">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="header-logo-icon">
          <!-- Kalkan ikonu SVG -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white"/>
          </svg>
        </div>
        <div>
          <div class="header-title">Finans Kalesi</div>
          <div class="header-subtitle">{{MAİL_TİPİ_ETİKETİ}}</div>
        </div>
      </div>
    </div>

    <!-- İÇERİK -->
    <div class="content">
      {{İÇERİK_BURAYA}}
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-brand">Finans Kalesi</div>
      <div class="footer-text">
        Bu mail otomatik olarak gönderilmiştir.<br>
        Sorularınız için <a href="mailto:destek@finanskalesi.com">destek@finanskalesi.com</a> adresine yazabilirsiniz.<br><br>
        © 2026 Finans Kalesi · Tüm hakları saklıdır.
      </div>
    </div>

  </div>
</body>
</html>
```

---

## MAİL TİPLERİ KATALOĞU

Her mail tipini üretirken aşağıdaki içerik bloklarını temel şablona yerleştir.

---

### TİP 1 — Hoş Geldin Maili
`header-subtitle`: "HOŞ GELDİNİZ"

İçerik yapısı:
- `greeting`: "Finans Kalesi'ne hoş geldiniz, [Ad]."
- Kısa karşılama metni: hesabın oluşturulduğu bilgisi, sistemin ne işe yaradığı 2-3 cümlede
- 3 kutucuklu özellik listesi (tablo değil, ikonlu basit satırlar):
  - Cari Hesaplar — müşteri ve tedarikçilerin tek ekranda
  - Çek / Senet Takibi — portföy yönetimi
  - Nakit Akışı — anlık kasa ve vade görünümü
- CTA buton: "Hesabıma Gir" → ana sayfa linki
- Alt not: "Herhangi bir sorunuz olursa bize yazın."

---

### TİP 2 — Şifre Sıfırlama Maili
`header-subtitle`: "GÜVENLİK"

İçerik yapısı:
- `greeting`: "Şifre sıfırlama talebiniz alındı."
- Kısa metin: "Bu talebi siz yapmadıysanız bu maili dikkate almayın."
- alert-block (info): "Bu link 30 dakika geçerlidir."
- CTA buton (gold): "Şifremi Sıfırla" → sıfırlama linki
- Alt not: Linkin süresi dolduktan sonra yeni talep oluşturulabileceği

---

### TİP 3 — Güvenlik Uyarısı (Farklı IP Girişi)
`header-subtitle`: "GÜVENLİK UYARISI"

İçerik yapısı:
- `greeting`: "Hesabınıza yeni bir cihazdan giriş yapıldı."
- alert-block (danger): Giriş bilgileri — tarih/saat, tahmini konum (IP), cihaz/tarayıcı
- İki seçenek net ayrılsın:
  - "Bu girişi ben yaptım" → herhangi bir işlem gerekmez
  - "Bu girişi ben yapmadım" → CTA buton ile şifre sıfırlama sayfası
- Alt uyarı metni: Güvenlik için 2FA önerisi (ileride eklenebilir)

---

### TİP 4 — Günlük Nakit Akış Özeti
`header-subtitle`: "GÜNLÜK ÖZET"

İçerik yapısı:
- `greeting`: "[Tarih] tarihli nakit akış özetiniz."
- stat-grid (2 kolon, 2 satır = 4 kart):
  - Bugünkü Tahsilat (positive)
  - Bugünkü Ödeme (negative)
  - Günlük Net (positive/negative duruma göre)
  - Kasa Bakiyesi (nötr, lacivert)
- data-table: Bugünkü hareketler — saat, açıklama, tutar, tür
- Hareket yoksa: "Bugün kayıtlı hareket bulunmuyor." metni, tablo gösterilmez
- CTA buton: "Detaylı Görünüm" → kasa sayfası linki

---

### TİP 5 — Haftalık Ödeme / Vade Özeti
`header-subtitle`: "HAFTALIK ÖZET"

İçerik yapısı:
- `greeting`: "Bu hafta dikkat etmeniz gereken ödemeler."
- alert-block (warning): Toplam bekleyen tutar ve kayıt sayısı özeti
- data-table: Bu hafta vadesi dolacak ödemeler
  Sütunlar: Cari Adı | Açıklama | Vade Tarihi | Tutar | Durum
  Durum renklendirmesi: bugün = kırmızı, yarın = turuncu, bu hafta = sarı
- Vadesi geçmiş kayıt varsa ikinci tablo: Gecikmiş Ödemeler
- CTA buton: "Ödeme Takibine Git" → ödeme takip sayfası linki

---

### TİP 6 — Aylık Bilanço / Kapanış Raporu
`header-subtitle`: "AYLIK RAPOR"

İçerik yapısı:
- `greeting`: "[Ay Adı] [Yıl] dönemi kapanış raporu."
- stat-grid (2 kolon, 3 satır = 6 kart):
  - Toplam Gelir (positive)
  - Toplam Gider (negative)
  - Net Nakit Akışı (duruma göre)
  - Açık Alacak (warning)
  - Açık Borç (warning)
  - Kasa Kapanış Bakiyesi (lacivert)
- divider
- İki ayrı data-table:
  1. En büyük 5 tahsilat
  2. En büyük 5 ödeme
- CTA buton: "Tam Raporu Görüntüle" → kasa/aylık bilanço linki

---

### TİP 7 — Karşılıksız Çek Uyarısı
`header-subtitle`: "ACİL BİLDİRİM"

İçerik yapısı:
- `greeting`: "Karşılıksız çek bildirimi."
- alert-block (danger): Çek bilgileri — çek numarası, cari adı, tutar, vade tarihi
- Kısa metin: "Bu çekin durumu 'karşılıksız' olarak güncellendi."
- stat-grid (1 satır, 2 kart):
  - Çek Tutarı
  - Cari Toplam Bakiyesi
- CTA buton: "Çek Detayını Görüntüle" → ilgili çek sayfası linki
- İkinci CTA (text link): "Carinin tüm hareketleri →"

---

## YAZIM KURALLARI

- Tüm metinler Türkçe, resmi ama sıcak bir dil. Çok resmi veya soğuk olmasın.
- Para tutarları her zaman Türk lirası formatında: `₺1.250,00`
- Tarihler: `15 Mart 2026` formatında — sayısal format kullanma
- Saat: `14:32` formatında
- Mail içinde hiçbir şekilde HTML form elemanı (`<form>`, `<input>`) kullanma
- Tüm linkler `<a href="{{LİNK}}">` ile — placeholder olarak çift süslü parantez kullan
- Mobil uyumluluk: tüm genişlikler `max-width: 600px` ile sınırlı, tablo hücreleri `min-width` ile sabitlenmesin
- Footer'da her zaman şu üç bilgi: otomatik mail uyarısı, destek e-postası, telif hakkı

---

## ÜRETME AKIŞI

1. Hangi mail tipi isteniyor? Kataloğdan eşleştir.
2. Temel şablonu al.
3. Mail tipine ait içerik bloğunu `{{İÇERİK_BURAYA}}` yerine yerleştir.
4. `{{MAİL_TİPİ_ETİKETİ}}` ve `{{MAIL_BAŞLIĞI}}` placeholder'larını doldur.
5. Dinamik değerler (`[Ad]`, `[Tarih]`, tutar vs.) için `{{DEĞER_ADI}}` formatında placeholder bırak.
6. Tam çalışan HTML üret — yarım bırakma.
7. Ürettikten sonra kullanıcıya hangi placeholder'ların backend tarafından doldurulması gerektiğini listele.
