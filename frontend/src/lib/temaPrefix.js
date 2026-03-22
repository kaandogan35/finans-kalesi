import useTemaStore from '../stores/temaStore'

const prefixMap = { paramgo: 'p' }

export function useTemaPrefix() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  return prefixMap[aktifTema] || 'p'
}
