# Location Hierarchy Redesign: Unified Tree Model

This document outlines the architectural decisions and design specifications for replacing the legacy 3-tier location hierarchy with a unified, recursive tree-like hierarchy.

---

## 1. Context & Motivation

### Legacy Model
The original database structure used three distinct tables to represent location levels:
1. `Infrastructure` (Root facilities like parks or buildings)
2. `Dependency` (Sub-divisions like fields, rooms, or floors—which allowed self-referencing hierarchy)
3. `Structure` (Structural elements like columns, posts, or specific equipment locations)

### Issues with the Legacy Model
* **Data Integrity Risks**: High risk of relational mismatches. A `Material` or `Action` had to maintain three optional foreign keys (`infrastructureId`, `dependencyId`, `structureId`). There were no database-level constraints preventing a material from being mapped to a building and simultaneously to a room belonging to a *different* building.
* **Rigidity**: Some sites require only 1 level of hierarchy (e.g., a simple water fountain), while others require 4+ levels (e.g., Campus ➡️ Building ➡️ Floor ➡️ Room ➡️ Desk). The legacy model was both too complex for simple setups and too restrictive for complex ones.
* **Maintenance Overhead**: Required maintaining three separate sets of database tables, endpoints, and UI selectors.

---

## 2. Proposed Architecture: Unified Tree Model

We will collapse all location levels into a single `Location` table featuring a recursive self-relation (`parentId`).

### Database Schema (Prisma)

```prisma
model Location {
  id          Int       @id @default(autoincrement())
  code        String?
  name        String
  description String?
  
  // Semantic classification (e.g., 'PARK', 'FIELD', 'ROOM', 'COLUMN')
  type        String?   
  
  // Materialized Path for fast path resolution & descendant lookups
  // Format: "/rootId/childId/grandchildId/" (e.g., "/1/4/12/")
  path        String    @default("/")

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  // Recursive self-relation
  parentId    Int?
  parent      Location?  @relation("LocationTree", fields: [parentId], references: [id])
  children    Location[] @relation("LocationTree")

  // Target links
  materials   Material[]
  actions     Action[]

  @@index([parentId])
  @@index([path])
  @@map("locations")
}
```

### Simplified Inventory & Action Schema
Instead of three optional keys, [Material] and [Action] will reference a single location ID:

```prisma
model Material {
  // ... other fields
  locationId Int?
  location   Location? @relation(fields: [locationId], references: [id])
}

model Action {
  // ... other fields
  locationId Int?
  location   Location? @relation(fields: [locationId], references: [id])
}
```

---

## 3. Core Technical Decisions

### A. Level-by-Level Navigation
* **Decision**: Browsing, searching, and selecting locations will be handled **step-by-step (lazy loaded)** rather than loading recursive subtrees all at once.
* **Queries**:
  * Root locations: `WHERE parentId IS NULL AND deletedAt IS NULL`
  * Sub-locations: `WHERE parentId = X AND deletedAt IS NULL`

### B. Materialized Path (`path` column)
* **Decision**: Each node maintains its hierarchy path as a string (e.g., `/1/4/12/`).
* **Benefits**:
  * Resolving breadcrumbs takes a single quick query (fetching the nodes corresponding to the IDs in the path string).
  * If we ever need to fetch all descendant items globally under a root node (ID `1`), we can run: `WHERE path LIKE '/1/%'`.

### C. Re-parenting Cycle Prevention
* **Decision**: Prevent circular parent-child loops during moves.
* **Validation**:
  * When moving location `A` to parent `B`, verify that:
    1. `B.id !== A.id`
    2. `B.path` does not contain `/A/` (meaning `B` is not a descendant of `A`).

### D. Deletion and Re-parenting (Bubble-Up)
* **Decision**: Avoid breaking references for children when a node is deleted.
* **Behavior**:
  * When a location is soft-deleted (setting `deletedAt`), we trigger a database update to point all its direct children to the deleted node's `parentId` (bubbling them up one level).
  * If it was a root node (`parentId = null`), its children's `parentId` becomes `null` (becoming root-level orphans).
  * Because we use soft-deletes, historical logs referencing the deleted node remain valid in the database.
