# CANLI-DEPLOY.md — ParamGo Deploy Rehberi
# Her deploy öncesi bu dosyayı oku. Tüm bilgiler bağlayıcıdır.
# Son Güncelleme: 25 Mart 2026

---

## SUNUCU BİLGİLERİ

- **Domain:** paramgo.com
- **cPanel kullanıcı:** goparam
- **PHP sürümü:** 8.4 (cPanel MultiPHP Manager)
- **Panel:** cPanel
- **Deploy yöntemi:** WinSCP (FTP/SFTP)

---

## CANLI SUNUCU DOSYA YAPISI

```
/home/goparam/
│
├── public_html/                              ← Apache web kökü (paramgo.com)
│   │
│   ├── .htaccess                             ← URL yönlendirme (API + SPA + Landing)
│   ├── index.php                             ← ⚠️ API giriş noktası (BASE_PATH FARKLI!)
│   ├── index.html                            ← Landing page ana sayfa
│   │
│   ├── ozellikler.html                       ← Landing sayfaları
│   ├── kurumsal.html                         │
│   ├── sss.html                              │
│   ├── yardim.html                           │
│   ├── iletisim.html                         │
│   ├── destek.html                           │
│   ├── fiyatlar.html                         │
│   │
│   ├── robots.txt                            ← SEO
│   ├── sitemap.xml                           │
│   │
│   ├── assets/                               ← Landing CSS/JS/images
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   │
│   ├── blog/                                 ← Landing blog yazıları
│   │   ├── index.html
│   │   └── [makale].html (11 adet)
│   │
│   ├── frontend-build/                       ← React SPA build çıktısı
│   │   ├── index.html
│   │   └── assets/ (JS/CSS hash'li dosyalar)
│   │
│   ├── cgi-bin/                              ← cPanel varsayılan, dokunma
│   └── .well-known/                          ← SSL sertifika, dokunma
│
└── repositories/finans-kalesi/               ← Backend PHP kodu
    │
    ├── config/
    │   ├── app.php
    │   └── database.php
    │
    ├── controllers/
    │   ├── AuthController.php
    │   ├── CariController.php
    │   ├── CekSenetController.php
    │   ├── OdemeTakipController.php
    │   ├── KasaController.php
    │   ├── DashboardController.php
    │   ├── AbonelikController.php
    │   ├── CronController.php
    │   ├── TurController.php
    │   ├── VeresiyeController.php
    │   ├── KullaniciController.php
    │   ├── GuvenlikController.php
    │   ├── BildirimController.php
    │   └── RaporController.php
    │
    ├── middleware/
    │   ├── AuthMiddleware.php
    │   ├── CorsMiddleware.php
    │   ├── PlanKontrol.php
    │   ├── SinirKontrol.php
    │   └── YetkiKontrol.php
    │
    ├── models/
    │   ├── Kullanici.php
    │   ├── Sirket.php
    │   ├── Abonelik.php
    │   ├── Kasa.php
    │   ├── Bildirim.php
    │   ├── Guvenlik.php
    │   ├── Rapor.php
    │   └── Veresiye.php
    │
    ├── routes/
    │   ├── auth.php
    │   ├── cari.php
    │   ├── cek_senet.php
    │   ├── odeme.php
    │   ├── kasa.php
    │   ├── dashboard.php
    │   ├── ayarlar.php
    │   ├── abonelik.php
    │   ├── sinir.php
    │   ├── cron.php
    │   ├── tur.php
    │   ├── veresiye.php
    │   ├── kullanicilar.php
    │   ├── guvenlik.php
    │   ├── bildirimler.php
    │   └── raporlar.php
    │
    ├── utils/
    │   ├── JWTHelper.php
    │   ├── SistemKripto.php
    │   ├── Response.php
    │   ├── SistemLog.php
    │   ├── RateLimiter.php
    │   ├── SmtpHelper.php
    │   ├── MailHelper.php
    │   ├── MailSablonlar.php
    │   ├── TOTPHelper.php
    │   ├── BildirimOlusturucu.php
    │   └── WhatsappHelper.php
    │
    ├── cron/                                 ← Otomatik zamanlı görevler
    │   ├── .htaccess                         ← HTTP erişimi engellendi (Deny from all)
    │   └── vade-uyari-cron.php               ← Her gün 10:00 çalışır (cPanel Cron Jobs)
    │
    ├── .env                                  ← Canlı şifreler (ASLA üzerine yazma!)
    │
    └── public/                               ← Repo'nun kendi public kopyası
        ├── .htaccess                         ← public_html ile AYNI tutulmalı
        ├── index.php                         ← Lokal index.php ile AYNI (dirname(__DIR__))
        ├── index.html                        ← Landing page kopyası
        └── frontend-build/                   ← public_html ile AYNI tutulmalı
```

---

## ⚠️ KRİTİK: İKİ AYRI index.php

Sunucuda iki farklı `index.php` var. İkisi FARKLI dosyalardır:

### 1. `/home/goparam/public_html/index.php` — Asıl çalışan dosya
```php
define('BASE_PATH', '/home/goparam/repositories/finans-kalesi');
```
- Apache bu dosyayı çalıştırır
- Yeni route/require eklendiğinde `public/index-canli.php` oluşturulup bu dosya olarak yüklenir
- **Lokaldeki karşılığı:** `public/index-canli.php`

### 2. `/home/goparam/repositories/finans-kalesi/public/index.php` — Repo kopyası
```php
define('BASE_PATH', dirname(__DIR__));
```
- Doğrudan çalıştırılmaz, repo'nun yapısal kopyasıdır
- Lokaldeki `public/index.php` ile birebir aynıdır
- **Lokaldeki karşılığı:** `public/index.php`

---

## WinSCP YÜKLEME TABLOSU

### A) Backend → repositories
| Lokal | Sunucu |
|-------|--------|
| `config/` | `/home/goparam/repositories/finans-kalesi/config/` |
| `controllers/` | `/home/goparam/repositories/finans-kalesi/controllers/` |
| `middleware/` | `/home/goparam/repositories/finans-kalesi/middleware/` |
| `models/` | `/home/goparam/repositories/finans-kalesi/models/` |
| `routes/` | `/home/goparam/repositories/finans-kalesi/routes/` |
| `utils/` | `/home/goparam/repositories/finans-kalesi/utils/` |
| `cron/` | `/home/goparam/repositories/finans-kalesi/cron/` |

### B) public/ → İKİ YERE yüklenir
| Lokal | Sunucu Hedef 1 (çalışan) | Sunucu Hedef 2 (repo kopyası) |
|-------|--------------------------|-------------------------------|
| `public/index-canli.php` | `public_html/index.php` | — |
| `public/index.php` | — | `repositories/.../public/index.php` |
| `public/.htaccess` | `public_html/.htaccess` | `repositories/.../public/.htaccess` |
| `public/frontend-build/` | `public_html/frontend-build/` | `repositories/.../public/frontend-build/` |

### C) ParamGo Landing → public_html
| Lokal (paramgo-landing/) | Sunucu |
|--------------------------|--------|
| `index.html` | `public_html/index.html` |
| `ozellikler.html` | `public_html/ozellikler.html` |
| `kurumsal.html` | `public_html/kurumsal.html` |
| `sss.html` | `public_html/sss.html` |
| `yardim.html` | `public_html/yardim.html` |
| `iletisim.html` | `public_html/iletisim.html` |
| `destek.html` | `public_html/destek.html` |
| `fiyatlar.html` | `public_html/fiyatlar.html` |
| `blog/` (tüm klasör) | `public_html/blog/` |
| `assets/` (tüm klasör) | `public_html/assets/` |
| `robots.txt` | `public_html/robots.txt` |
| `sitemap.xml` | `public_html/sitemap.xml` |

---

## DEPLOY HARİTASI — HER DEĞİŞİKLİKTE KONTROL ET

### Hangi dosya değişti → Nereye deploy edilmeli?

| Değişen Dosya | Web (Hosting) | Mobil (Codemagic) | Nasıl? |
|---------------|:---:|:---:|--------|
| `controllers/`, `models/`, `routes/`, `middleware/`, `utils/`, `cron/` | ✅ | ❌ | SFTP otomatik |
| `frontend/src/**` (React kodu) | ✅ | ✅ | Build → WinSCP + GitHub push |
| `public/index-canli.php` | ✅ | ❌ | WinSCP → `public_html/index.php` |
| `public/.htaccess` | ✅ | ❌ | WinSCP → `public_html/.htaccess` |
| `codemagic.yaml` | ❌ | ✅ | GitHub push yeterli |
| Landing page (`paramgo-landing/`) | ✅ | ❌ | WinSCP → `public_html/` |

### ⚠️ EN ÖNEMLİ KURAL:
**Frontend kodu değiştiyse HEM web HEM mobil deploy yapılmalıdır!**
Birini unutursan web ile mobil farklı sürüm gösterir.

---

## DEPLOY ADIMLARI (3 AŞAMALI)

### Aşama 1: Build & Commit
```
1. git add . && git commit -m "açıklama"
2. Frontend değiştiyse → cd frontend && npm run build
3. index.php değiştiyse → public/index-canli.php güncelle (BASE_PATH = canlı yol)
```

### Aşama 2: Web Deploy (Hosting)
```
4. Git Bash'te:  bash deploy-check.sh   (ne yükleneceğini gösterir)
5. WinSCP'de dosyaları yükle (yukarıdaki tablolara bak)
6. Frontend build yükleniyorsa → eski hash'li asset dosyalarını sunucudan sil
7. Siteyi test et:
   - paramgo.com → landing page açılıyor mu?
   - paramgo.com/api/health → aktif yanıtı dönüyor mu?
   - Uygulamaya giriş yap, modülleri kontrol et
8. Başarılıysa:  git tag -f deploy-last
```

### Aşama 3: Mobil Deploy (Codemagic → TestFlight)
```
9.  Frontend değiştiyse → git push paramgo master:main
10. Codemagic otomatik build başlar (veya manuel: Start new build)
11. Build başarılı → TestFlight'a otomatik yüklenir
12. iPhone'da TestFlight → ParamGo güncelle
```

### SADECE Backend değiştiyse: Aşama 1 + 2 yeterli (Aşama 3 atla)
### SADECE codemagic.yaml değiştiyse: Aşama 1 + 3 yeterli (Aşama 2 atla)
### Frontend değiştiyse: Aşama 1 + 2 + 3 HEPSİ gerekli!

---

## MOBİL (CODEMAGIC) BİLGİLERİ

- **GitHub Repo:** github.com/kaandogan35/paramgo (remote: `paramgo`)
- **CI/CD:** Codemagic — codemagic.io
- **Workflow:** ParamGo iOS Release
- **Branch:** `main` (lokalde `master`, push sırasında `master:main`)
- **Build süresi:** ~2-3 dakika
- **Çıktı:** App.ipa → TestFlight'a otomatik yüklenir

### Codemagic Ortam Değişkenleri (default group)
| Değişken | Açıklama |
|----------|----------|
| `APP_STORE_CONNECT_PRIVATE_KEY` | App Store API anahtarı (base64) |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID |
| `CM_CERTIFICATE` | distribution_pwd.p12 (base64) |
| `CM_CERTIFICATE_PASSWORD` | p12 şifresi |
| `CM_PROVISIONING_PROFILE` | ParamGo_AppStore.mobileprovision (base64) |

### Mobilde API URL
Mobil uygulama `https://kaandogan.com.tr/api` adresini kullanır (axios.js'de Capacitor.isNativePlatform() ile belirlenir). Backend'de değişiklik yapıldığında mobil de otomatik yansır — sadece frontend değişiklikleri yeni build gerektirir.

### Git Push Komutu (Mobil Deploy İçin)
```bash
git push paramgo master:main
```
NOT: `origin` hosting repo'sudur, `paramgo` Codemagic repo'sudur. İkisi farklı!

---

## HİÇBİR ZAMAN YÜKLENMEYEN DOSYALAR

| Dosya | Neden |
|-------|-------|
| `.env` | Canlıda ayrı .env var (şifreler farklı) |
| `frontend/src/` | Kaynak kod — build çıktısı yüklenir |
| `frontend/node_modules/` | Sunucuda yok, gerekmez |
| `database/` | Migration'lar phpMyAdmin'de elle çalıştırılır (`migration_vade_uyari.sql` dahil) |
| `CLAUDE.md` | Geliştirme notu |
| `PROJE.md` | Geliştirme notu |
| `CANLI-DEPLOY.md` | Bu dosya — geliştirme notu |
| `deploy-check.sh` | Geliştirme aracı |
| `public/index-canli.php` | Sunucuya `index.php` adıyla yüklenir |
| `paramgo-landing/PROJE.md` | Geliştirme notu |
| `paramgo-landing/BILESKENLER.md` | Geliştirme notu |
| `paramgo-landing/setup-vhost.bat` | Lokal geliştirme aracı |

---

## HIZLI KOMUTLAR (Git Bash)

```bash
# Ne değişti göster:
bash deploy-check.sh

# Son deploy'dan bu yana değişen dosyalar:
git diff deploy-last --name-only

# Detaylı fark:
git diff deploy-last

# Belirli bir dosyanın farkı:
git diff deploy-last -- public/index.php

# Deploy sonrası tag güncelle:
git tag -f deploy-last

# Deploy tag'inin tarihi:
git log -1 --format="%cd" --date=format:"%d.%m.%Y %H:%M" deploy-last
```
