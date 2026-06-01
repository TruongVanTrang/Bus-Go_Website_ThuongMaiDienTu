import React from 'react'

export function Badge({ className = '', variant = 'default', ...props }) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  const variants = {
    default: 'border-transparent bg-slate-900 text-white hover:bg-slate-900/80',
    secondary: 'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-100/80',
    destructive: 'border-transparent bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200',
    outline: 'text-slate-950 border-slate-200',
    success: 'border-transparent bg-green-50 text-green-700 hover:bg-green-50/80 border-green-200',
    warning: 'border-transparent bg-amber-50 text-amber-700 hover:bg-amber-50/80 border-amber-200',
    info: 'border-transparent bg-blue-50 text-blue-700 hover:bg-blue-50/80 border-blue-200',
  }

  const classes = `${baseStyles} ${variants[variant] || variants.default} ${className}`

  return <div className={classes} {...props} />
}

export default Badge
