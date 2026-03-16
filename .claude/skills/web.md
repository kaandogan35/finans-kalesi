---
name: landing-page-premium
description: >
  Finans Kalesi ve KOBİ yazılımları için ileri seviye, production-ready landing page oluşturur.
  Bu skill'i şu durumlarda MUTLAKA kullan: "landing page", "ana sayfa", "tanıtım sayfası",
  "pazarlama sayfası", "satış sayfası", "index.html", "tasarımı geliştir", "sayfayı yeniden yaz"
  kelimelerinden biri geçtiğinde. Sade şablon değil — animasyonlu, mobil uyumlu, gerçek
  müşterilere satılabilecek kalitede çıktı üretir. Frontend-design skill'i ile birlikte kullan.
---

# Landing Page Premium Skill
## Finans Kalesi & KOBİ Yazılımları — İleri Seviye Tanıtım Sayfası

> **TEKNİK ÖZGÜRLÜK NOTU**
> Bu sayfa `public/index.html` dosyasıdır. React uygulamasından, backend'den ve JWT
> sisteminden **tamamen bağımsızdır.** Tailwind CSS, GSAP, Alpine.js veya başka herhangi
> bir kütüphane CDN üzerinden serbestçe kullanılabilir. Hiçbir proje kuralını ihlal etmez.
> **Ana kural tek:** Tasarım kalitesi her şeyin önünde.

---

## BAĞLAM

**Domain:** `kaandogan.com.tr` — ziyaretçinin gördüğü ilk sayfa.

**İki amaç:**
1. Kaan Doğan'ın freelance yazılım hizmetlerini tanıtmak (web, otomasyon, AI, SaaS)
2. Finans Kalesi SaaS ürününü KOBİ sahiplerine satmak → `/giris` sayfasına yönlendirmek

**Hedef kitle:** Hırdavat, demir-çelik, inşaat gibi sektörlerdeki KOBİ sahipleri.
Teknik bilgisi yok. Güven ister. Sadelik ister. Fayda odaklı dil şart.

**Çıktı:** `public/index.html` — tek dosya, tüm CSS ve JS dahil.

---

## TASARIM FELSEFESİ — ÖNCE DÜŞÜN

Bu skill çalışmadan önce `frontend-design` skill'ini oku ve şu soruları yanıtla:

- **Ton:** Luxury/refined mi? Editorial/magazine mi? Brutalist/raw mi? Bir şey seç, kararlı uygula.
- **Akılda kalan tek şey:** Bu sayfayı gören biri neyi hatırlayacak?
- **Font:** Playfair Display + Outfit başlangıç noktası — daha iyi bir çift varsa kullan.
  Generic fontlar (Inter, Roboto, Arial, system-ui) **kesinlikle yasak.**
- **Renk:** Siyah/beyaz/gri temel — eğer tasarımı güçlendiriyorsa aksan rengi eklenebilir.
- **Animasyon:** Sayfa yüklenişi güçlü olsun. Scroll efektleri sürpriz yaratmalı.

**UYARI:** Generic AI çıktısı (mor gradient, öngörülebilir layout, cookie-cutter kartlar)
kabul edilmez. Her tasarım kararının intentional bir nedeni olmalı.

---

## TEKNİK STACK

### İzin verilen (özgür seçim):
```
✅ Tailwind CSS (CDN: cdn.tailwindcss.com)
✅ GSAP + ScrollTrigger (CDN: cdnjs)
✅ Alpine.js (CDN)
✅ Vanilla JS + CSS @keyframes
✅ Google Fonts (herhangi bir font)
✅ Herhangi bir CDN kütüphanesi
```

### Yasak:
```
❌ React / Vue / Svelte (build tool gerektirir, bu dosya standalone)
❌ NPM paketi
❌ Harici görsel dosyası (SVG inline yaz, şekiller CSS ile)
❌ window.location veya localStorage
```

---

## 9 ZORUNLU BÖLÜM

### 1 — NAV (Yapışık Menü)
- Logo: "Kaan Doğan" + küçük "dev" süperskript
- Linkler: Hizmetler | Hakkında | Ürünler | Referanslar
- CTA: "Panele Giriş →" → `/giris`
- Scroll sonrası border/shadow belirginleşir
- **Mobil hamburger (768px altı):** `☰` açar, `✕` kapatır, tam ekran overlay

### 2 — HERO (Ana Karşılama)
**Sol içerik:**
- Güçlü H1 — en az bir kelime vurgulu/italic
- Alt metin (max 2 satır, fayda odaklı)
- Primary buton (dolgu) + Secondary buton (çizgi/outline)
- Animasyon: `fadeUp`, her eleman 0.1s stagger ile

**Sağ — İnteraktif Dashboard Kartı (ZORUNLU):**

1. **CountUp sayaç:**
```js
function countUp(el, target, duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = '₺' + (ease * target / 1e6).toFixed(1) + 'M';
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
```

2. **Animasyonlu bar grafiği** — 12 bar, CSS `growBar` keyframe:
```css
@keyframes growBar { to { height: var(--h); } }
```

3. **Canlı pulse noktası** (sürekli titreşen)
4. **3 metrik:** Vadesi gelen çek / Kasa bakiyesi / Limit uyarısı

### 3 — MARQUEE (Kayan Şerit)
Koyu zemin, sonsuz döngü:
`Web Sitesi / Yönetim Paneli / Otomasyon / Yapay Zeka / SaaS / Mobil / API / KOBİ`
Hover'da durur. İçerik 2x tekrar (kesintisiz döngü).

### 4 — STATS (4 Rakam)
`50+ Proje` | `6 Modül` | `3 Yıl` | `%100 Yerli`
Scroll animasyonu: aşağıdan gelir, 0.1s stagger.

### 5 — HİZMETLER (4 Kart)
`01 Web Sitesi` / `02 Yönetim Paneli` / `03 Otomasyon` / `04 Yapay Zeka`
Her kartta: numara, SVG ikon, başlık, açıklama, etiket.
Hover: sadece renk değil — güçlü transform/animasyon içermeli.

### 6 — REFERANSLAR ⭐ (3 Kart)
Her kart:
```
[Avatar dairesi — baş harfler]
"Alıntı — italic"
— İsim · Sektör
★★★★★
```

**CSS yıldız (emoji değil):**
```css
.stars::before { content: '★★★★★'; letter-spacing: 3px; }
```

**Clip-path reveal animasyonu (ZORUNLU):**
```css
.ref-card { clip-path: inset(0 100% 0 0); transition: clip-path .7s cubic-bezier(.22,1,.36,1); }
.ref-card.visible { clip-path: inset(0 0% 0 0); }
```
0.15s stagger ile 3 kart sırayla açılır.

**İçerik:**
- "Çeklerimizi artık hiç kaçırmıyoruz. Kasa takibi inanılmaz kolaylaştı." — Mehmet Y., Hırdavat
- "Kurulum hızlı, kullanımı basit. Başka bir şeye gerek duymadım." — Ali K., Demir-Çelik
- "Vade hesaplayıcı tek başına değer. Müşterilerime anında hesap yapabiliyorum." — Serkan T., İnşaat

### 7 — NEDEN BEN
Sol: Numaralı liste 01–04 (KOBİ odaklı / Tek muhatap / Destek / Güvenli)
Sağ: Sticky kart — alıntı + isim + teknoloji pilleri
Animasyon: liste öğeleri soldan kayarak gelir.

### 8 — ÜRÜN (Finans Kalesi CTA)
Geniş bölüm/kart:
- Başlık: "Finans Kalesi ile kasanızı kontrol altına alın"
- Modüller: ✓ Cari / ✓ Çek & Senet / ✓ Kasa / ✓ Ödemeler / ✓ Vade
- CTA butonu: "Paneli Deneyin →" → `/giris`

### 9 — FOOTER
`[Logo]` · `[Linkler]` · `[© 2026 Kaan Doğan]`
Koyu zemin.

---

## ANİMASYON SİSTEMİ

### Vanilla JS IntersectionObserver
```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('[data-anim]').forEach(el => io.observe(el));
```

### GSAP Varsa (Tercih Edilir)
```js
gsap.registerPlugin(ScrollTrigger);
gsap.from('.svc-card', {
  scrollTrigger: { trigger: '.svc-grid', start: 'top 80%' },
  y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
});
```

### Animasyon Türleri — Hepsi Kullanılmalı
| Efekt | Kullanıldığı yer |
|---|---|
| `fadeUp` — opacity + translateY | Stats, hizmet kartları, genel |
| `slideLeft` — opacity + translateX | Neden listesi |
| `clipReveal` — clip-path | Referans kartları |
| `scaleIn` — opacity + scale(0.95) | Ürün kartı / hero |

---

## RESPONSIVE

```
Desktop  1200px+  → Full layout
Tablet    768px   → 2 sütun grid, hamburger menü
Mobil     480px   → Tek sütun, küçük fontlar
```

---

## KALİTE LİSTESİ

Dosyayı kaydetmeden önce kontrol et:

- [ ] 9 bölümün tamamı var
- [ ] CountUp çalışıyor (₺0 → ₺2.4M)
- [ ] Bar grafiği animasyonu çalışıyor
- [ ] Clip-path reveal referans kartlarında aktif
- [ ] Hamburger menü 768px altında açılıp kapanıyor
- [ ] 3 breakpoint test edildi
- [ ] Generic font yok (Inter, Roboto, Arial yasak)
- [ ] `/giris` linki CTA'larda mevcut
- [ ] Tek dosya: `public/index.html`
- [ ] Tasarım intentional ve unforgettable — generic değil

---

## CLAUDE CODE PROMPT (Kopyala-Yapıştır)

```
Önce bu iki skill'i oku:
1. .claude/skills/landing-page-premium/SKILL.md
2. .claude/skills/frontend-design/SKILL.md

Görev: kaandogan.com.tr ana sayfası.
Çıktı: public/index.html (tek dosya, tüm CSS + JS dahil)

Teknik özgürlük tam: Tailwind CSS, GSAP ScrollTrigger, herhangi bir CDN
kütüphanesi kullanabilirsin. Bu sayfa React uygulamasından bağımsız.

Zorunlular (skill'den):
1. 9 bölümün tamamı
2. Hero'da countUp animasyonu (₺0 → ₺2.4M)
3. Referanslar bölümü + clip-path reveal
4. Mobil hamburger menü (768px)
5. GSAP ScrollTrigger scroll animasyonları (tercih)

Ekteki mevcut HTML dosyasını referans al — ama daha güçlü, daha
karakter sahibi, daha premium bir versiyon çıkar. Intentional, unforgettable.
Generic AI tasarımı kabul edilmez.
```
