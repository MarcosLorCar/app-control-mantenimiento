# Project Memory & Instructions (`gemini.md`)

This file serves as a starting point and persistent memory for the Gemini (Antigravity) AI assistant when working on **app-control-mantenimiento**.

---

## 1. Project Overview & Tech Stack

An application to control maintenance operations (actions, materials, infrastructure/locations).

- **Monorepo Structure**:
  - `backend/`: Fastify REST API, Prisma ORM, PostgreSQL, Vitest.
  - `frontend/`: React, Vite, TypeScript, Tailwind CSS, TanStack Query.
  - `shared/`: Shared TypeScript types/schemas/interfaces.

---

## 2. Directory Structure & Key Files

- **Backend**:
  - [schema.prisma](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/backend/prisma/schema.prisma): Database models (Role, User, InfrastructureType, Location, MaterialType, FixedProperty, Material, Action, ActionMaterial, SystemSetting, LocationPhoto).
  - [src/modules/locations/](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/backend/src/modules/locations/): Location CRUD API, routing, schemas, and services.
  - [src/modules/actions/](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/backend/src/modules/actions/): Maintenance actions.
  - [src/modules/materials/](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/backend/src/modules/materials/): Materials used in actions.
- **Frontend**:
  - [src/App.tsx](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/frontend/src/App.tsx): Routes definition.
  - [src/pages/locations/](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/frontend/src/pages/locations/): Views for locations (e.g. `CategoriesList`, `LocationDetail`).
  - [src/components/forms/LocationForm.tsx](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/frontend/src/components/forms/LocationForm.tsx): Component for creating/editing locations.
  - [src/components/ui/LocationMap.tsx](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/frontend/src/components/ui/LocationMap.tsx): Leaflet/OpenStreetMap component for maps.
  - [src/pages/admin/](file:///c:/Users/Marcos/Documents/Dev/app-control-mantenimiento/frontend/src/pages/admin/): Administrative pages.

---

## 3. Database Schema Highlights

- **Locations**:
  - `id`: Int (Autoincrement, Primary Key)
  - `name`: String
  - `description`: String?
  - `path`: String (Materialized path for tree hierarchy resolution)
  - `infraTypeId`: Int (Foreign Key to InfrastructureType / Category)
  - `parentId`: Int? (Self-referential relation for nested locations)
  - `latitude`: Float?
  - `longitude`: Float?
  - `image`: String? (Path to location photo)
  - `deletedAt`: DateTime? (Soft delete)

---

## 4. Development & Running the App

Run both frontend and backend concurrently in dev mode using:
```bash
./dev.sh
```
Or separately:
- Backend: `npm run dev` inside `backend/`
- Frontend: `npm run dev` inside `frontend/`

---

## 5. Coding Patterns & Principles

1. **Rich Aesthetics**: Tailored colors (HSL, sleek dark modes), modern typography (Outfit/Inter), smooth hover effects, micro-animations. Avoid default/basic look.
2. **Type Safety**: Use shared TypeScript types and coordinate with Prisma schemas.
3. **TanStack Query**: Use React Query for data fetching, caching, and cache invalidation.
4. **Tailwind CSS**: Modern custom designs.
