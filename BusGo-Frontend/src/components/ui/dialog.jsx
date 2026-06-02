import React, { createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const DialogContext = createContext(null)

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogContent({ className = '', children, ...props }) {
  const { open, onOpenChange } = useContext(DialogContext)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          {/* Modal Container */}
          <div className="relative z-50 w-full max-w-lg p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`relative w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl ${className}`}
              {...props}
            >
              {children}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function DialogHeader({ className = '', ...props }) {
  return <div className={`flex flex-col space-y-1.5 text-left ${className}`} {...props} />
}

export function DialogFooter({ className = '', ...props }) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 ${className}`} {...props} />
}

export function DialogTitle({ className = '', ...props }) {
  return <h2 className={`text-lg font-bold text-slate-900 ${className}`} {...props} />
}

export function DialogDescription({ className = '', ...props }) {
  return <p className={`text-sm text-slate-500 font-semibold ${className}`} {...props} />
}

export default Dialog
