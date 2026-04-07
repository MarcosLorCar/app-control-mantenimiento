# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**control-actions** is an infrastructure management system for tracking actions (inspections, repairs, installations, etc.) performed on physical infrastructures. It manages materials consumed per action, users/roles, and infrastructure statuses.

## Repository Contents

- `schemabbdd.txt` — Database schema in DBML format (source of truth for data model)
- `esquema_infraestructuras.png` — ER diagram visualization of the schema
- `frontwabb.pen` — Frontend UI design (Pencil format — only readable via the `pencil` MCP tools, not via Read/Grep)

## Database Schema (DBML)

Core domain entities and their relationships:

```
roles → users → actions → action_materials
infra_statuses → infrastructures → actions
action_types → actions
```

**Key design decisions:**
- `action_types.consumes_materials` flag controls whether an action type tracks material consumption
- `action_materials` has no pre-existing catalog — materials are registered at the moment of consumption (freeform `name`, `unit`, `quantity`, `unit_cost`, `total_cost`, `supplier`)
- Reference tables (`roles`, `infra_statuses`, `action_types`) are extensible without migrations

**Tables:**
| Table | Purpose |
|-------|---------|
| `roles` | User roles with `can_write` and `can_manage` permission flags |
| `users` | Authenticated users, linked to a role |
| `infrastructures` | Physical assets with a status and location |
| `infra_statuses` | Status catalog (active, inactive, maintenance…) |
| `actions` | Events on an infrastructure: who did what, when, and what type |
| `action_types` | Catalog of action types (inspection, repair, installation…) |
| `action_materials` | Materials consumed during an action (cost tracking included) |

## Working with Design Files

The `.pen` file requires the Pencil desktop app to be running. Use the `pencil` MCP tools (`get_editor_state`, `batch_get`, `batch_design`) — never `Read` or `Grep` on `.pen` files.
