# CANLI-DEPLOY.md — Finans Kalesi Deploy Rehberi
# Her deploy öncesi bu dosyayı aç.

---

## DEPLOY ADIMLARI

```
1. git add . && git commit -m "açıklama"
2. Frontend değiştiyse → npm run build  (frontend/ klasöründe)
3. Git Bash'te:  bash deploy-check.sh   (ne yükleneceğini gösterir)
4. WinSCP'de dosyaları yükle  (aşağıdaki path tablosuna bak)
5. Siteyi test et (giriş yap, temel fonksiyonlar çalışıyor mu?)
6. Başarılıysa:  git tag -f deploy-last
```

---

## WinSCP PATH TABLOSU

| Lokal Klasör/Dosya | Sunucuda Nereye |
|--------------------|-----------------|
| `config/` | `/home/kdgfethi09/repositories/finans-kalesi/config/` |
| `controllers/` | `/home/kdgfethi09/repositories/finans-kalesi/controllers/` |
| `middleware/` | `/home/kdgfethi09/repositories/finans-kalesi/middleware/` |
| `models/` | `/home/kdgfethi09/repositories/finans-kalesi/models/` |
| `routes/` | `/home/kdgfethi09/repositories/finans-kalesi/routes/` |
| `utils/` | `/home/kdgfethi09/repositories/finans-kalesi/utils/` |
| `public/frontend-build/` | `/home/kdgfethi09/public_html/frontend-build/` |
| `public/.htaccess` | `/home/kdgfethi09/public_html/.htaccess` |

---

## ⚠️ ÖZEL DURUM: public/index.php

Canlıdaki `public_html/index.php` ile lokaldeki `public/index.php` FARKLIDIR.
Canlıda BASE_PATH sabit yol kullanıyor: `/home/kdgfethi09/repositories/finans-kalesi`

**Yeni bir route eklendiğinde:**
- Lokalde `public/index.php`'ye route eklendi
- Canlıya aynı satırı ELLE ekle (tüm dosyayı üzerine yazma!)
- Veya `git diff deploy-last -- public/index.php` ile farkı gör, sadece o satırı ekle

---

## HİÇBİR ZAMAN YÜKLENMEYEN DOSYALAR

| Dosya | Neden |
|-------|-------|
| `.env` | Canlıda ayrı .env var (şifreler farklı) |
| `frontend/src/` | Kaynak kod — build çıktısı yüklenir, kaynak değil |
| `frontend/node_modules/` | Sunucuda yok, gerekmez |
| `CLAUDE.md` | Geliştirme notu |
| `PROJE.md` | Geliştirme notu |
| `CANLI-DEPLOY.md` | Bu dosya — geliştirme notu |
| `deploy-check.sh` | Bu script — geliştirme aracı |

---

## HIZLI KOMUTLAR (Git Bash)

```bash
# Ne değişti göster:
bash deploy-check.sh

# Son deploy'dan bu yana değişen dosyaların detaylı farkı:
git diff deploy-last

# Sadece dosya isimleri:
git diff deploy-last --name-only

# Belirli bir dosyanın farkı:
git diff deploy-last -- public/index.php

# Deploy sonrası tag güncelle:
git tag -f deploy-last

# Deploy tag'inin tarihi:
git log -1 --format="%cd" --date=format:"%d.%m.%Y %H:%M" deploy-last
```

---

## SUNUCU BİLGİLERİ

- **Kullanıcı:** kdgfethi09
- **Repo yolu:** `/home/kdgfethi09/repositories/finans-kalesi/`
- **Web kökü:** `/home/kdgfethi09/public_html/`
- **Panel:** cPanel
- **Deploy yöntemi:** WinSCP (FTP/SFTP)
