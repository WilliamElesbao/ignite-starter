---
name: paginating-list-queries
description: Use when adding or reviewing a query that returns many rows — page/pageSize, limit/offset, infinite scroll, "carregar mais", a feed, an export, or a job that walks a whole table — and when choosing the primary key for a new Drizzle table. Also use when deep pages are slow, when rows appear twice or vanish between pages, or when a COUNT(*) sits on the hot path. Postgres + Drizzle + Bun.
---

# Paginating list queries

## Overview

Two ways to say "give me the next N rows":

- **Offset** — `LIMIT n OFFSET k`. Postgres walks and discards `k` rows before returning anything, and the window shifts whenever a row is inserted or deleted ahead of it.
- **Cursor (keyset)** — `WHERE sort_key < $last ORDER BY sort_key DESC LIMIT n`. Postgres seeks straight into the index at the point you stopped. Page 900 costs what page 1 costs, and concurrent inserts can't shift the window.

Cursor pagination needs exactly one thing: **a stable total order encodable in a single comparable value.** That is the entire reason new tables should get a UUIDv7 id instead of `defaultRandom()` — a v7 id *is* that value.

## Choosing between them

| The list is… | Use | Why |
|---|---|---|
| An admin grid with numbered pages, "Página 3 de 47", jump-to-page | offset | Page numbers are the product requirement. A cursor cannot express "jump to page 12". |
| Infinite scroll, "carregar mais", a feed, a mobile list | cursor | Users scroll while new rows arrive. Offset duplicates and skips rows; cursor doesn't. |
| Walked end-to-end by a job, export, or sync | cursor | Long walks race with inserts. Offset silently drops rows mid-walk. |
| Small and bounded — a few thousand rows after filters | offset | `OFFSET 200` costs nothing. Don't put a cursor on a settings list. |
| Required to show an exact total ("47 resultados") | offset | A cursor has no cheap total. If you need the count you're paying for a `COUNT(*)` either way. |

Offset isn't wrong — it's O(offset) and unstable under concurrent writes. Both only bite past a certain size. Reach for a cursor when the list is unbounded or actively written, not reflexively.

## Why UUIDv7 for new tables

`uuid("id").defaultRandom()` produces UUIDv4: 122 random bits, no order. That costs you two things.

1. **No single-column cursor.** You fall back to a `(created_at, id)` composite — wider index, tuple comparison, a two-part cursor you have to serialize and parse.
2. **Random index inserts.** Every new row lands on an arbitrary B-tree page, so the index's hot set is the whole index instead of its right edge.

UUIDv7 places a 48-bit millisecond timestamp, big-endian, in the leading bytes. Postgres compares `uuid` values with `memcmp` over the raw 16 bytes, so **byte order is time order**. `ORDER BY id DESC` becomes newest-first *with a unique tiebreak already built in*, at the cost of no extra column.

```
019fb58a-3f5a-7000-923c-e81bdcf63aee
└─── ms timestamp ───┘ │ └── counter + random
                    version (7)
```

Two caveats to know before reaching for it:

- **It leaks creation time.** Fine for a row id. Not fine for anything doubling as an unguessable token — invite links, password resets, public share URLs. Those still need `crypto.randomUUID()` or random bytes.
- **Global monotonicity is not guaranteed.** `Bun.randomUUIDv7()` increments a per-process counter within a millisecond, but two processes inserting in the same millisecond interleave arbitrarily. This does not break cursor pagination — a cursor needs a *stable* total order, and byte comparison of stored values always gives one. It only means id order can disagree with wall-clock order by under a millisecond.

## Generating it

Postgres 16 — what this repo runs — has no `uuidv7()` function; that arrived in Postgres 18. So the id is generated app-side:

```ts
export const notificacoes = pgTable(
  "notificacoes",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // PK ordenável por tempo — habilita cursor pagination via ORDER BY id.
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => Bun.randomUUIDv7()),
    lidaEm: timestamp("lida_em", { withTimezone: true }),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
  },
  (t) => [index("idx_notificacoes_feed").on(t.tenantId, t.id)]
);
```

Once more than a couple of tables use it, factor the column into a shared helper in `packages/db/src/schema` so the choice is made once rather than copy-pasted.

**`$defaultFn` runs in JavaScript, not in Postgres.** Any insert that bypasses Drizzle — `db.execute(sql...)`, a `COPY`, a seed script, another service writing the same table — supplies no id and hits a not-null violation. That's a loud failure rather than a silent one, but it is still a failure. If a table has writers outside this codebase, install the `pg_uuidv7` extension and use a real column default instead. Don't split generation across both.

## The cursor query

Fetch one row more than you need. Its existence is what tells you a next page exists.

```ts
const PAGE_SIZE = 20;

async listar(tenantId: string, cursor?: string) {
  const rows = await this.db
    .select()
    .from(notificacoes)
    .where(
      and(
        eq(notificacoes.tenantId, tenantId),
        cursor ? lt(notificacoes.id, cursor) : undefined
      )
    )
    .orderBy(desc(notificacoes.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return { data, nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null };
}
```

The cursor is just the last id — nothing to encode, and `z.string().uuid()` already validates it. Drizzle's `and()` drops `undefined`, so the first page needs no separate branch.

## Existing tables with v4 ids

The tables already on `defaultRandom()` can still paginate by cursor. The sort key becomes the `(created_at, id)` pair, compared as a tuple:

```ts
const rows = await this.db
  .select()
  .from(leads)
  .where(
    and(
      eq(leads.tenantId, tenantId),
      cursor
        ? sql`(${leads.createdAt}, ${leads.id}) < (${cursor.createdAt}, ${cursor.id})`
        : undefined
    )
  )
  .orderBy(desc(leads.createdAt), desc(leads.id))
  .limit(PAGE_SIZE + 1);
```

Postgres row-value comparison does the right thing here. It is **not** equivalent to `created_at <= $1 AND id < $2`, which drops rows from earlier timestamps. The cursor is now two values, so serialize it (`${createdAt.toISOString()}|${id}`) and parse it back.

Don't migrate an existing table's ids just to get a prettier cursor — changing a primary key means rewriting every FK pointing at it. The composite works.

## Indexing

The cursor's `ORDER BY` has to be servable by an index, filters included: **equality columns first, then the sort key.**

```ts
index("idx_notificacoes_feed").on(t.tenantId, t.id)          // v7
index("idx_leads_feed").on(t.tenantId, t.createdAt, t.id)    // v4 composite
```

You don't need a DESC index for `ORDER BY … DESC` when every column sorts the same direction — Postgres scans the index backwards. A DESC index only earns its keep on mixed directions (`ORDER BY a DESC, b ASC`).

Without a matching index, cursor pagination sorts the whole filtered set on every page — slower than the offset query it replaced.

## Counts

`COUNT(*)` over the same `WHERE` scans every matching row, on every page. The offset code in this repo runs it in parallel with the page query, which hides the latency but not the load.

- Cursor pagination: don't return a total. `hasMore` is what the UI actually needs.
- Offset with page numbers: the total *is* the requirement, so keep it — but let the client cache it instead of recomputing per page.
- "Cerca de 12.000 resultados" on an unfiltered table: read `reltuples` from `pg_class` rather than counting.

## Common mistakes

| Mistake | What happens | Fix |
|---|---|---|
| `ORDER BY created_at` with no tiebreak | Rows sharing a timestamp order arbitrarily per query — they duplicate across pages or vanish | Add the id: `desc(createdAt), desc(id)` |
| `created_at < $1 AND id < $2` instead of a row-value comparison | Silently drops every older row whose id sorts lower | `(created_at, id) < ($1, $2)` |
| `LIMIT PAGE_SIZE`, then inferring `hasMore` from `rows.length === PAGE_SIZE` | The last full page advertises a next page that comes back empty | Fetch `PAGE_SIZE + 1` |
| Offset pagination behind infinite scroll | Inserts shift the window; users see the same row twice and miss others | Cursor |
| `Bun.randomUUIDv7()` for tokens or share links | Creation time and neighbouring ids are guessable | `crypto.randomUUID()` or random bytes |
| Cursor built from a different sort order than the query's | The comparison is meaningless — arbitrary rows come back | Cursor and `ORDER BY` derive from the same key, always |
| No index matching the `ORDER BY` | Full sort per page | Index equality columns first, then the sort key |

## Quick reference

```
new table                 → id: uuid("id").primaryKey().$defaultFn(() => Bun.randomUUIDv7())
feed / infinite scroll    → cursor on id (v7) or (created_at, id) (v4)
admin grid, page numbers  → offset, keep the COUNT
job walking a table       → cursor, always
page size                 → fetch N+1, slice to N
unguessable token         → not a v7 id
```
