/**
 * Button — Shadcn-uyumlu buton bileşeni
 * Varyantlar: default (indigo), outline, ghost, danger (rose)
 */

import { cn } from '../../lib/utils'

const varyantlar = {
  default:  'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-600',
  outline:  'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
  ghost:    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
  danger:   'bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-rose-600',
  success:  'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-600',
}

const boyutlar = {
  sm:  'h-8 px-3 text-xs rounded-lg',
  md:  'h-9 px-4 text-sm rounded-lg',
  lg:  'h-10 px-5 text-sm rounded-xl',
  xl:  'h-11 px-6 text-base rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        varyantlar[variant] || varyantlar.default,
        boyutlar[size] || boyutlar.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
