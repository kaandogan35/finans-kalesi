# Mobil Kontrol — Capacitor Uyumluluk Skill'i
# Sen: "mobil kontrol", "capacitor kontrol", "mobil uyumlu mu"

---

## NE YAPAR
Belirtilen sayfayı tarar, Capacitor/mobil uyumluluk sorunlarını bulur ve raporlar.

---

## KONTROL LİSTESİ

Kullanıcının belirttiği JSX dosyasını oku ve şunları kontrol et:

### 1. Dokunma Alanı (44x44px Kuralı)
```
TARA: Tüm <button> ve <a> elemanları
KURAL: min-width: 44px VE min-height: 44px olmalı
SORUN: 44px altında olan butonları listele
```

### 2. localStorage Kullanımı (YASAK)
```
TARA: localStorage.getItem, localStorage.setItem, localStorage.removeItem
KURAL: Zustand store kullanılmalı
SORUN: localStorage bulunan satırları listele
```

### 3. window.location Kullanımı (YASAK)
```
TARA: window.location, window.location.href, window.location.replace
KURAL: React Router (useNavigate, <Link>) kullanılmalı
SORUN: window.location bulunan satırları listele
```

### 4. Tablo Wrapper (Zorunlu)
```
TARA: <table> elemanları
KURAL: Her tablo <div className="table-responsive"> içinde olmalı
SORUN: Wrapper'sız tabloları listele
```

### 5. Sabit Genişlik (Uyarı)
```
TARA: style={{ width: 'Xpx' }}, style={{ maxWidth: 'Xpx' }}
KURAL: Bootstrap responsive sınıfları tercih edilmeli (col-md-6 vb.)
SORUN: Sabit genişlik kullanılan yerleri listele (modal maxWidth hariç)
```

### 6. Sabit Yükseklik (Uyarı)
```
TARA: style={{ height: 'Xpx' }} (50px üstü)
KURAL: İçeriğe göre büyüyebilmeli
SORUN: Sabit yükseklik kullanılan yerleri listele
```

### 7. Hover-Only Etkileşim (Uyarı)
```
TARA: :hover CSS veya onMouseEnter/onMouseLeave
KURAL: Mobilde hover yok — tıklama/dokunma alternatifi olmalı
SORUN: Sadece hover'a bağlı etkileşimleri listele
```

---

## ÇIKTI FORMATI

```
📱 MOBİL UYUMLULUK RAPORU — [SayfaAdı.jsx]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 KRİTİK (mutlaka düzelt):
  - Satır 45: <button> 32x32px → 44x44px yap
  - Satır 120: localStorage.getItem → Zustand store kullan

🟡 ORTA (düzeltmeli):
  - Satır 88: <table> wrapper eksik → table-responsive ekle

🟢 BİLGİ (değerlendirmeli):
  - Satır 200: width: '300px' → col-md-6 düşünülebilir

✅ TEMİZ (sorun yok):
  - window.location kullanımı yok
  - Tüm butonlar 44px üstü

SKOR: 8/10 (2 kritik sorun)
```

---

## TOPLU TARAMA
Kullanıcı "tüm sayfaları tara" derse:
1. `frontend/src/pages/` altındaki tüm JSX dosyalarını listele
2. Her birini sırayla kontrol et
3. Sorunlu olanları özet tabloyla göster
