/**
 * utils — Shadcn-uyumlu yardımcı fonksiyonlar
 * cn(): Tailwind class birleştirici (clsx + tailwind-merge alternatifi)
 */

/**
 * Basit class birleştirici — falsy değerleri filtreler, boşluk normalize eder.
 * Tam anlamıyla tailwind-merge gerekiyorsa: npm i tailwind-merge clsx
 */
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim()
}
