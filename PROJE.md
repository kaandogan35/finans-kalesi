# PROJE.md — Finans Kalesi Canlı Durum ve Yol Haritası
# Son Güncelleme: 14 Mart 2026 — Oturum #13

---

## GÜNCEL DURUM: 🎨 Aşama 2F — Obsidian Vault Tasarım Dönüşümü DEVAM EDİYOR
Tüm frontend sayfaları "Obsidian Vault" koyu premium tasarım sistemine geçiriliyor.
5 aşamalı plan uygulanıyor. Her aşama sonunda kullanıcı onayı alınıyor.

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
#### Sprint 2C — API Entegrasyonu ✅ TAMAMLANDI

| Durum | Görev | Notlar |
|-------|-------|--------|
| ✅ | 2C-1: Axios Interceptor | localStorage → Zustand. lucide-react kaldırıldı. |
| ✅ | 2C-2: Cari API + Düzeltmeler | API bağlı. 4 hata düzeltildi (stat kartları, tarih parse, vergi_dairesi, her_ikisi türü) |
| ✅ | 2C-4: Kasa UI | VarlikKasa.jsx yazıldı. Mock veri ile çalışıyor. api/kasa.js oluşturuldu. |
| ✅ | **2C-4b: Kasa API Bağlantısı** | API bağlandı. Yatırım güncelle hatası düzeltildi. Aylık hareket filtresi eklendi. Kayıt testleri geçti. |
| ✅ | **2C-3: Çek/Senet API Bağlantısı** | API bağlandı. Tüm tab'lar gerçek veri. Durum değişimleri (tahsil/ciro/iade/ödendi) API'ye bağlı. Cari seçimi entegre edildi. |
| 🔶 | 2C-5: Ödemeler UI + API | Henüz başlanmadı — ŞU ANKİ GÖREV |

---

### Kasa Modülü Detay Durumu

| Sekme | UI | API |
|-------|-----|-----|
| Gösterge Paneli | ✅ | ✅ Hareketlerden hesaplanıyor |
| Nakit Akışı | ✅ | ✅ Aylık filtreli, ekle/sil çalışıyor |
| Aylık Bilanço | ✅ | ⬜ Backend endpoint yok — local state, ileriye bırakıldı |
| Ortak Carisi | ✅ | ✅ Ekle/sil çalışıyor |
| Yatırım Kalesi | ✅ | ✅ Ekle/güncelle/sil çalışıyor |

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

### Aşama 2E — Dashboard ✅ Obsidian Vault stiliyle tamamlandı (Aşama 2F içinde)

### Aşama 2F — Obsidian Vault Tasarım Dönüşümü 🏗️ DEVAM EDİYOR
> 5 aşamalı plan: `.claude/plans/adaptive-tumbling-wren.md`
> Tasarım kuralları: `.claude/skills/koyu-tema.md`
> Bootstrap 5.3 korunuyor, Tailwind/Shadcn YASAK — CSS manuel.

| Aşama | Dosyalar | Durum |
|-------|----------|-------|
| 1: Global CSS + Sidebar + Giriş | index.css, App.css, AppLayout.jsx, GirisYap.jsx | ✅ Tamamlandı + onaylandı |
| 2: Dashboard | Dashboard.jsx | ✅ Tamamlandı + onaylandı |
| 3: Cari Hesaplar | CariYonetimi.jsx | ✅ Tamamlandı + onaylandı |
| 4: Çek/Senet | CekSenet.jsx | ✅ Tamamlandı + onaylandı |
| 5: Varlık & Kasa | VarlikKasa.jsx | ✅ Tamamlandı — kullanıcı onayı bekleniyor |
| **Temizlik** | **tasarim-demo/ sil, kullanılmayan CSS temizle** | **🔶 SIRADA** |

**Yeni oturumda "tasarıma devam ediyoruz" dendiğinde:**
1. Bu tablodan kaldığın aşamayı bul
2. Plan dosyasını oku: `.claude/plans/adaptive-tumbling-wren.md`
3. Skill dosyalarını oku: `koyu-tema.md` + `react-bootstrap-ui.md`
4. `frontend-design` skill'ini kullan
5. Aşama tamamlanınca kullanıcı onayı al, skill dosyasını güncelle

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
│   │   ├── cekSenet.js      ✅ API bağlı
│   │   └── odeme.js         ⬜ Oluşturulacak
│   ├── pages/
│   │   ├── auth/GirisYap.jsx          ✅
│   │   ├── cariler/CariYonetimi.jsx   ✅ API bağlı, 4 hata düzeltildi
│   │   ├── cariler/CarilerListesi.jsx ✅
│   │   ├── dashboard/Dashboard.jsx    ✅ (UI en sona)
│   │   ├── kasa/VarlikKasa.jsx        ✅ API bağlı, testler geçti
│   │   ├── cek-senet/CekSenet.jsx     ✅ API bağlı, gerçek veri
│   │   ├── odeme-takip/               ⬜ Oluşturulacak
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
| 1 | Ödemeler sayfası henüz başlanmadı | 🔴 Sıradaki görev |
| 4 | Aylık Bilanço backend endpoint yok | 🟡 İleride eklenecek |
| 5 | Vade Hesaplayıcı DB sütunları yok | 🟡 Sprint 2D |
| 6 | public/htaccess noktasız kopya | 🟡 Silinecek |
| 7 | sonner toast Bootstrap dışı | 🟡 Değerlendirilecek |
| 8 | hooks/ ve lib/ boş klasörler | 🟢 Temizlenebilir |