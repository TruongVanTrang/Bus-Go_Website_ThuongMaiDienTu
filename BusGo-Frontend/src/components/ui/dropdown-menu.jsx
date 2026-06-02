import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {React.Children.map(children, (child) => {
        if (!child) return null
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, { open, setOpen })
        }
        if (child.type === DropdownMenuContent) {
          return <AnimatePresence>{open && React.cloneElement(child, { setOpen })}</AnimatePresence>
        }
        return child
      })}
    </div>
  )
}

export function DropdownMenuTrigger({ children, open, setOpen }) {
  return React.cloneElement(children, {
    onClick: (e) => {
      e.stopPropagation()
      setOpen(!open)
    }
  })
}

export function DropdownMenuContent({ children, setOpen, align = 'right', className = '', ...props }) {
  const alignClasses = align === 'right' ? 'right-0' : 'left-0'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`absolute ${alignClasses} z-50 mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 text-slate-900 shadow-xl focus:outline-none ${className}`}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null
        return React.cloneElement(child, {
          onClick: (e) => {
            if (child.props.onClick) child.props.onClick(e)
            setOpen(false)
          }
        })
      })}
    </motion.div>
  )
}

export function DropdownMenuItem({ className = '', children, ...props }) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors bg-transparent border-none text-left cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default DropdownMenu
