# Hata Çözücü — Debug Skill'i
# Sen: "hata var", "çalışmıyor", "bozuldu", "hata çöz", ekran görüntüsü + "bu ne"

---

## NE YAPAR
Hata mesajı, ekran görüntüsü veya açıklamadan yola çıkarak sorunun kaynağını bulur ve çözer.

---

## ADIM 1 — HATA TÜRÜNÜ BELİRLE

| Belirti | Tür | İlk Bakılacak Yer |
|---------|-----|-------------------|
| Beyaz ekran, sayfa açılmıyor | React render hatası | Tarayıcı Console + ilgili JSX |
| "basarili: false" API yanıtı | Backend hatası | İlgili Controller + Model |
| 401 / 403 hatası | Auth sorunu | AuthMiddleware + JWT token |
| 404 hatası | Route bulunamadı | routes/*.php + public/index.php |
| 500 hatası | Sunucu hatası | PHP error_log + Controller |
| CORS hatası | Middleware sorunu | CorsMiddleware.php |
| Veri gelmiyor ama hata yok | API bağlantısı | api/*.js + axios config |
| Tasarım bozuk | CSS sorunu | paramgo.css + ilgili JSX class'lar |
| Modal açılmıyor | State sorunu | useState + onClick bağlantısı |
| Buton çalışmıyor | Event handler | onClick fonksiyonu + console |

---

## ADIM 2 — KAYNAĞI BUL

### Frontend Hatası İse:
1. İlgili sayfanın JSX dosyasını oku
2. Console hata mesajındaki satır numarasına bak
3. Import'ları kontrol et (eksik/yanlış import)
4. State değişkenlerini kontrol et
5. API çağrısının response'unu kontrol et

### Backend Hatası İse:
1. İlgili Controller dosyasını oku
2. Model dosyasındaki SQL sorgusunu kontrol et
3. Route tanımını kontrol et (endpoint doğru mu?)
4. `sirket_id` filtresi var mı?
5. `Response::basarili()` / `Response::hata()` formatı doğru mu?

### Auth Hatası İse:
1. `authStore.js` — token var mı?
2. `axios.js` — token header'a ekleniyor mu?
3. `AuthMiddleware.php` — token doğrulama çalışıyor mu?
4. Token süresi dolmuş mu? (access: 15dk, refresh: 7gün)

### Tasarım Hatası İse:
1. Doğru CSS class prefix kullanılmış mı? (`p-` mi?)
2. `paramgo.css`'te class tanımlı mı?
3. Inline style var mı? (CSS class'la çakışma)
4. `createPortal` ile modal `.p-app` dışına mı çıkıyor?

---

## ADIM 3 — ÇÖZÜM UYGULA

1. Sorunu bulduktan sonra ÖNCE kullanıcıya açıkla:
   - Ne bozuk
   - Neden bozuk
   - Nasıl düzelteceğin
2. Onay al
3. Düzelt
4. Test et (mümkünse)

---

## ÇIKTI FORMATI

```
🔍 HATA ANALİZİ
━━━━━━━━━━━━━━━

Sorun: [Kısa açıklama]
Tür:   [Frontend / Backend / Auth / Tasarım / Veri]
Dosya: [dosya yolu:satır numarası]

Neden:
  [Sade Türkçe ile açıklama — teknik jargon olmadan]

Çözüm:
  [Ne yapılacağı — adım adım]

Risk: [Yok / Düşük / Orta]
```

---

## EKRAN GÖRÜNTÜSÜ ANALİZİ
Kullanıcı ekran görüntüsü paylaşırsa:
1. Görüntüyü oku (Read tool ile)
2. Hata mesajını tespit et
3. Hangi sayfada olduğunu belirle (URL bar veya içerikten)
4. İlgili dosyaları tara
5. Yukarıdaki adımları uygula
