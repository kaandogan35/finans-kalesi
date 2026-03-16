# PROJE.md — Finans Kalesi Canlı Durum ve Yol Haritası
# Son Güncelleme: 16 Mart 2026 — Oturum #16

---

## GÜNCEL DURUM: ✅ Aşama 2F Temizlik TAMAMLANDI — Canlıya Çıkış Hazır
Demo dosyaları silindi, tema CSS'leri `temalar/` klasörüne taşındı, frontend yeniden build edildi.
Sıradaki: Aşama 3 — cPanel'e deploy.

---

## STRATEJİK KARARLAR (Değişmez)

| Karar | Açıklama |
|-------|----------|
| Mobil Strateji | Capacitor.js — Web bittikten sonra mevcut React kodu iOS/Android'e dönüştürülür |
| Dashboard | En sona bırakıldı — tüm modüller tamamlandıktan sonra gerçek veriyle tasarlanacak |
| Modül Sırası | Kasa API → Çek/Senet → Ödemeler → Vade Hesaplayıcı → Tasarım → Dashboard |

---

## AŞAMA DURUMU

### Aşama 1 — PHP REST API ✅ TAMAMLANDI & KİLİTLENDİ
48 endpoint, 7 modül. Değiştirilmeden önce onay istenir.

| Modül | Controller | Route | Endpoint |
|-------|-----------|-------|----------|
| Auth | AuthController.php | routes/auth.php | 5 |
| Cari Hesaplar | CariController.php | routes/cari.php | 10 |
| Çek / Senet | CekSenetController.php | routes/cek_senet.php | 7 |
| Ödeme Takip | OdemeTakipController.php | routes/odeme.php | 7 |
| Kasa | KasaController.php | routes/kasa.php | 16 |
| Dashboard | DashboardController.php | routes/dashboard.php | 1 |
| Ayarlar | AyarlarController.php | routes/ayarlar.php | 1 |

---

### Aşama 2 — React Frontend ✅ TAMAMLANDI

#### Sprint 2A — Temizlik ✅ TAMAMLANDI
#### Sprint 2B — UI Standardizasyonu ✅ TAMAMLANDI
#### Sprint 2C — API Entegrasyonu ✅ TAMAMLANDI

| Durum | Görev | Notlar |
|-------|-------|--------|
| ✅ | 2C-1: Axios Interceptor | localStorage → Zustand. lucide-react kaldırıldı. |
| ✅ | 2C-2: Cari API + Düzeltmeler | API bağlı. 4 hata düzeltildi (stat kartları, tarih parse, vergi_dairesi, her_ikisi türü) |
| ✅ | 2C-4: Kasa UI | VarlikKasa.jsx yazıldı. Mock veri ile çalışıyor. api/kasa.js oluşturuldu. |
| ✅ | **2C-4b: Kasa API Bağlantısı** | API bağlandı. Yatırım güncelle hatası düzeltildi. Aylık hareket filtresi eklendi. Kayıt testleri geçti. |
| ✅ | **2C-3: Çek/Senet API Bağlantısı** | API bağlandı. Tüm tab'lar gerçek veri. Durum değişimleri (tahsil/ciro/iade/ödendi) API'ye bağlı. Cari seçimi entegre edildi. |
| ✅ | **2C-5: Ödemeler UI + API** | Bağlantı yapıldı. |
| ✅ | **2C-6: Aylık Bilanço API Bağlantısı** | `ay_kapanislar` tablosu oluşturuldu. Backend (Kasa.php + KasaController + routes/kasa.php) + Frontend (api/kasa.js + VarlikKasa.jsx) tam bağlı. AES şifreli saklanıyor. |
| ✅ | **2C-7: Dashboard Veri Düzeltmeleri** | 3 uyuşmazlık giderildi: kasa bakiye alias (`bakiye`), aylık giriş/çıkış toplamları, çek/senet hiyerarşik yapı (portföyde/tahsilde/ödendi/karşılıksız). |

---

### Kasa Modülü Detay Durumu

| Sekme | UI | API |
|-------|-----|-----|
| Gösterge Paneli | ✅ | ✅ Hareketlerden hesaplanıyor |
| Nakit Akışı | ✅ | ✅ Aylık filtreli, ekle/sil çalışıyor |
| Aylık Bilanço | ✅ | ✅ `ay_kapanislar` tablosuna AES şifreli kaydediliyor |
| Ortak Carisi | ✅ | ✅ Ekle/sil çalışıyor |
| Yatırım Kalesi | ✅ | ✅ Ekle/güncelle/sil çalışıyor |

**Kasa Özel Notlar:**
- X-Kasa-Sifre header'ı KULLANILMIYOR — şifre ekranı kaldırıldı
- Yatırım Kalesi'nde canlı kur API'si YOK — manuel birim_fiyat kullanılıyor

---

### Aşama 2D — Vade Hesaplayıcı ✅ TAMAMLANDI
> Tamamen frontend-only hesap aracı. Veritabanı gerektirmez.

| Durum | Adım |
|-------|------|
| ✅ | Frontend — VadeHesaplayici.jsx (4 sekme, useMemo hesaplamalar) |
| ✅ | /vade-hesaplayici route — App.jsx |
| ✅ | Sidebar linki — AppLayout.jsx |

---

### Aşama 2E — Dashboard ✅ Obsidian Vault stiliyle tamamlandı

### Aşama 2F — Obsidian Vault Tasarım Dönüşümü ✅ TAMAMLANDI
> Tasarım kuralları: `.claude/skills/koyu-tema.md`
> Bootstrap 5.3 korunuyor, Tailwind/Shadcn YASAK — CSS manuel.

| Aşama | Dosyalar | Durum |
|-------|----------|-------|
| 1: Global CSS + Sidebar + Giriş | index.css, App.css, AppLayout.jsx, GirisYap.jsx | ✅ Tamamlandı |
| 2: Dashboard | Dashboard.jsx | ✅ Tamamlandı |
| 3: Cari Hesaplar | CariYonetimi.jsx | ✅ Tamamlandı |
| 4: Çek/Senet | CekSenet.jsx | ✅ Tamamlandı |
| 5: Varlık & Kasa | VarlikKasa.jsx | ✅ Tamamlandı |
| Temizlik | Demo klasörleri silindi, tema CSS'leri `temalar/` klasörüne taşındı | ✅ Tamamlandı |

**Tema sistemi:** 3 tema (banking, earthy, dark) — CSS dosyaları `frontend/src/temalar/` altında.

---

### Aşama 3 — Canlıya Çıkış Hazırlığı 🏗️ DEVAM EDİYOR
**Hedef domain:** kaandogan.com.tr

| Kontrol | Durum |
|---------|-------|
| Demo/debug dosyaları temizlendi | ✅ |
| Frontend build hazır | ✅ |
| .env production ayarları | ⬜ cPanel'de yapılacak |
| Veritabanı oluşturma + schema import | ⬜ cPanel'de yapılacak |
| SSL sertifikası | ⬜ cPanel'de kontrol edilecek |
| PHP 8.4 + mod_rewrite | ⬜ cPanel'de doğrulanacak |

### Aşama 4 — Mobil (Capacitor.js) ⬜ Web kararlı olduktan sonra
### Aşama 5 — Büyüme Modülleri ⬜ UZAK DÖNEM

---

## 📂 GÜNCEL DOSYA YAPISI
```
finans-kalesi/
├── config/
│   ├── app.php                    ✅
│   └── database.php               ✅
├── controllers/
│   ├── AuthController.php         ✅
│   ├── AyarlarController.php      ✅
│   ├── CariController.php         ✅
│   ├── CekSenetController.php     ✅
│   ├── DashboardController.php    ✅
│   ├── KasaController.php         ✅
│   └── OdemeTakipController.php   ✅
├── middleware/
│   ├── AuthMiddleware.php         ✅
│   └── CorsMiddleware.php         ✅
├── models/
│   ├── CariHareket.php            ✅
│   ├── CariKart.php               ✅
│   ├── CekSenet.php               ✅
│   ├── Kasa.php                   ✅
│   ├── Kullanici.php              ✅
│   ├── OdemeTakip.php             ✅
│   └── Sirket.php                 ✅
├── routes/
│   ├── auth.php                   ✅
│   ├── ayarlar.php                ✅
│   ├── cari.php                   ✅
│   ├── cek_senet.php              ✅
│   ├── dashboard.php              ✅
│   ├── kasa.php                   ✅
│   └── odeme.php                  ✅
├── utils/
│   ├── JWTHelper.php              ✅
│   ├── KriptoHelper.php           ✅
│   ├── RateLimiter.php            ✅
│   ├── Response.php               ✅
│   ├── SistemKripto.php           ✅
│   └── SistemLog.php              ✅
├── database/
│   └── finans_kalesi_schema.sql   ✅
├── frontend/src/
│   ├── api/
│   │   ├── auth.js                ✅
│   │   ├── axios.js               ✅
│   │   ├── ayarlar.js             ✅
│   │   ├── cariler.js             ✅
│   │   ├── cekSenet.js            ✅
│   │   ├── dashboard.js           ✅
│   │   ├── kasa.js                ✅
│   │   └── odeme.js               ✅
│   ├── components/layout/
│   │   ├── AppLayout.jsx          ✅
│   │   ├── AppLayoutBanking.jsx   ✅
│   │   ├── AppLayoutDark.jsx      ✅
│   │   ├── AppLayoutEarthy.jsx    ✅
│   │   ├── KorunanSayfa.jsx       ✅
│   │   └── TemaLayout.jsx         ✅
│   ├── temalar/
│   │   ├── banking.css            ✅ Tema CSS (önceden tasarim-demo/ içindeydi)
│   │   ├── earthy.css             ✅
│   │   └── dark.css               ✅
│   ├── lib/
│   │   ├── temaRenkleri.js        ✅
│   │   └── temaPrefix.js          ✅
│   ├── stores/
│   │   ├── authStore.js           ✅
│   │   └── temaStore.js           ✅
│   ├── pages/
│   │   ├── auth/GirisYap.jsx            ✅
│   │   ├── ayarlar/TemaSecimi.jsx       ✅
│   │   ├── cariler/CariYonetimi.jsx     ✅
│   │   ├── cariler/CarilerListesi.jsx   ✅
│   │   ├── cek-senet/CekSenet.jsx       ✅
│   │   ├── dashboard/Dashboard.jsx      ✅
│   │   ├── kasa/VarlikKasa.jsx          ✅
│   │   ├── odeme-takip/OdemeTakip.jsx   ✅
│   │   └── vade-hesaplayici/VadeHesaplayici.jsx ✅
│   ├── App.jsx                    ✅
│   └── App.css                    ✅
├── public/
│   ├── index.php                  ✅ Tek giriş noktası
│   ├── .htaccess                  ✅
│   └── frontend-build/            ✅ Vite build çıktısı
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
| Toast | sonner | v2 |
| Mobil (gelecek) | Capacitor.js | — |
| Hosting | cPanel Shared Hosting | — |

---

## 🚨 AKTİF TEKNİK BORÇLAR

| # | Sorun | Öncelik |
|---|-------|---------|
| 1 | sonner toast Bootstrap dışı — gerekirse Bootstrap toast'a geçilecek | 🟡 Değerlendirilecek |
