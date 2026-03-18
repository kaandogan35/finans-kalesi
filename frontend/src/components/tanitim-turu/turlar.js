/**
 * Tanıtım Turu Adım Tanımları
 * hedef: querySelector ile sayfadaki data-tur attribute'u hedefler.
 * Tüm hedefler her zaman DOM'da olan elemanlara işaret eder.
 */

export const TUR_ADIMLAR = {
  hosgeldin: [
    {
      hedef: '[data-tur="sol-menu"]',
      baslik: 'Modüller',
      aciklama: 'Sol menüden tüm modüllere ulaşırsınız: Cari Hesaplar, Çek/Senet, Ödeme Takip, Kasa ve daha fazlası.',
    },
    {
      hedef: '[data-tur="kpi-kartlar"]',
      baslik: 'Genel Bakış',
      aciklama: 'Toplam alacak, borç, kasa bakiyesi ve çek portföyünüzü bu kartlardan anlık takip edersiniz.',
    },
    {
      hedef: '[data-tur="grafik-alan"]',
      baslik: 'Analiz Paneli',
      aciklama: 'Nakit akışı, bekleyen çekler ve yaklaşan vadeleri detaylı izleyin. Risk uyarıları burada gösterilir.',
    },
    {
      hedef: '[data-tur="hizli-islem"]',
      baslik: 'Hızlı İşlem',
      aciklama: 'Sağ üstteki + butonuna tıklayarak çek girişi, kasa hareketi veya yeni cari oluşturabilirsiniz.',
    },
  ],

  dashboard: [
    {
      hedef: '[data-tur="kpi-kartlar"]',
      baslik: 'KPI Kartları',
      aciklama: 'Alacak, borç, kasa ve çek verilerini anlık takip edin. Her karta tıklayarak ilgili modüle geçebilirsiniz.',
    },
    {
      hedef: '[data-tur="grafik-alan"]',
      baslik: 'Analiz Alanı',
      aciklama: 'Nakit akışı, alacak/borç oranı ve yaklaşan vadeler bu panelde gösterilir.',
    },
    {
      hedef: '[data-tur="hizli-islem"]',
      baslik: 'Hızlı İşlem Butonu',
      aciklama: '+ butonuna tıklayarak kolayca işlem oluşturun. Sizi ilgili modüle yönlendirir.',
    },
  ],

  cariler: [
    {
      hedef: '[data-tur="yeni-cari-btn"]',
      baslik: 'Yeni Cari Ekle',
      aciklama: 'Bu butona tıklayarak müşteri veya tedarikçi kaydı oluşturun. Bilgiler şifreli olarak güvenle saklanır.',
    },
    {
      hedef: '[data-tur="cari-arama"]',
      baslik: 'Arama & Filtrele',
      aciklama: 'Cari adı, vergi numarası veya telefon ile arama yaparak kayıtlara anında ulaşın.',
    },
    {
      hedef: '[data-tur="cari-listesi"]',
      baslik: 'Cari Listesi',
      aciklama: 'Tüm müşteri ve tedarikçileriniz burada listelenir. Alacak ve borç bakiyelerini kolon kolon görürsünüz.',
    },
  ],

  'cek-senet': [
    {
      hedef: '[data-tur="cek-tablar"]',
      baslik: 'Çek & Senet Sekmeleri',
      aciklama: 'Portföydeki, tahsildeki ve kendi çeklerinizi ayrı sekmelerde yönetin. Her sekme bağımsız filtrelenir.',
    },
    {
      hedef: '[data-tur="portfoy-tab"]',
      baslik: 'Portföydeki Evraklar',
      aciklama: 'Bu sekmeye tıklayın — müşterilerden aldığınız çek ve senetleri görür, tahsile gönderebilirsiniz.',
    },
    {
      hedef: '[data-tur="cek-stats"]',
      baslik: 'Anlık Portföy Özeti',
      aciklama: 'Portföy, tahsilde ve net durum tutarları burada gösterilir. Herhangi bir sekmedeyken güncel kalır.',
    },
  ],

  kasa: [
    {
      hedef: '[data-tur="kasa-panel"]',
      baslik: 'Kasa Modülü',
      aciklama: 'Nakit akışı, aylık bilanço, ortak carisi ve yatırım takibini bu sekmelerden yönetin.',
    },
    {
      hedef: '[data-tur="kasa-sekme-nakit"]',
      baslik: 'Nakit Akışı',
      aciklama: 'Bu sekmeye tıklayın — aylık gelir/gider hareketlerinizi tarih aralığına göre kayıt altına alın.',
    },
    {
      hedef: '[data-tur="kasa-sekme-bilanco"]',
      baslik: 'Aylık Bilanço',
      aciklama: 'Her ayın kapanış tutarını kaydedin. Geçmiş aylara ait net durumu karşılaştırmalı görebilirsiniz.',
    },
  ],

  odemeler: [
    {
      hedef: '[data-tur="odeme-ekle-btn"]',
      baslik: 'Yeni Ödeme Ekle',
      aciklama: '"Yeni Ekle" butonu ile tahsilat takibi başlatın: firma adı, tutar, vade tarihi ve öncelik girin.',
    },
    {
      hedef: '[data-tur="filtreler"]',
      baslik: 'Filtreler & Hızlı Sekmeler',
      aciklama: '"Bu Hafta", "Gecikmiş" gibi hızlı sekmeler ile ya da tarih ve öncelik filtresiyle arama yapın.',
    },
    {
      hedef: '[data-tur="odeme-listesi"]',
      baslik: 'KPI Özet Kartları',
      aciklama: 'Bu hafta vadeli, bekleyen tahsilat ve gecikmiş alacak sayılarını anlık görmek için bu kartları izleyin.',
    },
  ],
}

// Rota → tur adı eşleştirmesi
export const ROTA_TUR = {
  '/dashboard': 'dashboard',
  '/cariler':   'cariler',
  '/cek-senet': 'cek-senet',
  '/kasa':      'kasa',
  '/odemeler':  'odemeler',
}
