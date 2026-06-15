# Branch plan: security & stability hardening

**Suggested branch name:** `fix/security-and-stability`

This plan covers 8 concrete fixes derived from a full code review of the Google OAuth + password-reset PR. Ordered so that each group can be worked independently; the migration task (S3) must land before S1 and S2.

---

## Group S — Security

### S1 · Add `tokenVersion` to invalidate sessions on password reset

**Why:** `resetUserPassword` updates the DB but leaves refresh cookies alive for 7 days. `verifyToken` is purely stateless — it never checks the DB. An attacker holding the refresh cookie can keep minting access tokens indefinitely after a reset.

**What to change:**

1. `backend/prisma/schema.prisma` — add `tokenVersion Int @default(0)` to the `User` model.
2. New migration — `npx prisma migrate dev --name add_token_version`.
3. `backend/src/modules/users/users.service.ts` — in `resetUserPassword`, add `tokenVersion: { increment: 1 }` to the update payload.
4. `backend/src/plugins/auth.plugin.ts` — in `verifyToken`, after `request.jwtVerify()`, fetch `user.tokenVersion` from DB and compare to `payload.tv`. If mismatched, reply 401.
5. `backend/src/modules/auth/auth.service.ts` — in `loginService` and `googleLoginService`, include `tv: user.tokenVersion` in both the access token and refresh token payloads.
6. `backend/src/modules/auth/auth.routes.ts` — in `/refresh`, include `tv: user.tokenVersion` in the new access token payload.
7. `shared/src/types.ts` — add `tv: number` to `JwtPayload`.

**Note:** This adds one DB read per authenticated request. Acceptable for this app's scale; revisit with a Redis cache if it becomes a bottleneck.

---

### S2 · Re-read `mustChangePassword` from DB in `PATCH /password`

**Why:** The JWT claim `must_change_password` can be up to 15 minutes stale. Two bugs follow from reading it from the token:
- A stale `must_change_password: true` token allows a second passwordless change after the user already changed it.
- Any leaked access token for a newly created or post-reset account can change the password without knowing the current one.

**What to change:**

`backend/src/modules/auth/auth.routes.ts` — in the `PATCH /password` handler, after extracting `userId` from the JWT, fetch `{ mustChangePassword, passwordHash }` from the DB in one query. Use the live DB value of `mustChangePassword` (not the JWT claim) to decide whether to require `currentPassword`.

```ts
const user = await fastify.db.user.findUnique({
  where: { id: userId },
  select: { passwordHash: true, mustChangePassword: true },
})
if (!user) return reply.code(404).send(...)

if (!user.mustChangePassword) {
  // require currentPassword as before
}
```

This also removes the need to check `caller.must_change_password` from the JWT for this route.

---

### S3 · Guard the Google OAuth callback against unconfigured state

**Why:** `GET /google/callback` is always registered even when `GOOGLE_CLIENT_ID`/`SECRET` are absent. Hitting it when OAuth is unconfigured throws a `TypeError` (`fastify.googleOAuth2 is undefined`), which the catch block silently converts to a `/login?error=oauth_error` redirect — masking a misconfiguration.

**What to change:**

`backend/src/modules/auth/auth.routes.ts` — add a runtime guard at the top of the callback handler:

```ts
fastify.get('/google/callback', async (request, reply) => {
  // @ts-expect-error — googleOAuth2 is conditionally registered
  if (!fastify.googleOAuth2) {
    return reply.code(503).send({ error: { code: 'OAUTH_DISABLED', message: 'OAuth not configured' } })
  }
  // ... rest of handler
})
```

---

### S4 · Fix `resp.ok` check on Google userinfo response

**Why:** If the Google userinfo endpoint returns a non-200 (revoked token, quota hit, network error), `resp.json()` returns an error body, making `email` undefined. Prisma silently drops `undefined` from `WHERE` clauses — `findFirst({ where: { email: undefined } })` returns the first active user in the table, and a refresh cookie is issued for that account.

**What to change:**

`backend/src/modules/auth/auth.routes.ts` — immediately after the userinfo fetch:

```ts
const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
  headers: { Authorization: `Bearer ${token.token.access_token}` },
})
if (!resp.ok) throw Object.assign(new Error('userinfo_failed'), { code: 'OAUTH_ERROR' })
const { email } = (await resp.json()) as { email: string }
```

---

## Group D — Data integrity

### D1 · Move duplicate-material check before `db.action.create`

**Why:** The dedup check at `actions.service.ts:126` runs after the action row is already persisted. A request with duplicate `materialId` values creates an orphaned action row, then throws — no rollback, no cleanup.

**What to change:**

`backend/src/modules/actions/actions.service.ts` — move the `existingIds`/`uniqueIds` block to the top of `createAction`, before any DB writes. Also wrap the action creation + material inserts in a `db.$transaction(...)` to make the whole operation atomic.

---

### D2 · Throw on soft-deleted parent in `createLocation`

**Why:** When `parentId` points to a soft-deleted location, `findFirst({ where: { id: parentId, deletedAt: null } })` returns `null`. `parentPath` stays `null`, so the new location gets path `/{newId}/` (root-level) while `parentId` still points to the deleted record. This silently corrupts the materialized-path tree.

**What to change:**

`backend/src/modules/locations/locations.service.ts` — in `createLocation`, after the parent lookup, if `parentId` was provided but `parent` is null, throw a 404:

```ts
if (parentId) {
  const parent = await db.location.findFirst({ where: { id: parentId, deletedAt: null } })
  if (!parent) throw { statusCode: 404, code: 'NOT_FOUND', message: 'La ubicación padre no existe' }
  parentPath = parent.path
}
```

---

### D3 · Fix `updateUser` email-conflict check to exclude soft-deleted users

**Why:** The conflict query in `updateUser` has no `deletedAt: null` filter. A soft-deleted user's email permanently blocks all active users from adopting it via update, even though `createUser` correctly allows this.

**What to change:**

`backend/src/modules/users/users.service.ts` — in `updateUser`, add `deletedAt: null` to the conflict check:

```ts
const dup = await db.user.findFirst({
  where: { email: body.email, deletedAt: null, NOT: { id } },
})
```

---

## Group P — Performance

### P1 · Replace N+1 material counts with a single aggregated query

**Why:** `listLocations` and `getLocationDetail` each fire one `db.material.count` per location/child via `Promise.all`. For 50 locations that's 51 DB queries per page load. The old approach (one `findMany` + in-memory filter) used 1 query but loaded all materials. The correct fix is one aggregated query.

**What to change:**

`backend/src/modules/locations/locations.service.ts` — replace both `Promise.all` blocks with a single raw query that counts materials grouped by their location's path prefix:

```ts
// pseudocode — exact SQL TBD based on path structure
const counts: { path: string; count: bigint }[] = await db.$queryRaw`
  SELECT l.path, COUNT(m.id) AS count
  FROM materials m
  JOIN locations l ON m."locationId" = l.id
  WHERE m."deletedAt" IS NULL AND l."deletedAt" IS NULL
  GROUP BY l.path
`
// then for each target location, sum counts where path LIKE loc.path || '%'
```

Alternatively use a single `db.material.groupBy` on `locationId`, then join paths in memory — simpler but still one query.

Write a test in `backend/tests/locations.test.ts` asserting the count matches across a 3-level hierarchy.

---

## Cleanup (low effort, worth doing in the same branch)

- **Extract `setRefreshCookie` helper** — the `reply.setCookie('refreshToken', ...)` block with identical options is copy-pasted between `/login` and `/google/callback`. Extract to a private function in `auth.routes.ts`.
- **Move `updateLocation` descendant path updates into a transaction** — the loop at `locations.service.ts:~220` updates descendant paths one-by-one outside any transaction. Wrap in `db.$transaction(async tx => { ... })`.

---

## Suggested implementation order

```
S3 (quick guard, unblocks testing OAuth off)
S4 (quick resp.ok check)
D3 (one-liner fix)
D2 (throw on bad parentId)
D1 (move check + wrap in transaction)
S2 (DB re-read in PATCH /password — depends on user model being stable)
S1 (tokenVersion — migration, auth plugin, service changes — do last as it touches the most files)
P1 (N+1 query — isolated to locations.service.ts, can go any time)
Cleanup (anytime)
```
