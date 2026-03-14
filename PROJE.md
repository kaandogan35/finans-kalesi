# PROJE.md — Finans Kalesi Canlı Durum ve Yol Haritası
# Son Güncelleme: 14 Mart 2026 — Oturum #10

---

## GÜNCEL DURUM: 🏗️ Sprint 2C — Cari Düzeltmeler Tamamlandı
Cari modülündeki 4 kritik hata düzeltildi.
Sıradaki iş: Kasa mock verilerini gerçek API'ye bağlamak.

---

## STRATEJİK KARARLAR (Değişmez)

| Karar | Açıklama |
|-------|----------|
| Mobil Strateji | Capacitor.js — Web bittikten sonra mevcut React kodu iOS/Android'e dönüştürülür |
| Dashboard | En sona bırakıldı — tüm modüller tamamlandıktan sonra gerçek veriyle tasarlanacak |
| Canlıya Çıkış | Uygulama tamamen bitmeden canlıya çıkılmaz |
| Modül Sırası | Kasa API → Çek/Senet → Ödemeler → Vade Hesaplayıcı → Tasarım → Dashboard |

---

## AŞAMA DURUMU

### Aşama 1 — PHP REST API ✅ TAMAMLANDI & KİLİTLENDİ
51 endpoint, 6 modül. Değiştirilmeden önce onay istenir.

---

### Aşama 2 — React Frontend 🏗️ DEVAM EDİYOR

#### Sprint 2A — Temizlik ✅ TAMAMLANDI
#### Sprint 2B — UI Standardizasyonu ✅ BÜYÜK ÖLÇÜDE TAMAMLANDI
#### Sprint 2C — API Entegrasyonu 🏗️ DEVAM EDİYOR

| Durum | Görev | Notlar |
|-------|-------|--------|
| ✅ | 2C-1: Axios Interceptor | localStorage → Zustand. lucide-react kaldırıldı. |
| ✅ | 2C-2: Cari API + Düzeltmeler | API bağlı. 4 hata düzeltildi (stat kartları, tarih parse, vergi_dairesi, her_ikisi türü) |
| ✅ | 2C-4: Kasa UI | VarlikKasa.jsx 5 parçada yazıldı. Mock veri ile çalışıyor. api/kasa.js oluşturuldu. |
| ⬜ | **2C-4b: Kasa API Bağlantısı** | Mock veriler gerçek backend'e bağlanacak — ŞU ANKİ GÖREV |
| ⬜ | 2C-3: Çek/Senet UI + API | Henüz başlanmadı |
| ⬜ | 2C-5: Ödemeler UI + API | Henüz başlanmadı |

---

### Kasa Modülü Detay Durumu

| Sekme | UI | API |
|-------|-----|-----|
| Gösterge Paneli | ✅ Mock | ⬜ |
| Nakit Akışı | ✅ Mock | ⬜ |
| Aylık Bilanço | ✅ Local state | ⬜ Backend endpoint yok — ileriye bırakıldı |
| Ortak Carisi | ✅ Mock | ⬜ |
| Yatırım Kalesi | ✅ Mock | ⬜ |

**Kasa Özel Notlar:**
- X-Kasa-Sifre header'ı KULLANILMIYOR — şifre ekranı kaldırıldı
- Aylık Bilanço kalıcılığı backend endpoint gerektiriyor — şimdilik local state
- Yatırım Kalesi'nde canlı kur API'si YOK — manuel birim_fiyat kullanılıyor

---

### Aşama 2D — Vade Hesaplayıcı ⬜ BEKLEMEDE
> Sprint 2C tamamen bitmeden başlanmaz. DB sütunları henüz yok.

| Durum | Adım |
|-------|------|
| ⬜ | DB tasarımı (vade_hesaplamalari tablosu) |
| ⬜ | Backend (yeni-modul-ekle.md skill'i okunarak) |
| ⬜ | Frontend — bağımsız sayfa |

---

### Aşama 2E — Dashboard ⬜ EN SONA BIRAKILDI
### Aşama 2F — Komple UI Rebrand ⬜ TÜM MODÜLLER BİTİNCE
> Tüm modüller çalışır hale geldikten sonra yapılacak.
> 21st.dev'den ilham alınacak, Bootstrap 5.3 korunacak.
> Tailwind ve Shadcn YASAK — CSS manuel yazılacak.

### Aşama 3 — Canlıya Çıkış Hazırlığı ⬜ BEKLEMEDE
### Aşama 4 — Mobil (Capacitor.js) ⬜ Web kararlı olduktan sonra
### Aşama 5 — Büyüme Modülleri ⬜ UZAK DÖNEM

---

## 📂 GÜNCEL DOSYA YAPISI
```
finans-kalesi/
├── controllers/
│   ├── AuthController.php       ✅
│   ├── CariController.php       ✅
│   ├── CekSenetController.php   ✅
│   ├── DashboardController.php  ✅
│   ├── KasaController.php       ✅
│   └── OdemeTakipController.php ✅
├── frontend/src/
│   ├── api/
│   │   ├── auth.js          ✅
│   │   ├── axios.js         ✅
│   │   ├── cariler.js       ✅ ozet() eklendi
│   │   ├── dashboard.js     ✅
│   │   ├── kasa.js          ✅ Oluşturuldu
│   │   ├── cekSenet.js      ⬜ Oluşturulacak
│   │   └── odemeler.js      ⬜ Oluşturulacak
│   ├── pages/
│   │   ├── auth/GirisYap.jsx          ✅
│   │   ├── cariler/CariYonetimi.jsx   ✅ API bağlı, 4 hata düzeltildi
│   │   ├── cariler/CarilerListesi.jsx ✅
│   │   ├── dashboard/Dashboard.jsx    ✅ (UI en sona)
│   │   ├── kasa/VarlikKasa.jsx        ✅ UI tamam, mock veri
│   │   ├── cek-senet/                 ⬜ Oluşturulacak
│   │   ├── odemeler/                  ⬜ Oluşturulacak
│   │   └── vade-hesaplayici/          ⬜ Oluşturulacak
│   ├── stores/authStore.js   ✅
│   ├── App.jsx               ✅
│   └── App.css
├── public/
│   ├── .htaccess            ✅
│   └── ⚠️ htaccess          Silinecek
├── .env / .env.example
├── CLAUDE.md
└── PROJE.md
```

---

## 🛠️ TEKNOLOJİ YIĞINI

| Katman | Teknoloji | Versiyon |
|--------|-----------|---------|
| Backend | PHP (Saf) | 8.4 |
| Veritabanı | MariaDB | 10.5+ |
| Auth | Özel JWT | — |
| Şifreleme | AES-256-GCM | — |
| Frontend | React + Vite | 19 / 7+ |
| Routing | React Router | v7 |
| State | Zustand | v5 |
| HTTP | Axios | v1 |
| UI | Bootstrap + Bootstrap Icons | 5.3 |
| PDF | html2pdf.js | 0.14 |
| Toast | sonner | v2 (değerlendirilecek) |
| Mobil (gelecek) | Capacitor.js | — |
| Hosting | cPanel Shared Hosting | — |

---

## 🚨 AKTİF TEKNİK BORÇLAR (Öncelik Sırasına Göre)

| # | Sorun | Öncelik |
|---|-------|---------|
| 1 | Kasa mock verileri gerçek API'ye bağlanmadı | 🔴 Sıradaki görev |
| 2 | Çek/Senet sayfası henüz başlanmadı | 🔴 Kritik modül |
| 3 | Ödemeler sayfası tamamlanmadı | 🟡 Sprint 2C-5 |
| 4 | Aylık Bilanço backend endpoint yok | 🟡 İleride eklenecek |
| 5 | Vade Hesaplayıcı DB sütunları yok | 🟡 Sprint 2D |
| 6 | public/htaccess noktasız kopya | 🟡 Silinecek |
| 7 | sonner toast Bootstrap dışı | 🟡 Değerlendirilecek |
| 8 | hooks/ ve lib/ boş klasörler | 🟢 Temizlenebilir |