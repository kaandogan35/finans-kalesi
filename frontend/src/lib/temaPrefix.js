import useTemaStore from '../stores/temaStore'

const prefixMap = { banking: 'b', earthy: 'e', dark: 'd' }

export function useTemaPrefix() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  return prefixMap[aktifTema] || 'b'
}
