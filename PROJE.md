# PROJE.md — Finans Kalesi Canlı Durum ve Yol Haritası
# Son Güncelleme: 15 Mart 2026 — Oturum #15

---

## GÜNCEL DURUM: ✅ Vade Hesaplayıcı Modülü TAMAMLANDI (Sprint 2D)
Tamamen frontend-only, 4 sekme, ağırlıklı ortalama vade hesaplama aracı.
Sıradaki: Aşama 2F temizlik adımı (tasarim-demo/ silme, kullanılmayan CSS temizleme).

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
│   │   ├── kasa.js          ✅ bilanco CRUD eklendi
│   │   ├── cekSenet.js      ✅ API bağlı
│   │   └── odeme.js         ✅ API bağlı
│   ├── pages/
│   │   ├── auth/GirisYap.jsx          ✅
│   │   ├── cariler/CariYonetimi.jsx   ✅ API bağlı, 4 hata düzeltildi
│   │   ├── cariler/CarilerListesi.jsx ✅
│   │   ├── dashboard/Dashboard.jsx    ✅ Gerçek veri bağlı, 3 alan uyuşmazlığı düzeltildi
│   │   ├── kasa/VarlikKasa.jsx        ✅ Tüm sekmeler API bağlı (bilanco dahil)
│   │   ├── cek-senet/CekSenet.jsx     ✅ API bağlı, gerçek veri
│   │   ├── odeme-takip/               ✅ API bağlı
│   │   └── vade-hesaplayici/
│   │       └── VadeHesaplayici.jsx    ✅ 4 sekme, frontend-only hesap aracı
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
| 1 | 2F Temizlik: tasarim-demo/ silme, kullanılmayan CSS | 🔴 Sıradaki görev |
| 2 | public/htaccess noktasız kopya | 🟡 Silinecek |
| 4 | sonner toast Bootstrap dışı | 🟡 Değerlendirilecek |
| 5 | hooks/ ve lib/ boş klasörler | 🟢 Temizlenebilir |