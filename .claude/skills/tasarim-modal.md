# Tasarım Skill — Modal Sistemi
# Referans: Dashboard.jsx, CarilerListesi.jsx, CariYonetimi.jsx
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## MODAL YAPISI (Zorunlu Şablon)

```jsx
{open && (
  <>
    <div className={`${p}-modal-overlay`} />
    <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
      <div className={`${p}-modal-box`} style={{ maxWidth: 480 }}>

        {/* BAŞLIK */}
        <div className={`${p}-modal-header ${p}-mh-default`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`${p}-modal-icon ${p}-modal-icon-default`}>
              <i className="bi bi-plus-circle-fill" />
            </div>
            <div>
              <h2 className={`${p}-modal-title`}>Modal Başlığı</h2>
              <p className={`${p}-modal-sub`}>Alt açıklama</p>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* BODY */}
        <div className={`${p}-modal-body`}>
          {/* form alanları buraya */}
        </div>

        {/* FOOTER */}
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`} onClick={onClose}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-default`} disabled={yukleniyor}>
            {yukleniyor ? <><i className="bi bi-hourglass-split me-2" />Kaydediliyor...</> : 'Kaydet'}
          </button>
        </div>

      </div>
    </div>
  </>
)}
```

---

## ESC KAPANMA (Her Modalde Zorunlu)

```jsx
useEffect(() => {
  if (!open) return
  const h = (e) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('keydown', h)
  return () => document.removeEventListener('keydown', h)
}, [open, onClose])
```

---

## BAŞLIK RENK VARYANTları

### mh-default — Ekle / Düzenle / Görüntüle
```jsx
<div className={`${p}-modal-header ${p}-mh-default`}>
  // Beyaz arka plan, koyu metin, border-bottom
```

### mh-danger — Sil / Pasife Al / Tehlike
```jsx
<div className={`${p}-modal-header ${p}-mh-danger`}>
  // Kırmızı gradient, beyaz metin
```

### mh-success — Onayla / Başarı
```jsx
<div className={`${p}-modal-header ${p}-mh-success`}>
  // Yeşil gradient, beyaz metin
```

---

## İKON KUTUSU VARYANTları

```jsx
<div className={`${p}-modal-icon ${p}-modal-icon-default`}>  // Yeşil
<div className={`${p}-modal-icon ${p}-modal-icon-red`}>      // Kırmızı
<div className={`${p}-modal-icon ${p}-modal-icon-warning`}>  // Turuncu
<div className={`${p}-modal-icon ${p}-modal-icon-green`}>    // Yeşil (alias)
```

---

## BOYUT KURALLARI

| Kullanım | maxWidth |
|---------|---------|
| Onay / Silme modalı | 420px |
| Form modalı (az alan) | 480px |
| Form modalı (çok alan) | 560px |
| Geniş içerik / tablo | 720px |

---

## MOBİL (≤767px) — Bottom Sheet

```css
/* paramgo.css'te tanımlı — ekstra şey yazma */
/* Modal otomatik bottom-sheet'e dönüşür */
/* border-radius: 16px 16px 0 0; max-height: 85vh */
```

---

## ÖRNEK: SİLME ONAY MODALI
```jsx
function SilmeOnayModal({ item, onOnayla, onIptal, yukleniyor, p }) {
  useEffect(() => {
    if (!item) return
    const h = (e) => { if (e.key === 'Escape') onIptal() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [item, onIptal])

  if (!item) return null
  return (
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
          <div className={`${p}-modal-header ${p}-mh-danger`}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div className={`${p}-modal-icon ${p}-modal-icon-red`}>
                <i className="bi bi-trash3-fill" />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>Kaydı Sil</h2>
                <p className={`${p}-modal-sub`}>Bu işlem geri alınamaz</p>
              </div>
            </div>
            <button className={`${p}-modal-close`} onClick={onIptal}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className={`${p}-modal-body`}>
            <p style={{ color: 'var(--p-text)', fontSize: 14 }}>
              <strong>{item.ad}</strong> kalıcı olarak silinecek.
            </p>
          </div>
          <div className={`${p}-modal-footer`}>
            <button className={`${p}-btn-cancel`} onClick={onIptal} disabled={yukleniyor}>İptal</button>
            <button className={`${p}-btn-save ${p}-btn-save-red`} onClick={onOnayla} disabled={yukleniyor}>
              {yukleniyor
                ? <><i className="bi bi-hourglass-split me-2" />Siliniyor...</>
                : <><i className="bi bi-trash3 me-2" />Evet, Sil</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```
