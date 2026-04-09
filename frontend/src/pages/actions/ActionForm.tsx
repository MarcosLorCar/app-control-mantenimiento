// frontend/src/pages/actions/ActionForm.tsx
// Stub — se implementa en Task 6
import { Modal } from '../../components/ui/Modal'

interface Props {
  infrastructureId: number
  onClose: () => void
}

export function ActionForm({ onClose }: Props) {
  return (
    <Modal title="Registrar acción" onClose={onClose}>
      <p className="text-sm text-gray-500">Formulario de acción (próximamente)</p>
    </Modal>
  )
}
