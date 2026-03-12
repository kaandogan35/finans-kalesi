# PROJE.md — Finans Kalesi Canlı Durum Tablosu
# Son Güncelleme: 11 Mart 2026 — Oturum #6

---

## GÜNCEL DURUM: 🚀 Frontend Devrimi (Bootstrap 5 + React)
Backend API modülleri (PHP 8.2) başarıyla tamamlandı ve korumaya alındı. Şu an projenin "Vitrin" aşamasındayız. Tailwind CSS vizyonumuza uymadığı için terk edildi; tüm sistem **Bootstrap 5 ve Premium Light Glass** tasarımıyla yeniden inşa ediliyor.

---

## AŞAMA DURUMU

### Aşama 1 — PHP REST API (Backend) ✅ TAMAMLANDI
| Durum | Adım | Açıklama |
|-------|------|----------|
| ✅ | 1.1 Temel Altyapı | PHP 8.2, PDO, JWT Auth, Router |
| ✅ | 1.2 Güvenlik | AES-256-GCM (V2) Şifreleme, Multi-Tenant İzolasyon |
| ✅ | 1.3 Modüller | Cari, Çek/Senet, Ödeme Takip, Kozmik Oda (Kasa) |

### Aşama 2 — React Frontend (Web) 🏗️ DEVAM EDİYOR
| Durum | Adım | Açıklama |
|-------|------|----------|
| ✅ | 2.1 Teknoloji | React + Vite + Bootstrap 5 Kurulumu |
| 🏗️ | 2.2 UI/UX Revizyon | login.php Referanslı Premium Tasarım (Genişlik & Tokluk) |
| 🏗️ | 2.3 Cari Modülü | Müşteri/Tedarikçi Sekmeleri, Sıralama Zekası, State Modallar |
| ⬜ | 2.4 API Bağlantısı | Axios ile Gerçek Veri Entegrasyonu |

---

## 🛠️ YENİ TEKNOLOJİ YIĞINI (TECH STACK)
- **Frontend:** React 18, Vite, Bootstrap 5.3, Bootstrap Icons.
- **Backend:** Saf PHP 8.2 (Frameworksüz), MariaDB 10.5.
- **Tasarım Dili:** "Kurumsal Bankacılık" — Ferah, geniş paddingli, `.premium-card` tabanlı.
- **Kritik Fark:** Modallar ve UI etkileşimleri Bootstrap JS ile değil, **React State** ile yönetilir.

---

## 📂 GÜNCEL DOSYA YAPISI
```text
/
├── backend/ (PHP API - Kasa)
│   ├── api/ (Cari, Cek, Kasa, Auth endpointleri)
│   ├── config/ (db.php)
│   ├── utils/ (SifreHelper.php, JWTHelper.php)
├── frontend/ (React App - Vitrin)
│   ├── src/
│   │   ├── components/ (Modallar, Tablolar, Kartlar)
│   │   ├── pages/ (CariYonetimi.jsx, Dashboard.jsx, Login.jsx)
│   │   ├── App.css (Global Premium Styles)
├── CLAUDE.md (Teknik Kurallar)
└── PROJE.md (Bu Dosya)