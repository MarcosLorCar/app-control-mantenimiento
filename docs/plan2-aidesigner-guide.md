# Plan 2 — Guía de integración AIDesigner

Referencia de cómo y cuándo usar el MCP de AIDesigner durante el desarrollo del frontend SPA.

---

## Qué hace AIDesigner

Genera referencias visuales en HTML (no código React) mediante el MCP `aidesigner`. El flujo es:

```
generate_design  →  capture (CLI)  →  preview  →  adopt  →  implementar en React
```

El HTML resultante es un **tablero de referencia visual**, no código de producción. Se usa como inspiración para construir los componentes reales en React + Tailwind.

---

## Paso previo obligatorio: `DESIGN.md`

Antes de la primera llamada a AIDesigner revisar `.aidesigner/DESIGN.md`. Garantiza coherencia visual entre sesiones y evita repromptear desde cero. Si hay cambios al sistema de diseño durante el desarrollo, actualizar ese archivo.

---

## Qué tareas de Plan 2 usan AIDesigner

| Task | Tipo | AIDesigner | Motivo |
|------|------|:---:|--------|
| 1 — Scaffold | Configuración pura | ✗ | No hay UI |
| 2 — API client + AuthContext | Código puro | ✗ | No hay UI |
| 3 — Routing, Layout, Login | **UI principal** | ✓ | Sidebar, login form |
| 4 — TanStack Query hooks | Código puro | ✗ | No hay UI |
| 5 — Página Infraestructuras | **UI principal** | ✓ | Lista, detalle, formularios |
| 6 — Formularios Acciones + Materiales | **UI principal** | ✓ | Forms modales complejos |
| 7 — Páginas Admin | **UI principal** | ✓ | Tablas de gestión |
| 8 — Build y verificación | QA | ✗ | No hay UI nueva |

---

## Flujo por cada task de UI

### Antes de implementar

**1. Consultar el `.pen` primero**

El archivo `frontwabb.pen` contiene el diseño del frontend en formato Pencil. Usar las herramientas MCP **antes** de llamar a AIDesigner:

```
get_editor_state()           ← estado del editor Pencil
batch_get({ patterns: ["*"] }) ← explorar pantallas diseñadas
```

Si la pantalla ya está en el `.pen`, usar esa referencia y **no gastar créditos en AIDesigner** — son herramientas complementarias, no alternativas.

**2. Escribir un brief visual corto** — tipo de pantalla, acción principal del usuario, feel deseado. No una lista de secciones ni un PRD.

**3. Llamar a `generate_design`** via MCP con ese brief.

**4. Capturar** el artefacto:
```bash
npx -y @aidesigner/agent-skills capture \
  --html-file .aidesigner/mcp-latest.html \
  --prompt "<brief usado>" \
  --transport mcp \
  --remote-run-id "<run-id>"
```

**5. Preview:**
```bash
npx -y @aidesigner/agent-skills preview --id <run-id>
```

**6. Adopt** antes de portar al repo:
```bash
npx -y @aidesigner/agent-skills adopt --id <run-id>
```

### Durante la implementación

- El HTML de AIDesigner es **referencia visual**, no código a pegar en JSX.
- Construir los componentes React reales con el sistema de diseño del repo (clases Tailwind del `DESIGN.md`).
- Aplicar la lógica real (queries, guards, navegación) sobre el diseño referenciado.
- Si el diseño generado mejora algo del plan original (layout, jerarquía visual), adoptarlo conscientemente.

### Refinamiento

Si el primer resultado no convence:
```bash
npx -y @aidesigner/agent-skills refine --id <run-id> --prompt "<ajuste específico>"
```

---

## Prompts de referencia por task

**Task 3 — Layout + Login:**
> Internal ops dashboard for infrastructure management. Compact dark sidebar navigation (4-5 items), light main content area. Login page: centered card, email + password fields, submit button. Professional, data-dense feel. No decorative elements.

**Task 5 — Página Infraestructuras:**
> Infrastructure list view: filterable table with name, location, status badge columns. Row click opens detail view with nested actions timeline showing type, date, and performer. Write-access users see "New" and "Edit" buttons. Compact, information-dense layout.

**Task 6 — Forms Acciones + Materiales:**
> Modal forms for logging field operations. Action form: action type dropdown, description textarea, date picker. Material form: name, quantity + unit inline, optional unit cost with auto-computed total. Clean minimal modals, clear labels.

**Task 7 — Admin:**
> Admin panel with two sections: user management table (name, email, role, active toggle) and catalog manager (action types list with add form, consumesMaterials checkbox). Role-gated, utilitarian admin aesthetic.

---

## Si el MCP no está disponible

```bash
# Alternativa CLI (requiere AIDESIGNER_API_KEY):
npx -y @aidesigner/agent-skills generate --prompt "<brief>"

# Reconectar el MCP:
npx -y @aidesigner/agent-skills init
# Luego: Claude Code → /mcp → conectar servidor aidesigner → sign-in
```
