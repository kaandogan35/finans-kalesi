# CLAUDE.md — Finans Kalesi SaaS Projesi
# Bu dosya Claude Code'un projeyi tanıması için otomatik okunur.
# Son Güncelleme: Güncel — Oturum #6

---

## PROJE SAHİBİ
Kaan Doğan — yazılım bilmeyen bir işletme sahibi. Kod yazmıyor, Claude yazıyor.
- Teknik terimleri sade Türkçe ile açıkla
- Asla "bu basit" veya "kolay" deme
- Her dosya değişikliğinde ne yaptığını kısaca açıkla

---

## PROJE: FİNANS KALESİ (SaaS)
KOBİ'lere satılacak abonelik tabanlı finans yazılımı.

### 4 Ana Modül — Hepsi ✅ TAMAMLANDI:
1. **Cari Hesap Hareketleri** — Borç/Alacak ✅
2. **Çek / Senet Modülü** — Portföy takibi, ciro, tahsilat ✅
3. **Ödeme ve Tahsilat Takip** — CRM radar mantığı ✅
4. **Varlık ve Kasa (Kozmik Oda)** — AES-256-GCM şifreli ✅

---

## TEKNOLOJİ VE ALTYAPI
- **Backend:** PHP 8.2 (saf PHP, REST API — framework yok)
- **Veritabanı:** MariaDB 10.5 (utf8mb4_general_ci)
- **Auth:** JWT token (saf PHP JWTHelper — access 15dk + refresh 7gün)
- **Şifreleme:** AES-256-GCM (PBKDF2 key derivation, V2: prefix formatı)
- **Mimari:** Multi-Tenant (her tabloda sirket_id, JWT içinde sirket_id)
- **Frontend (YENİ):** React + Vite. Tasarım altyapısı **BOOTSTRAP 5**'tir. Tailwind CSS ve Shadcn UI KESİNLİKLE YASAKTIR.

---

## ⚠️ KRİTİK KURALLAR — ASLA İHLAL ETME

### Frontend / UI Kuralları (React + Bootstrap 5)
- **React Modal Kuralı:** Bootstrap 5 tasarımlarını (CSS) kullan ancak modalları (Pop-up'ları) kontrol etmek için ASLA `bootstrap.bundle.min.js` veya `data-bs-toggle` kullanma. Modalların açılıp kapanmasını sadece **React State (`useState`)** ile kontrol et (Örn: `className={`modal fade ${showModal ? 'show d-block' : ''}`}`).
- **Premium UI:** Uygulamanın tasarımı `login.php` baz alınarak hazırlanmış `.premium-card` (derin gölgeli, geniş kavisli, tok borderlı) kartlar üzerinden yürür. Yazılar okunaklı, rakamlar (₺) belirgin (`fs-5 fw-bolder text-dark`) olmalıdır. Sıkışık tasarımlardan kaçınılır.

### PHP ve Güvenlik Kuralları
- PDO kullan (MySQLi değil)
- Prepared statements zorunlu (SQL injection koruması)
- **Her SQL sorgusunda WHERE sirket_id = ? olmalı** (multi-tenant izolasyon)
- .env dosyası asla paylaşılmaz
- Her API endpoint'inde JWT doğrulaması (public hariç: login, register, health)
- Kozmik Oda verileri sunucuda asla plaintext loglanmaz

### Sunucu Güvenlik Kuralları
- Sunucuya debug, test veya geçici PHP dosyası YÜKLEME
- Hata ayıklama gerekiyorsa error_log() kullan, ayrı dosya oluşturma
- FTP/SFTP şifresini terminal komutlarında açık yazma

### JSON Yanıt Formatı
```json
{"basarili": true, "veri": {...}}
{"basarili": false, "hata": "mesaj"}