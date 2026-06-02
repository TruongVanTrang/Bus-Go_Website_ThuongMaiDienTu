import React from 'react'
import { motion } from 'framer-motion'

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  isLoading = false,
  children,
  disabled,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none'

  const variants = {
    default: 'bg-[#004b87] text-white hover:bg-[#003f73] shadow-md shadow-[#004b87]/10 active:scale-95',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900',
    outline: 'border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100',
    destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/10 active:bg-red-700',
    ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-600',
    link: 'text-blue-600 underline-offset-4 hover:underline bg-transparent hover:bg-transparent p-0'
  }

  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs rounded-lg',
    lg: 'h-12 px-6 text-base rounded-2xl',
    icon: 'h-10 w-10 p-0 rounded-xl'
  }

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || isLoading}
      className={classes}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}

export default Button
