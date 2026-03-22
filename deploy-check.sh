#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# deploy-check.sh — Finans Kalesi Deploy Kontrol Scripti
# Kullanım: Git Bash'te → bash deploy-check.sh
# ═══════════════════════════════════════════════════════════════

SUNUCU_REPO="/home/goparam/repositories/finans-kalesi"
SUNUCU_WEB="/home/goparam/public_html"
TAG="deploy-last"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         FİNANS KALESİ — DEPLOY KONTROL LİSTESİ         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Tag var mı kontrol et
if ! git tag -l "$TAG" | grep -q "$TAG"; then
  echo "⛔  '$TAG' tag'i bulunamadı."
  echo "    Önce ilk tag'i oluştur:"
  echo "    git tag deploy-last <commit-hash>"
  exit 1
fi

LAST_TAG_COMMIT=$(git rev-list -n 1 $TAG)
LAST_TAG_DATE=$(git log -1 --format="%cd" --date=format:"%d.%m.%Y %H:%M" $TAG)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

echo "  Son deploy  : $LAST_TAG_DATE (commit: ${LAST_TAG_COMMIT:0:7})"
echo "  Şu anki hal : $CURRENT_COMMIT"
echo ""

# Commit'lenmemiş değişiklikler var mı?
UNCOMMITTED=$(git status --porcelain | grep -v "^??" | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "⚠️  DİKKAT: $UNCOMMITTED commit'lenmemiş değişiklik var!"
  echo "   Önce 'git add + git commit' yap, sonra bu scripti tekrar çalıştır."
  echo ""
fi

# Değişen dosyaları al (untracked dahil değil, sadece commit'lenmiş fark)
CHANGED=$(git diff $TAG..HEAD --name-only 2>/dev/null)

if [ -z "$CHANGED" ]; then
  echo "✅  Deploy-last'ten bu yana commit'lenmiş değişiklik yok."
  echo "    (Commit'lenmemiş değişiklikler yukarıda uyarıldı.)"
  echo ""
  exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Kategoriler
PHP_FILES=()
BUILD_FILES=()
PUBLIC_FILES=()
ATLA_FILES=()
DIKKAT_FILES=()
DIGER=()

while IFS= read -r file; do
  # Atlanacaklar
  if [[ "$file" == ".env" ]] || \
     [[ "$file" == "node_modules/"* ]] || \
     [[ "$file" == "frontend/src/"* ]] || \
     [[ "$file" == "frontend/package"* ]] || \
     [[ "$file" == "frontend/vite.config"* ]] || \
     [[ "$file" == ".gitignore" ]] || \
     [[ "$file" == "deploy-check.sh" ]] || \
     [[ "$file" == "CANLI-DEPLOY.md" ]] || \
     [[ "$file" == "PROJE.md" ]] || \
     [[ "$file" == "CLAUDE.md" ]]; then
    ATLA_FILES+=("$file")

  # Özel dikkat: public/index.php (canlıda BASE_PATH farklı!)
  elif [[ "$file" == "public/index.php" ]]; then
    DIKKAT_FILES+=("$file")

  # Backend PHP
  elif [[ "$file" == "config/"* ]] || \
       [[ "$file" == "controllers/"* ]] || \
       [[ "$file" == "middleware/"* ]] || \
       [[ "$file" == "models/"* ]] || \
       [[ "$file" == "routes/"* ]] || \
       [[ "$file" == "utils/"* ]]; then
    PHP_FILES+=("$file")

  # Frontend build output
  elif [[ "$file" == "public/frontend-build/"* ]]; then
    BUILD_FILES+=("$file")

  # Diğer public dosyaları
  elif [[ "$file" == "public/"* ]]; then
    PUBLIC_FILES+=("$file")

  else
    DIGER+=("$file")
  fi
done <<< "$CHANGED"

# ─── BACKEND PHP ──────────────────────────────────────────────
if [ ${#PHP_FILES[@]} -gt 0 ]; then
  echo "🔧 BACKEND PHP  →  $SUNUCU_REPO/"
  echo ""
  for f in "${PHP_FILES[@]}"; do
    status=$(git diff --name-status $TAG..HEAD -- "$f" | awk '{print $1}')
    case $status in
      A) prefix="  [YENİ  ]" ;;
      D) prefix="  [SİLİNDİ]" ;;
      *) prefix="  [DEĞİŞTİ]" ;;
    esac
    echo "$prefix $f"
    # Sunucu path'ini göster
    dir=$(dirname "$f")
    echo "           → $SUNUCU_REPO/$f"
  done
  echo ""
fi

# ─── FRONTEND BUILD ───────────────────────────────────────────
if [ ${#BUILD_FILES[@]} -gt 0 ]; then
  echo "🌐 FRONTEND BUILD  →  $SUNUCU_WEB/frontend-build/"
  echo "   (public/frontend-build/ klasörünün TAMAMINI yükle)"
  echo ""
  # Kaç dosya değişmiş göster ama klasörün tamamını yüklemek gerekir
  echo "   Değişen build dosyaları: ${#BUILD_FILES[@]} adet"
  for f in "${BUILD_FILES[@]}"; do
    echo "     • $f"
  done
  echo ""
  echo "   📌 WinSCP'de yüklenecek:"
  echo "      LOCAL:  $(pwd)/public/frontend-build/"
  echo "      SUNUCU: $SUNUCU_WEB/frontend-build/"
  echo ""
fi

# ─── DİĞER PUBLIC DOSYALARI ───────────────────────────────────
if [ ${#PUBLIC_FILES[@]} -gt 0 ]; then
  echo "📄 PUBLIC DOSYALAR  →  $SUNUCU_WEB/"
  echo ""
  for f in "${PUBLIC_FILES[@]}"; do
    filename=$(basename "$f")
    echo "   [DEĞİŞTİ] $f"
    echo "           → $SUNUCU_WEB/$filename"
  done
  echo ""
fi

# ─── ÖZEL DİKKAT ──────────────────────────────────────────────
if [ ${#DIKKAT_FILES[@]} -gt 0 ]; then
  echo "⚠️  ÖZEL DİKKAT — ELLE KONTROL GEREKEN:"
  echo ""
  echo "   public/index.php DEĞİŞTİ"
  echo "   Canlıdaki index.php farklı BASE_PATH kullanıyor!"
  echo "   Yüklemeden önce farkı kontrol et:"
  echo "   git diff $TAG..HEAD -- public/index.php"
  echo ""
  echo "   Eğer sadece route eklendi → canlıdaki index.php'ye aynı route'u elle ekle."
  echo ""
fi

# ─── DİĞER ────────────────────────────────────────────────────
if [ ${#DIGER[@]} -gt 0 ]; then
  echo "📁 DİĞER DEĞİŞEN DOSYALAR (değerlendirmeni gerektirir):"
  echo ""
  for f in "${DIGER[@]}"; do
    echo "   • $f"
  done
  echo ""
fi

# ─── ATLANANLAR ───────────────────────────────────────────────
if [ ${#ATLA_FILES[@]} -gt 0 ]; then
  echo "⏭️  YÜKLEME → bu dosyalar atlandı (gerek yok):"
  for f in "${ATLA_FILES[@]}"; do
    echo "   • $f"
  done
  echo ""
fi

# ─── ÖZET ─────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((${#PHP_FILES[@]} + ${#BUILD_FILES[@]} + ${#PUBLIC_FILES[@]} + ${#DIKKAT_FILES[@]} + ${#DIGER[@]}))
echo ""
echo "  Yüklenecek dosya/grup : $TOTAL"
echo ""
echo "  Deploy bitti mi? Tagi güncelle:"
echo "  git tag -f deploy-last"
echo ""
