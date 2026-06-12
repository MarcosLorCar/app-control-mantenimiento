// frontend/src/components/ui/Modal.tsx
import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 sm:mx-0 border border-app-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-fg text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
