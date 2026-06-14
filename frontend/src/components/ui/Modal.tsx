import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
}

export function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-6xl',
    full: 'max-w-[calc(100vw-2rem)] sm:max-w-[95vw]',
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className={`bg-card rounded-lg shadow-xl w-full mx-4 sm:mx-0 border border-app-border flex flex-col max-h-[calc(100vh-2rem)] ${sizeClasses[size]}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-fg text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col">{children}</div>
      </div>
    </div>,
    document.body
  )
}
