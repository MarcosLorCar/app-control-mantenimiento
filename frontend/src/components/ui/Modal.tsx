import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const modalId = useRef(`modal-${Math.random().toString(36).substring(2, 9)}`)

  useEffect(() => {
    // Push temporary state to history for this modal instance
    window.history.pushState({ modalId: modalId.current }, '')

    const handlePopState = () => {
      // Close the modal if the state changes away from this modal's ID
      if (window.history.state?.modalId !== modalId.current) {
        onClose()
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Clean up history state if modal was closed manually
      if (window.history.state?.modalId === modalId.current) {
        window.history.back()
      }
    }
  }, [onClose])

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
