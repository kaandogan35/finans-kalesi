# KİMLİK: Yeni Modül Mimarı
Finans Kalesi'ne yeni bir finans modülü eklerken izlenecek tam protokol.
Bu skill, Vade Hesaplayıcı ve sonrasındaki tüm modüller için geçerlidir.

---

## ZORUNLU OKUMA
Bu skill'i okumadan önce şunları kontrol et:
- `php-api-gelistirici.md` okundu mu? (Backend adımları için)
- `react-bootstrap-ui.md` okundu mu? (Frontend adımları için)

---

## YENİ MODÜL EKLEME PROTOKOLÜ (Sırayla — Adım Atlamak Yasak)

### AŞAMA 1: Veritabanı Tasarımı
```sql
-- Her yeni tabloda şu sütunlar zorunlu:
CREATE TABLE yeni_modul (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sirket_id INT NOT NULL,          -- Multi-tenant zorunlu
    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi DATETIME ON UPDATE CURRENT_TIMESTAMP,
    -- modüle özel sütunlar buraya
    INDEX idx_sirket (sirket_id)     -- Performans için index zorunlu
);
```
⚠️ `sirket_id` olmayan tablo oluşturulamaz.

### AŞAMA 2: Model (PHP)
Dosya: `models/YeniModul.php`
- Tüm sorgularda `WHERE sirket_id = :sirket_id` zorunlu
- Controller'da ham SQL olmaz — SQL sadece Model'de yaşar
- `php-api-gelistirici.md` kuralları uygulanır

### AŞAMA 3: Controller (PHP)
Dosya: `controllers/YeniModulController.php`
- Constructor'da PDO bağlantısı alınır
- Her metod başında JWT'den `sirket_id` çekilir
- Yanıtlar `Response::basarili()` veya `Response::hata()` ile döner

### AŞAMA 4: Route (PHP)
Dosya: `routes/yeni_modul.php`
- AuthMiddleware her endpoint'ten önce çalışır
- Endpoint isimleri Türkçe karaktersiz, küçük harf, tire ile ayrılır
  Örn: `/api/vade-hesaplayici`, `/api/cek-senet`

### AŞAMA 5: Route Kaydı
`public/index.php` veya ana router dosyasına yeni route eklenir:
```php
require_once '../routes/yeni_modul.php';
```

### AŞAMA 6: Frontend API Dosyası
Dosya: `frontend/src/api/yeniModul.js`
```js
import api from './axios'
export const yeniModulApi = {
  listele: () => api.get('/yeni-modul'),
  ekle: (data) => api.post('/yeni-modul', data),
  guncelle: (id, data) => api.put(`/yeni-modul/${id}`, data),
  sil: (id) => api.delete(`/yeni-modul/${id}`)
}
```

### AŞAMA 7: Sayfa Bileşeni (React)
Dosya: `frontend/src/pages/yeni-modul/YeniModul.jsx`
- `react-bootstrap-ui.md` kuralları uygulanır
- Capacitor uyumluluk kuralları uygulanır
- Mock veri KULLANILMAZ — direkt API'den çekilir

### AŞAMA 8: Route Kaydı (React)
`App.jsx` içine yeni route eklenir:
```jsx
<Route path="/yeni-modul" element={<KorunanSayfa><YeniModul /></KorunanSayfa>} />
```

### AŞAMA 9: Sidebar Linki
`AppLayout.jsx` içindeki navigasyon listesine yeni modül eklenir.

---

## VADE HESAPLAYICI'YA ÖZEL NOTLAR
- Bağımsız sayfa — Çek/Senet veya Ödemeler modülüne bağlı değil
- Veritabanı sütunları henüz yok — AŞAMA 1'den başlanacak
- Hesaplama mantığı tamamen frontend'de yapılabilir (basit vade hesabı)
  veya backend'e taşınabilir (kayıt tutulacaksa backend)
- Sprint 2C tamamen bitmeden bu modüle başlanmaz

---

## KONTROL LİSTESİ (Modül Bitmeden İşaretlenecek)
```
[ ] Veritabanı tablosu oluşturuldu (sirket_id var mı?)
[ ] Model yazıldı (tüm sorgularda sirket_id filtresi var mı?)
[ ] Controller yazıldı (JWT'den sirket_id alınıyor mu?)
[ ] Route yazıldı (AuthMiddleware var mı?)
[ ] Route ana router'a kaydedildi
[ ] Frontend API dosyası oluşturuldu
[ ] Sayfa bileşeni yazıldı (mock veri yok, API bağlı)
[ ] App.jsx'e route eklendi
[ ] AppLayout sidebar'a link eklendi
[ ] Capacitor uyumluluk kuralları uygulandı mı?
```

---

## TEST SORUSU
"Vade Hesaplayıcı modülü ekleyeceğim" desem ilk 3 adımın ne olur?
