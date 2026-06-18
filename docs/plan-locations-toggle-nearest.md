# Plan: Departamentos list/category toggle + "find nearest location" radar FAB

## Context
The main locations tab ("Departamentos", route `/` → `CategoriesList.tsx`) only ever shows infrastructure categories as a card grid. The goal is to add a toggle to also show all locations as a flat list, without losing the category view. Separately, add a second floating button (next to the existing "+") that uses GPS to jump to the location nearest to the user — useful when standing in front of a building/site and wanting to pull up its record without searching.

Viability: fully viable and cheap. The location dataset is small (tens/low-hundreds of rows for this kind of infra-tracking tool), `CategoriesList` already fetches **every** location with `latitude`/`longitude` in memory (`useLocations(undefined)`, line 14), and computing nearest is a plain O(n) haversine-distance scan with no spatial index or backend changes needed.

Confirmed by reading the actual file (`frontend/src/pages/locations/CategoriesList.tsx`):
- `useLocations(undefined)` (line 14) returns `allLocations` already used for category counts — full location objects including coords are already client-side.
- An existing FAB already lives at `bottom-8 right-8` ("Nueva Categoría", `RoleGuard require="write"`, lines 118–126) — the new radar FAB must go elsewhere, e.g. `bottom-8 left-8`, to avoid overlap.
- `frontend/src/pages/locations/LocationList.tsx` already implements a flat list of all root locations with its own search/filter bar but is currently unrouted/unused — reuse it as-is for the "Lista" view instead of writing a new list view.
- `frontend/src/components/ui/LocationMap.tsx` (lines ~46–68) already calls `navigator.geolocation.getCurrentPosition(..., { enableHighAccuracy: true, timeout: 5000 })` with "Obteniendo GPS..." loading text — reuse this wording/timing for consistency, but it does NOT branch on permission state (denied vs prompt), so that logic is new.
- `Modal` component at `frontend/src/components/ui/Modal.tsx` supports a `size` prop — use it for the nearest-location results panel (project convention: prefer modals over inline forms).

## Feature 1: List/Category toggle on CategoriesList

- Add `const [view, setView] = useState<'category' | 'list'>('category')` in `CategoriesList.tsx`. Local state only — no URL param/localStorage persistence (resets to the curated category view on navigation away; no stated need for persistence).
- Add a small segmented control above the grid (pill container, two buttons: "Por categoría" / "Lista", active state highlighted) that sets `view`.
- Wrap the existing grid markup (lines ~70–115) in `{view === 'category' && (...)}`.
- Add `{view === 'list' && <LocationList />}`, importing the existing component unchanged.
- Wrap the "Nueva Categoría" FAB block (lines 118–126) in `{view === 'category' && (...)}` — it doesn't make sense floating over the flat list view. `LocationList` already has its own inline "Nueva Ubicación" button in that view, so nothing is lost.
- Loading/error early-returns (lines 53–64) stay as-is; they gate on category data needed for both views' count badges.

## Feature 2: "Find nearest location" radar FAB

New files:
1. `frontend/src/utils/geo.ts` — `haversineDistanceMeters(lat1, lng1, lat2, lng2)` (standard haversine, Earth radius 6371000m) and `formatDistance(meters)` (`"<n> m"` under 1000m, else `"<n.n> km"`). Pure functions, trivially fast at this dataset size.
2. `frontend/src/hooks/useGeolocation.ts` — small state machine: `idle | checking | denied | locating | error | success(lat,lng)`.
   - `request()`: if `navigator.geolocation` missing → `error`. Else try `navigator.permissions.query({ name: 'geolocation' })`; if `denied` → set `denied` and stop (native prompt won't reappear, so show an in-app message instead). Otherwise call `getCurrentPosition` with the same options as `LocationMap.tsx` (`enableHighAccuracy: true, timeout: 5000`); map success/error accordingly.
3. `frontend/src/components/locations/NearestLocationModal.tsx` — props `{ locations, onClose }` (receives `allLocations` already fetched by `CategoriesList`, no extra query).
   - States: explanatory prompt + "Activar ubicación" button → `locating` ("Obteniendo GPS...") → on `denied` a friendly "enable location permissions in your browser" message with retry → on `success`, filter `locations` to those with non-null `latitude`/`longitude`, compute haversine distance for each, sort ascending, take top 5, render as clickable rows (name, category, formatted distance) that navigate to `/locations/:id` on click. If zero locations have coordinates, show a single fallback message ("Todavía no hay ubicaciones con coordenadas registradas.").
   - Wrapped in the existing `Modal` (`size="sm"`).

Modify `CategoriesList.tsx`:
- `const [showNearest, setShowNearest] = useState(false)`.
- New FAB at `fixed bottom-8 left-8`, same visual classes as the existing FAB, icon `Radar` (or `LocateFixed` fallback, verify against installed `lucide-react` version — exact icon to be swapped later by the user anyway), `onClick={() => setShowNearest(true)}`. Rendered unconditionally (both `view` states), not role-gated (it's a read-only navigation aid).
- `{showNearest && <NearestLocationModal locations={allLocations} onClose={() => setShowNearest(false)} />}`.

No backend or shared-type changes — the existing `Location` type already carries `latitude`/`longitude`, and the full dataset is already in memory client-side.

## Implementation order
1. `frontend/src/utils/geo.ts`
2. `frontend/src/hooks/useGeolocation.ts`
3. `frontend/src/components/locations/NearestLocationModal.tsx`
4. Wire radar FAB + modal into `CategoriesList.tsx`
5. Add the view toggle + gate the existing FAB + render `<LocationList />`

## Verification
- `npm run dev:frontend`, open `/`. Confirm grid view by default; toggle to "Lista" shows `LocationList` with its search bar and the right-side FAB hidden while the radar FAB stays visible; toggle back restores the category FAB.
- Use Chrome DevTools → Sensors → Location override (and the site Permissions panel to force `denied`/`prompt`/`granted`) to exercise all three geolocation branches:
  - `denied`: friendly in-app message, no native prompt.
  - `prompt`/default: explanatory step, then native permission dialog, then `locating` state.
  - `granted` + simulated coordinates: ranked top-5 list appears sorted by distance with correct m/km formatting; clicking a row navigates to that location's detail page.
- Temporarily test with zero geolocated locations to confirm the fallback message.
