import { useState, useEffect, Fragment } from 'react'
import { Modal } from '../ui/Modal'
import { useLocation } from '../../hooks/useLocations'
import {
  useMaterialTypes,
  useCreateMaterialType,
  useUpdateMaterialType,
  useFixedProperties,
} from '../../hooks/useCatalog'
import { Plus, Trash, Pencil, Folder, Package, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import type { Material, Location } from '../../api/types'

export interface MaterialChange {
  tempId: string
  materialId?: number
  name: string
  typeId: number
  description: string | null
  attributes: Record<string, any>
  locationId: number | null
  operation: 'INSTALL' | 'UNINSTALL' | 'UPDATE'
  type: {
    id: number
    code: string
    name: string
    icon: string | null
    customAttributes?: any
  }
}

interface Props {
  rootLocationId: number
  allLocations: Location[]
  initialChanges: MaterialChange[]
  onClose: () => void
  onConfirm: (changes: MaterialChange[]) => void
}

export function RecursiveMaterialModal({ rootLocationId, allLocations, initialChanges, onClose, onConfirm }: Props) {
  const [changes, setChanges] = useState<MaterialChange[]>(() => [...initialChanges])
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({ [rootLocationId]: true })

  // Dialog sub-modal states for staging an Add or Edit operation
  const [showDialog, setShowDialog] = useState(false)
  const [dialogTargetFolderId, setDialogTargetFolderId] = useState<number | null>(null)
  const [dialogEditingChangeId, setDialogEditingChangeId] = useState<string | null>(null)

  // Sub-modal fields
  const [dialogName, setDialogName] = useState('')
  const [dialogTypeId, setDialogTypeId] = useState<number>(0)
  const [dialogDescription, setDialogDescription] = useState('')
  const [dialogAttributes, setDialogAttributes] = useState<Record<string, any>>({})
  const [dialogError, setDialogError] = useState('')

  // Inline "nuevo tipo de material" fields
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')

  // Inline custom attributes states
  const [customAttrs, setCustomAttrs] = useState<{ code: string; name: string; type: string }[]>([])
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrType, setNewAttrType] = useState<'STRING' | 'NUMBER'>('STRING')

  // Queries
  const { data: rootDetail, isLoading: loadingRoot } = useLocation(rootLocationId)
  const rootLoc = allLocations.find(l => l.id === rootLocationId)
  const categoryId = rootLoc?.infraTypeId ?? null

  const { data: materialTypes = [] } = useMaterialTypes(categoryId)
  const { data: allSystemTypes = [] } = useMaterialTypes()
  const { data: fixedProperties = [] } = useFixedProperties()
  const createMaterialTypeMut = useCreateMaterialType()
  const updateMaterialTypeMut = useUpdateMaterialType()

  const [localCreatedTypes, setLocalCreatedTypes] = useState<any[]>([])
  const allMaterialTypes = [...materialTypes, ...localCreatedTypes].filter(
    (t, idx, arr) => arr.findIndex(item => item.id === t.id) === idx
  )

  const isLoading = loadingRoot
  const isPending = createMaterialTypeMut.isPending || updateMaterialTypeMut.isPending
  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  // Update custom attributes when dialogTypeId or showNewTypeInput changes
  useEffect(() => {
    if (showNewTypeInput) {
      setCustomAttrs([])
    } else if (dialogTypeId) {
      const selectedType = allMaterialTypes.find(t => t.id === dialogTypeId)
      if (selectedType && selectedType.customAttributes) {
        try {
          const attrs = typeof selectedType.customAttributes === 'string'
            ? JSON.parse(selectedType.customAttributes)
            : selectedType.customAttributes
          setCustomAttrs(Array.isArray(attrs) ? attrs : [])
        } catch {
          setCustomAttrs([])
        }
      } else {
        setCustomAttrs([])
      }
    } else {
      setCustomAttrs([])
    }
  }, [dialogTypeId, showNewTypeInput])

  // Toggle node expansion
  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // --- DIALOG ACTIONS ---

  function openAdd(folderId: number) {
    setDialogTargetFolderId(folderId)
    setDialogEditingChangeId(null)
    setDialogName('')
    setDialogTypeId(0)
    setDialogDescription('')
    setDialogAttributes({})
    setShowNewTypeInput(false)
    setNewTypeName('')
    setCustomAttrs([])
    setNewAttrName('')
    setDialogError('')
    setShowDialog(true)
  }

  function openEdit(mat: any, folderId: number) {
    setDialogTargetFolderId(folderId)
    setDialogEditingChangeId(mat.tempId)
    setDialogName(mat.name)
    setDialogTypeId(mat.typeId)
    setDialogDescription(mat.description ?? '')
    setDialogAttributes(mat.attributes ?? {})
    setShowNewTypeInput(false)
    setNewTypeName('')
    setNewAttrName('')

    const selectedType = allMaterialTypes.find(t => t.id === mat.typeId)
    if (selectedType && selectedType.customAttributes) {
      try {
        const attrs = typeof selectedType.customAttributes === 'string'
          ? JSON.parse(selectedType.customAttributes)
          : selectedType.customAttributes
        setCustomAttrs(Array.isArray(attrs) ? attrs : [])
      } catch {
        setCustomAttrs([])
      }
    } else {
      setCustomAttrs([])
    }

    setDialogError('')
    setShowDialog(true)
  }

  function handleTypeChange(val: string) {
    if (val === '__new__') {
      setShowNewTypeInput(true)
      setDialogTypeId(0)
    } else {
      setShowNewTypeInput(false)
      setDialogTypeId(Number(val))
    }
  }

  async function handleConfirmNewType() {
    if (!newTypeName.trim()) return
    setDialogError('')
    try {
      const code = newTypeName.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50)

      const createdType = await createMaterialTypeMut.mutateAsync({
        code,
        name: newTypeName.trim(),
        infraTypeId: categoryId,
        customAttributes: []
      })

      setLocalCreatedTypes(prev => [...prev, createdType])
      setDialogTypeId(createdType.id)
      setShowNewTypeInput(false)
      setNewTypeName('')
    } catch (err: any) {
      setDialogError(err?.error?.message ?? 'Error al crear el tipo de material')
    }
  }

  function handleAddCustomAttr() {
    if (!newAttrName.trim()) return
    const code = newAttrName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
    if (customAttrs.some(a => a.code === code) || fixedProperties.some(p => p.code === code)) {
      setDialogError('Ya existe una propiedad con ese nombre o código.')
      return
    }
    setCustomAttrs(prev => [...prev, { code, name: newAttrName.trim(), type: newAttrType }])
    setNewAttrName('')
    setNewAttrType('STRING')
    setDialogError('')
  }

  async function handleSaveDialog(e: React.FormEvent) {
    e.preventDefault()
    setDialogError('')

    if (!dialogName.trim()) {
      setDialogError('Nombre es obligatorio.')
      return
    }

    if (!showNewTypeInput && !dialogTypeId) {
      setDialogError('Tipo de material es obligatorio.')
      return
    }

    if (showNewTypeInput) {
      setDialogError('Por favor, confirme el nuevo tipo de material primero.')
      return
    }

    try {
      let finalTypeId = dialogTypeId
      let typeObj = allMaterialTypes.find(t => t.id === dialogTypeId)

      // Check if we need to update custom attributes of the existing type
      const selectedType = allMaterialTypes.find(t => t.id === dialogTypeId)
      if (selectedType) {
        const oldAttrs = selectedType.customAttributes || []
        const oldLength = Array.isArray(oldAttrs) ? oldAttrs.length : 0
        if (customAttrs.length > oldLength) {
          const updatedType = await updateMaterialTypeMut.mutateAsync({
            id: dialogTypeId,
            body: { customAttributes: customAttrs }
          })
          // Update local types list to keep cache updated
          setLocalCreatedTypes(prev => prev.map(t => t.id === dialogTypeId ? updatedType : t))
          typeObj = updatedType
        }
      }

      if (!typeObj) return

      if (dialogEditingChangeId) {
        // Editing staged or existing change
        const exists = changes.some(c => c.tempId === dialogEditingChangeId)
        if (exists) {
          setChanges(prev => prev.map(c => {
            if (c.tempId === dialogEditingChangeId) {
              return {
                ...c,
                name: dialogName.trim(),
                typeId: finalTypeId,
                description: dialogDescription.trim() || null,
                attributes: dialogAttributes,
                type: typeObj!,
                operation: c.operation === 'INSTALL' ? 'INSTALL' : 'UPDATE'
              }
            }
            return c
          }))
        } else if (dialogEditingChangeId.startsWith('existing-')) {
          const matId = Number(dialogEditingChangeId.replace('existing-', ''))
          const newUpdateChange: MaterialChange = {
            tempId: dialogEditingChangeId,
            materialId: matId,
            name: dialogName.trim(),
            typeId: finalTypeId,
            description: dialogDescription.trim() || null,
            attributes: dialogAttributes,
            locationId: dialogTargetFolderId,
            operation: 'UPDATE',
            type: typeObj!
          }
          setChanges(prev => [...prev, newUpdateChange])
        }
      } else {
        // Adding new material to this folder
        const newChange: MaterialChange = {
          tempId: `new-${Date.now()}-${Math.random()}`,
          name: dialogName.trim(),
          typeId: finalTypeId,
          description: dialogDescription.trim() || null,
          attributes: dialogAttributes,
          locationId: dialogTargetFolderId,
          operation: 'INSTALL',
          type: typeObj!
        }
        setChanges(prev => [...prev, newChange])
      }
      setShowDialog(false)
    } catch (err: any) {
      setDialogError(err?.error?.message ?? 'Error al guardar tipo de material')
    }
  }

  // Toggle uninstall/remove of existing material
  function handleRemoveMaterial(mat: any, folderId: number) {
    if (mat.tempId.startsWith('new-')) {
      // If it's a staged new material, just delete the change completely
      setChanges(prev => prev.filter(c => c.tempId !== mat.tempId))
    } else {
      // If it's an existing material, check if it's already staged for deletion
      const existing = changes.find(c => c.materialId === mat.id)
      if (existing && existing.operation === 'UNINSTALL') {
        // Restore: remove the change item
        setChanges(prev => prev.filter(c => c.materialId !== mat.id))
      } else {
        // Stage for uninstall
        const newUninstall: MaterialChange = {
          tempId: `existing-${mat.id}`,
          materialId: mat.id,
          name: mat.name,
          typeId: mat.typeId,
          description: mat.description,
          attributes: mat.attributes || {},
          locationId: folderId,
          operation: 'UNINSTALL',
          type: mat.type
        }
        // Remove any staged edits first
        setChanges(prev => prev.filter(c => c.materialId !== mat.id).concat(newUninstall))
      }
    }
  }

  // Restore/cancel changes of edited material
  function handleRestoreMaterial(matId: number) {
    setChanges(prev => prev.filter(c => c.materialId !== matId))
  }

  // --- HIERARCHY BUILDER ---

  interface TreeNode {
    id: number
    name: string
    description: string | null
    parentId: number | null
    children: TreeNode[]
    materials: any[]
  }

  function buildTree(): TreeNode | null {
    if (!rootDetail) {
      return null
    }
    const rootLoc = allLocations.find(l => l.id === rootLocationId)
    if (!rootLoc) {
      return null
    }

    // Get all locations belonging to this root's subtree
    const subtreeLocs = allLocations.filter(
      l => l.id === rootLocationId || l.path.startsWith(rootLoc.path)
    )

    // Create tree node templates
    const nodeMap: Record<number, TreeNode> = {}
    subtreeLocs.forEach(loc => {
      nodeMap[loc.id] = {
        id: loc.id,
        name: loc.name,
        description: loc.description,
        parentId: loc.parentId,
        children: [],
        materials: []
      }
    })

    // Link parents to children
    subtreeLocs.forEach(loc => {
      const node = nodeMap[loc.id]
      if (loc.parentId && nodeMap[loc.parentId]) {
        nodeMap[loc.parentId].children.push(node)
      }
    })

    // Sort children
    subtreeLocs.forEach(loc => {
      const node = nodeMap[loc.id]
      node.children.sort((a, b) => a.name.localeCompare(b.name))
    })

    // Combine original direct and descendant materials
    const originalMaterials = [
      ...rootDetail.materials,
      ...(rootDetail.descendantMaterials || [])
    ]

    // Map all materials (applying modifications) to their respective tree node locations
    originalMaterials.forEach(m => {
      // Check if there are staged changes for this material
      const staged = changes.find(c => c.materialId === m.id)
      let materialState = {
        id: m.id,
        tempId: `existing-${m.id}`,
        name: m.name,
        typeId: m.typeId,
        description: m.description,
        attributes: m.attributes || {},
        type: m.type,
        locationId: m.locationId,
        operation: staged ? staged.operation : undefined,
        isEdited: staged && staged.operation === 'UPDATE',
        isDeleted: staged && staged.operation === 'UNINSTALL',
      }

      if (staged) {
        if (staged.operation === 'UPDATE') {
          // Override with staged details
          materialState.name = staged.name
          materialState.typeId = staged.typeId
          materialState.description = staged.description
          materialState.attributes = staged.attributes
          materialState.type = staged.type
          materialState.locationId = staged.locationId
        }
      }

      // If deleted, it stays in its location but marked as deleted.
      // If moved, it goes to its new staged locationId!
      const targetLocId = materialState.locationId
      if (targetLocId && nodeMap[targetLocId]) {
        nodeMap[targetLocId].materials.push(materialState)
      }
    })

    // Add newly staged materials (INSTALL)
    changes.forEach(c => {
      if (c.operation === 'INSTALL') {
        const materialState = {
          tempId: c.tempId,
          name: c.name,
          typeId: c.typeId,
          description: c.description,
          attributes: c.attributes,
          type: c.type,
          locationId: c.locationId,
          operation: 'INSTALL' as const,
          isNew: true
        }
        const targetLocId = c.locationId
        if (targetLocId && nodeMap[targetLocId]) {
          nodeMap[targetLocId].materials.push(materialState)
        }
      }
    })

    // Sort materials inside each node
    subtreeLocs.forEach(loc => {
      const node = nodeMap[loc.id]
      node.materials.sort((a, b) => a.name.localeCompare(b.name))
    })

    return nodeMap[rootLocationId] || null
  }

  const rootNode = buildTree()

  // --- RENDER TREE FUNCTION ---

  function renderTreeNode(node: TreeNode, depth: number = 0) {
    const isExpanded = !!expandedNodes[node.id]
    const hasChildren = node.children.length > 0 || node.materials.length > 0

    return (
      <div key={node.id} className="space-y-1.5 select-none">
        {/* Folder row */}
        <div
          className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all ${
            depth === 0
              ? 'bg-card border-app-border font-bold text-fg'
              : 'bg-app-bg/30 border-app-border/40 hover:bg-app-bg/50 text-fg-secondary'
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <div
            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
            onClick={() => toggleNode(node.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />
            ) : (
              <span className="w-4" />
            )}
            <Folder className={`w-4 h-4 shrink-0 ${depth === 0 ? 'text-primary' : 'text-blue-400'}`} />
            <span className="truncate text-sm font-semibold">{node.name}</span>
            <span className="text-[10px] text-muted font-normal shrink-0">
              ({node.materials.length} equipos)
            </span>
          </div>

          {node.parentId !== null && (
            <button
              type="button"
              onClick={() => openAdd(node.id)}
              className="text-[11px] font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded shrink-0"
            >
              + Añadir
            </button>
          )}
        </div>

        {/* Folder items */}
        {isExpanded && (
          <div className="space-y-1.5">
            {/* Materials inside folder */}
            {node.materials.map(m => {
              const isNew = m.operation === 'INSTALL'
              const isDeleted = m.operation === 'UNINSTALL'
              const isEdited = m.operation === 'UPDATE'

              let borderCls = 'border-app-border bg-card'
              let badgeText = ''
              let badgeCls = ''

              if (isNew) {
                borderCls = 'border-emerald-500/20 bg-emerald-500/[0.04]'
                badgeText = 'NUEVO'
                badgeCls = 'bg-emerald-500/10 text-emerald-600'
              } else if (isDeleted) {
                borderCls = 'border-rose-500/25 bg-rose-500/[0.02] opacity-65'
                badgeText = 'RETIRAR'
                badgeCls = 'bg-rose-500/10 text-rose-500'
              } else if (isEdited) {
                borderCls = 'border-blue-500/20 bg-blue-500/[0.04]'
                badgeText = 'MODIFICADO'
                badgeCls = 'bg-blue-500/10 text-blue-600'
              }

              return (
                <div
                  key={m.tempId}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${borderCls}`}
                  style={{ marginLeft: `${(depth + 1) * 16}px` }}
                >
                  <div className="min-w-0 pr-2 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Package className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className={`font-semibold break-words whitespace-normal ${isDeleted ? 'line-through text-muted' : 'text-fg'}`}>
                        {m.name}
                      </span>
                      <span className="text-[9px] font-medium uppercase px-1 rounded bg-app-bg border border-app-border text-muted">
                        {m.type.name}
                      </span>
                      {badgeText && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${badgeCls}`}>
                          {badgeText}
                        </span>
                      )}
                    </div>
                    {m.description && !isDeleted && (
                      <p className="text-[11px] text-muted line-clamp-1 pl-5">{m.description}</p>
                    )}
                  </div>

                  {/* Actions column - cleaned up to avoid duplicate restore buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    {!isDeleted && (
                      <button
                        type="button"
                        onClick={() => openEdit(m, node.id)}
                        className="p-1 text-muted hover:text-fg hover:bg-app-bg rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isDeleted ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(m, node.id)}
                        className="p-1 text-primary hover:text-primary-hover hover:bg-app-bg rounded transition-colors"
                        title="Restaurar"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        {isEdited && (
                          <button
                            type="button"
                            onClick={() => handleRestoreMaterial(m.id)}
                            className="p-1 text-primary hover:text-primary-hover hover:bg-app-bg rounded transition-colors"
                            title="Deshacer cambios"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(m, node.id)}
                          className="p-1 text-muted hover:text-error hover:bg-app-bg rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Subfolders */}
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Modal title="Editar Inventario de Materiales (Recursivo)" onClose={onClose}>
      <div className="flex flex-col h-[75vh]">
        {/* Tree container */}
        <div className="flex-1 overflow-y-auto pr-3 py-1 space-y-3">
          {isLoading ? (
            <div className="text-center py-20 text-muted text-sm">Cargando jerarquía de equipos...</div>
          ) : rootNode ? (
            renderTreeNode(rootNode, 0)
          ) : (
            <div className="text-center py-20 text-muted text-sm italic">Ubicación no encontrada.</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 pb-1 border-t border-app-border shrink-0 bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(changes)}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-bold"
          >
            Confirmar Cambios ({changes.length})
          </button>
        </div>
      </div>

      {/* Sub-modal Form Dialog for Adding/Editing Materials */}
      {showDialog && (
        <Modal
          title={dialogEditingChangeId ? 'Editar Material' : 'Añadir Material a la Ubicación'}
          onClose={() => setShowDialog(false)}
        >
          <form onSubmit={handleSaveDialog} className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">
                Nombre del Material <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={dialogName}
                onChange={e => setDialogName(e.target.value)}
                placeholder="Ej: Bomba Centrífuga"
                className={inputCls}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">
                Tipo de Material <span className="text-error">*</span>
              </label>
              <select
                value={showNewTypeInput ? '__new__' : String(dialogTypeId || '')}
                onChange={e => handleTypeChange(e.target.value)}
                className={inputCls}
                required
              >
                <option value="" disabled hidden>Seleccionar tipo...</option>
                <option value="__new__" className="text-blue-500 font-semibold" style={{ color: 'var(--primary, #2563eb)' }}>
                  + Crear nuevo tipo...
                </option>
                {allMaterialTypes.map(t => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>

              {showNewTypeInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    list="dialog-material-type-suggestions"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    placeholder="Nombre del nuevo tipo"
                    className={inputCls}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleConfirmNewType}
                    disabled={createMaterialTypeMut.isPending}
                    className="px-3 py-2 text-xs text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-semibold shrink-0"
                  >
                    {createMaterialTypeMut.isPending ? 'Confirmando...' : 'Confirmar'}
                  </button>
                </div>
              )}

              <datalist id="dialog-material-type-suggestions">
                {allSystemTypes.map(t => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción / Ficha Técnica</label>
              <textarea
                rows={2}
                value={dialogDescription}
                onChange={e => setDialogDescription(e.target.value)}
                placeholder="Especificaciones técnicas..."
                className={inputCls}
              />
            </div>

            {/* Technical Attributes Section */}
            {dialogTypeId > 0 && !showNewTypeInput && (
              <div className="space-y-3 pt-2 border-t border-app-border/40">
                <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider">Propiedades Técnicas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Custom Material-Type-Specific Properties */}
                  {customAttrs.map(attr => {
                    const val = dialogAttributes[attr.code] ?? ''
                    return (
                      <div key={attr.code}>
                        <label className="block text-[11px] font-semibold text-primary mb-1">
                          {attr.name}
                        </label>
                        <input
                          type={attr.type === 'NUMBER' ? 'number' : attr.type === 'DATE' ? 'date' : 'text'}
                          value={attr.type === 'NUMBER' && val === '' ? '' : val}
                          onChange={e => {
                            let parsedVal: any = e.target.value
                            if (attr.type === 'NUMBER') {
                              parsedVal = e.target.value === '' ? '' : Number(e.target.value)
                            }
                            setDialogAttributes(prev => ({ ...prev, [attr.code]: parsedVal }))
                          }}
                          placeholder={`Valor para ${attr.name}`}
                          className={inputCls}
                        />
                      </div>
                    )
                  })}

                  {/* 2. Global Fixed Properties */}
                  {fixedProperties.map(prop => {
                    const val = dialogAttributes[prop.code] ?? ''
                    return (
                      <div key={prop.code}>
                        <label className="block text-[11px] font-semibold text-muted mb-1">
                          {prop.name} (Global)
                        </label>
                        <input
                          type={prop.type === 'NUMBER' ? 'number' : prop.type === 'DATE' ? 'date' : 'text'}
                          value={prop.type === 'NUMBER' && val === '' ? '' : val}
                          onChange={e => {
                            let parsedVal: any = e.target.value
                            if (prop.type === 'NUMBER') {
                              parsedVal = e.target.value === '' ? '' : Number(e.target.value)
                            }
                            setDialogAttributes(prev => ({ ...prev, [prop.code]: parsedVal }))
                          }}
                          placeholder={`Valor para ${prop.name}`}
                          className={inputCls}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* 3. Inline custom attribute adder */}
                <div className="pt-3.5 border-t border-app-border/45 space-y-3">
                  <span className="block text-[11px] font-bold text-fg-secondary uppercase tracking-wider">Añadir Propiedad Técnica Personalizada</span>
                  <div className="bg-app-bg/65 p-3 rounded-lg border border-app-border/75 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted mb-1">Nombre (ej: Potencia)</label>
                        <input
                          type="text"
                          value={newAttrName}
                          onChange={e => setNewAttrName(e.target.value)}
                          placeholder="Ej: Marca, Modelo, Rango..."
                          className="w-full border border-app-border rounded-lg px-2.5 py-1.5 bg-card text-xs text-fg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted mb-1">Tipo de Dato</label>
                        <select
                          value={newAttrType}
                          onChange={e => setNewAttrType(e.target.value as any)}
                          className="w-full border border-app-border rounded-lg px-2.5 py-1.5 bg-card text-xs text-fg focus:outline-none"
                        >
                          <option value="STRING">Texto (STRING)</option>
                          <option value="NUMBER">Número (NUMBER)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddCustomAttr}
                        disabled={isPending || !newAttrName.trim()}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir Propiedad
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dialogError && <p className="text-error text-xs">{dialogError}</p>}

            <div className="sticky bottom-0 bg-card flex justify-end gap-2 pt-4 pb-1 border-t border-app-border z-10">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="px-3 py-1.5 text-xs text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-3 py-1.5 text-xs text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] font-semibold"
              >
                {isPending ? 'Guardando...' : 'Aceptar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Modal>
  )
}
