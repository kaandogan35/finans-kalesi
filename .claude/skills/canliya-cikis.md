# Canlıya Çıkış — Deploy Kontrol Skill'i
# Sen: "canlıya çıkacağım", "deploy kontrol", "yayına al"

---

## NE YAPAR
Son commit'ten bu yana nelerin değiştiğini tespit eder ve WinSCP'de hangi dosyaları yüklemen gerektiğini söyler.

---

## ADIMLAR

### 1. Değişen Dosyaları Bul
```bash
git diff deploy-last --name-only
```
`deploy-last` tag'i yoksa son commit'e bak:
```bash
git diff HEAD~1 --name-only
```

### 2. Dosyaları Grupla ve Raporla

Kullanıcıya aşağıdaki tabloyu göster:

| Dosya | WinSCP Hedefi |
|-------|--------------|
| `controllers/*.php` | `/home/goparam/repositories/finans-kalesi/controllers/` |
| `models/*.php` | `/home/goparam/repositories/finans-kalesi/models/` |
| `routes/*.php` | `/home/goparam/repositories/finans-kalesi/routes/` |
| `utils/*.php` | `/home/goparam/repositories/finans-kalesi/utils/` |
| `config/*.php` | `/home/goparam/repositories/finans-kalesi/config/` |
| `middleware/*.php` | `/home/goparam/repositories/finans-kalesi/middleware/` |
| `public/index.php` | **İKİ YERE:** `repositories/.../public/` + `public_html/` (index-canli.php → index.php) |
| `frontend/src/**` | `npm run build` yap → `public_html/frontend-build/` klasörüne yükle |

### 3. Frontend Değişikliği Varsa
```bash
cd frontend && npm run build
```
Çıktı: `public/frontend-build/` → WinSCP'de `public_html/frontend-build/` klasörüne yükle

### 4. Yasak Dosya Kontrolü
Şu dosyalar ASLA yüklenmez — uyarı ver:
- `.env`
- `node_modules/`
- `vendor/`
- `.git/`
- `.claude/`
- `CLAUDE.md`, `PROJE.md`
- `package.json`, `package-lock.json`
- `composer.json`, `composer.lock`
- `vite.config.js`

### 5. Deploy Sonrası
```bash
git tag -f deploy-last
```

---

## ÇIKTI FORMATI

```
📦 DEPLOY RAPORU
━━━━━━━━━━━━━━━

Backend (X dosya):
  ✅ controllers/YeniController.php → repositories/.../controllers/
  ✅ models/YeniModel.php → repositories/.../models/

Frontend (değişiklik var/yok):
  ✅ npm run build gerekli → frontend-build/ yükle
  veya
  ⬜ Frontend değişikliği yok

⚠️ DİKKAT:
  - public/index.php değiştiyse İKİ YERE yükle
  - .env dosyasını yükleme

Komut: git tag -f deploy-last
```
