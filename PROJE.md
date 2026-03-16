# PROJE.md — Finans Kalesi Canlı Durum ve Yol Haritası
# Son Güncelleme: 16 Mart 2026 — Oturum #20

---

## GÜNCEL DURUM: 🔄 Aşama 4 DEVAM EDİYOR — Abonelik Sistemi
Kayıt + giriş sistemi çalışıyor. Ücretsiz plan kullanım sınırları (4D) tamamlandı.
Sıradaki: Ödeme entegrasyonu (4E — İyzico/Stripe) — sağlayıcı seçimi bekleniyor.

---

## ⚠️ SQL KURALI
Veritabanı değişikliği gerektiren her işlemde SQL kodu mesajda verilir.
Kaan bunu cPanel phpMyAdmin (hosting) ve Laragon (local) üzerinden kendisi çalıştırır.

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
| Temizlik | Tema CSS'leri `temalar/` klasörüne taşındı | ✅ Tamamlandı |
| Demo Temizliği | `tasarim-demo/`, `tasarim-demo-v2/`, `tasarim-demo-v3/` silindi (15 dosya) | ✅ Tamamlandı |

**Tema sistemi:** 3 tema (banking, earthy, dark) — CSS dosyaları `frontend/src/temalar/` altında.

---

### Aşama 3 — Canlıya Çıkış ✅ TAMAMLANDI
**Hedef domain:** kaandogan.com.tr

| # | Kontrol | Durum |
|---|---------|-------|
| 1 | Demo klasörleri silindi (tasarim-demo, v2, v3) | ✅ Yapıldı |
| 2 | Frontend rebuild (demo silindikten sonra) | ✅ Yapıldı |
| 3 | .env production ayarları | ✅ Canlıda ayrı .env düzenlendi |
| 4 | Veritabanı oluşturma + schema import | ✅ Yapıldı |
| 5 | SSL sertifikası | ✅ Aktif |
| 6 | PHP 8.4 + mod_rewrite | ✅ Doğrulandı |

---

### Aşama 4 — Abonelik & SaaS Altyapısı 🔄 DEVAM EDİYOR

#### 4A — Veritabanı + Plan Sistemi ✅ TAMAMLANDI
DB migration çalıştırıldı (hosting + local). Mevcut kullanıcılar `ucretsiz` plana geçirildi.

| # | İş | Durum |
|---|-----|-------|
| 1 | `abonelikler` ve `odeme_gecmisi` tabloları oluşturuldu | ✅ |
| 2 | `sirketler.abonelik_plani` ENUM güncellendi (ucretsiz/standart/kurumsal) | ✅ |
| 3 | `sirketler.kampanya_kullanici` kolonu eklendi | ✅ |
| 4 | Mevcut tüm kullanıcılar ucretsiz plana geçirildi | ✅ |
| 5 | `.env` → `LANSMAN_BITIS_TARIHI=2026-06-14 23:59:59` eklendi | ✅ |

#### 4B — Backend API ✅ TAMAMLANDI

| Dosya | İş | Durum |
|-------|-----|-------|
| `middleware/PlanKontrol.php` | Özellik bazlı izin kontrolü (pdf, excel, api vb.) | ✅ |
| `middleware/SinirKontrol.php` | Kullanım sınırı kontrolü + sayım + durum özeti | ✅ |
| `models/Abonelik.php` | Plan güncelleme, ödeme geçmişi, kampanya kontrolü | ✅ |
| `controllers/AbonelikController.php` | Plan listesi, durum, geçmiş, yükseltme (placeholder) | ✅ |
| `controllers/WebhookController.php` | Web/Apple/Google webhook placeholder'ları | ✅ |
| `controllers/SinirController.php` | `GET /api/sinir/durum` — kullanım özeti | ✅ |
| `routes/abonelik.php` | `/api/abonelik/*` ve `/api/webhook/*` | ✅ |
| `routes/sinir.php` | `/api/sinir/durum` | ✅ |
| `models/Sirket.php` | Yeni kayıtta `abonelik_plani='ucretsiz'` düzeltmesi | ✅ |
| `controllers/CariController.php` | `olustur()` içinde cari sınırı kontrolü (25) | ✅ |
| `controllers/CekSenetController.php` | `olustur()` içinde aylık çek sınırı kontrolü (10) | ✅ |
| `controllers/AuthController.php` | Kayıtta abonelik + kampanya oluşturma, JWT'ye plan eklendi | ✅ |

#### 4C — Frontend ✅ TAMAMLANDI

| Dosya | İş | Durum |
|-------|-----|-------|
| `pages/auth/KayitOl.jsx` | 2 adımlı kayıt formu (GirisYap tasarımıyla aynı) | ✅ |
| `pages/abonelik/PlanSecim.jsx` | Plan karşılaştırma + mevcut plan + ödeme geçmişi | ✅ |
| `components/PlanYukseltModal.jsx` | Kısıtlı özelliğe tıklanınca çıkan yükseltme modalı | ✅ |
| `hooks/usePlanKontrol.js` | Özellik bazlı izin hook'u (`izinVarMi('pdf_rapor')`) | ✅ |
| `hooks/useSinirler.js` | Kullanım sınırı durum hook'u (`uyariDurum('cari')`) | ✅ |
| `api/abonelik.js` | Abonelik API çağrıları | ✅ |
| `api/sinir.js` | Sinir durum API çağrısı | ✅ |
| `App.jsx` | `/kayit` route → KayitOl, `/abonelik` route → PlanSecim | ✅ |
| AppLayout (3 tema) | Sidebar'a "Aboneliğim" linki eklendi | ✅ |

#### 4D — Kullanım Sınırları (Ücretsiz Plan) ✅ TAMAMLANDI

| Sınır | Değer | Backend | Frontend |
|-------|-------|---------|---------|
| Toplam cari | 25 | ✅ 403 döner | ✅ Buton disable + ilerleme çubuğu (CariYonetimi) |
| Aylık çek/senet | 10 | ✅ 403 döner | ✅ Buton disable + ilerleme çubuğu (CekSenet, 2 tab) |
| Kasa geçmişi | 2 ay görüntüleme | ✅ KasaController'a filtre + gecmis_kisitli flag | ✅ Nakit Akışı'nda uyarı banner'ı |
| PDF/Excel rapor | Yok | ✅ PlanKontrol.php hazır | ⬜ usePlanKontrol hook hazır |
| Çok kullanıcı | Yok | ✅ PlanKontrol.php hazır | ⬜ |

#### 4E — Ödeme Entegrasyonu ⬜ SIRADA

| # | İş | Durum |
|---|-----|-------|
| 1 | Ödeme sağlayıcısı seç (İyzico / Param / Stripe) | ⬜ Karar verilecek |
| 2 | `WebhookController.php` → gerçek ödeme işleme | ⬜ Placeholder hazır |
| 3 | Başarılı ödemede `planGuncelle()` çağır + JWT yenile | ⬜ |
| 4 | Frontend "Abone Ol" butonu → ödeme sayfasına yönlendir | ⬜ |
| 5 | Apple IAP entegrasyonu (Capacitor sonrası) | ⬜ Uzak dönem |
| 6 | Google Play entegrasyonu (Capacitor sonrası) | ⬜ Uzak dönem |

#### 4F — Upgrade Bildirimleri ✅ TAMAMLANDI

| # | İş | Durum |
|---|-----|-------|
| 1 | Login sonrası upgrade banner (ücretsiz plan, oturum başına 1 kez) | ✅ |
| 2 | Sınıra yaklaşınca uyarı (%80 — mevcut/limit + ilerleme çubuğu) | ✅ |
| 3 | Sınır dolunca `PlanYukseltModal` otomatik açılması (oturum başına 1 kez) | ✅ |
| 4 | Dashboard'da plan durumu widget'ı | ⬜ Opsiyonel — sonraya bırakıldı |

**Dosya:** `components/UpgradeBildirim.jsx` — 4 layout'a eklendi (AppLayout, Banking, Earthy, Dark)

---

### Aşama 5 — Mobil (Capacitor.js) ⬜ Web kararlı olduktan sonra
### Aşama 6 — Büyüme Modülleri ⬜ UZAK DÖNEM

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
