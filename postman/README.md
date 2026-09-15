# Helios.js - GetObjects/GetObject/CRUD e2e Postman suite

A Postman collection that calls **both** the NestJS and PHP APIs for the same operation, in the
same run, and asserts they return the same thing (structure for list endpoints, exact data for
single-record reads/writes - except the ID and server-generated fields like timestamps/hash). One
folder per module.

This mirrors what the Jest e2e suite already does
(`test/testing-utils/ModuleComparison.ts`), and reuses the exact same test payloads and known,
accepted PHP/NestJS differences as `test/modules/*.spec.ts`.

## How the comparison works

Each request in the steps below is **one** Postman item that:

1. Calls the **NestJS** API directly (the request Postman shows you).
2. Calls the **PHP** API for the same operation from inside the test script, via
   `pm.sendRequest(...)` (confirmed to be properly awaited by Newman/Postman before moving on).
3. Diffs the two responses.

Two different comparison strategies are used, matching the Jest suite:

- **GetObjects (list)**: **both** a shape comparison (which fields exist, object/array/scalar/null)
  **and** a value comparison, for rows that come back on both sides (matched by `ID`). The premise
  for the value check: the data is migrated, so for historical records that exist on both APIs,
  every field should be identical - not just the structure. Modules with a date-range filter query
  a fixed, narrow window (`2024-01-01`-`2024-12-31`, one month for AanwezigLeden - see below) both
  to keep the request size reasonable and to land on a period whose data should by now be settled
  migrated history rather than fields that are still being actively edited by real users.
- **GetObject (single record, by ID) / AddObject / UpdateObject**: exact **value** comparison on
  the fields we ourselves sent as payload (plus `VERWIJDERD`) - since we control the input, both
  APIs should store and echo it back identically.

In both cases, values are normalized first: dates/timestamps truncated to `YYYY-MM-DD`, time
strings truncated to `HH:MM` (`"14:00:00"` == `"14:00"`), numeric-looking strings coerced to
numbers (`"10.00"` == `10`), and a handful of fields (`VERWIJDERD`, `VLIEGT`, `SCORE`, `DDWV`)
always coerced to a real boolean, since PHP returns `0`/`1`/`null` for these where NestJS returns
a real boolean or vice versa.

Building the value comparison surfaced a number of genuine, pre-existing differences between the
two independently-evolved databases and a couple of real gaps/bugs - see "GetObjects value-check
exceptions" below for the full list and the investigation behind each one.

**Why the content check happens via a separate `GetObject` call, not `AddObject`'s own response:**
PHP's `AddObject` returns only the bare new ID for some modules (no JSON object at all), so there
is nothing to compare there. `GetObject`, called right after, always returns the full record on
both sides - that's the reliable point to verify the data was actually stored correctly.

### Audit trail checks

After every `AddObject`/`UpdateObject`/`DeleteObject`/`RestoreObject`, a dedicated step verifies
**independently on each backend** that an audit-trail row was actually written for that action -
NestJS via `Audit`'s `SELECTIE` full-text search (reliable there; searches the `VOOR`/`DATA`/
`RESULTAAT` JSON blobs, which is where the object's ID shows up), PHP via `TABEL` (the real DB
table name, matching each model's `@@map(...)` in `prisma/schema/*.prisma` - PHP's own `SELECTIE`
500s, a known pre-existing bug) plus the most recent rows, matched client-side by `OBJECT_ID`.

This is **not** a PHP-vs-NestJS content comparison (the two audit conventions genuinely differ by
design): NestJS logs Delete/Restore with the same generic `ACTIE: "Aanpassen"` as any other update
(it implements both by calling the same internal `UpdateObject` with `{VERWIJDERD: true/false}`),
while PHP uses its own dedicated `"Verwijderd"`/`"Hersteld"` actions for those two operations. Each
side is checked against its own, correct expectation.

Module folder step order (19 requests, most doing 2 live HTTP calls):

1. `GetObjects` - shape + value compare
2. `GetObjects (MAX)` - shape + value compare
3. `GetObjects (START+MAX)` - shape + value compare
4. `GetObjects (SORT asc)` - shape + value compare
5. `GetObjects (SORT desc)` - shape + value compare
6. `GetObjects (VERWIJDERD)` - shape + value compare
7. `AddObject` - status + ID only (see above)
8. `GetObject` (verify created) - compare payload fields + `VERWIJDERD`
9. Audit trail check - `ACTIE: "Toevoegen"` on both sides
10. `UpdateObject` - status only
11. `GetObject` (verify updated) - compare payload fields + `VERWIJDERD`
12. Audit trail check - `ACTIE: "Aanpassen"` on both sides (see per-module exceptions below)
13. `DeleteObject` (soft delete) - compare status
14. `GetObject` (verify soft-deleted) - compare `VERWIJDERD`
15. Audit trail check - NestJS `"Aanpassen"`, PHP `"Verwijderd"`
16. `RestoreObject` - compare status
17. `GetObject` (verify restored) - compare `VERWIJDERD`
18. Audit trail check - NestJS `"Aanpassen"`, PHP `"Hersteld"`
19. Cleanup - **not a test** (no assertions): soft-deletes the record on both sides so no active
    test data is left behind. PHP has no hard-delete endpoint at all (`RemoveObject` doesn't exist
    in the PHP API), so this suite doesn't test or use it on either side - both records end up
    soft-deleted as the accepted final state, same as PHP's own limitation.

## Files

- `generate.js` - source of truth. Regenerate whenever a module's payload or a known PHP/NestJS
  difference changes (keep it in sync with the matching `crud` config in
  `test/modules/<module>.spec.ts`).
- `Helios.js.postman_collection.json` - the generated collection (21 modules, 399 requests total).
- `Helios.js.postman_environment.json` - one environment with both backends' connection info
  (placeholder credentials - never commit real ones here).

Regenerate after editing `generate.js`:

```bash
node postman/generate.js
```

## Running it

### Postman GUI

1. Import `Helios.js.postman_collection.json` and `Helios.js.postman_environment.json`.
2. Open the "Helios.js" environment and fill in `nestjsUsername`/`nestjsPassword` and
   `phpUsername`/`phpPassword` (same credentials as `TESTING_NESTJS_*`/`TESTING_PHP_*` in `.env`).
   Adjust `nestjsBaseUrl`/`phpBaseUrl` if your servers run elsewhere.
3. Select the "Helios.js" environment, open the collection, and run it with the **Collection
   Runner** - requests must run in order (top to bottom), since later steps depend on the IDs
   captured by `AddObject`. Running a single module folder works the same way.

### Newman (CLI / CI)

```bash
npx newman run postman/Helios.js.postman_collection.json \
  -e postman/Helios.js.postman_environment.json \
  --env-var nestjsUsername=<TESTING_NESTJS_USERNAME> --env-var nestjsPassword=<TESTING_NESTJS_PASSWORD> \
  --env-var phpUsername=<TESTING_PHP_USERNAME> --env-var phpPassword=<TESTING_PHP_PASSWORD>
```

Run a single module with `--folder "<ModuleClassName>"` (e.g. `--folder "Documenten"`). A full run
fetches `GetObjects` lists from both APIs for every module several times (most modules scoped to
`2024-01-01`-`2024-12-31`, AanwezigLeden to a single month - see below), so it still moves a fair
amount of data and takes about 2 minutes end-to-end - scope to one folder while iterating.

## Known, encoded PHP/NestJS differences

Baked into the relevant module's generated test scripts so the comparison correctly tolerates
them instead of flagging a false failure - see the comments next to each module's entry in
`generate.js` for the specific, verified reason:

- `AddObject`: PHP returns `200` (a bare ID for some modules, the full record for others), NestJS
  always `201` with the full record.
- `UpdateObject`: both return `200` with the full record; ID must be in the request **body**
  (PHP 406s if it's only in the query string).
- `DeleteObject`: both `204`. `RestoreObject`: NestJS `200`, PHP `202`.
- Per-module `GetObjects` exceptions (`knownPhpGetObjectsFailures`): specific query-parameter
  combinations where PHP itself errors (Diensten's `SORT asc/desc` - 500; Facturen/Transacties'
  `VERWIJDERD` - 500/405; Reservering's `VERWIJDERD` - 405) - these run against NestJS only.
- Per-module `GetObjects` shape exceptions (`getObjectsTransform`): Competenties' PHP field names
  (`BLOK_ID`/`ONDERWERP` vs `OUDER_ID`/`OMSCHRIJVING`), Leden's NestJS-only `BRANDSTOF_PAS` field
  and `DIENSTEN`/`GMAIL` (PHP omits these from the list when null, NestJS always includes them),
  Tracks' `LINK_ID` (absent/different in NestJS).
- Per-module CRUD exceptions: `noPhpUpdate`/`noPhpRestore` (routes PHP doesn't support for that
  module - Reservering, Facturen, Transacties), `phpHidesDeletedRecords` (Facturen's PHP
  `GetObject` hides soft-deleted records entirely), `phpCreatePayload`/`phpUpdatePayload` +
  `phpFieldNameFor` (Competenties uses different field names in PHP vs NestJS),
  `dynamicDatumField` (Diensten needs a fresh random date per run - PHP has a unique constraint
  and no hard-delete, so a fixed date would collide with the previous run's leftover record),
  `excludeCreateFields` (fields PHP auto-derives/overrides server-side rather than using the
  client-supplied value - DagRapporten's `INGEVOERD_ID`, Diensten's `ROOSTER_ID`, Journaal's
  `DATUM`/`MELDER_ID`).
- Per-module audit exceptions: `auditUpdateOverride` - Progressie and Tracks don't mutate
  `UpdateObject` in place on PHP; it creates a new, linked history row instead (NestJS mutates
  Tracks in place normally - confirmed by direct testing - but replicates the same link-chain
  behavior for Progressie), so PHP logs `"Toevoegen"` against the *new* ID there instead of
  `"Aanpassen"` against the old one. `auditDeleteSkipPhp` - Facturen's PHP `DeleteObject` uses a
  completely different, legacy-specific audit format (`ACTIE: "Elimineer"`, `OBJECT_ID` always
  `null`, the deleted ID stored as a string in `VOOR` instead) that isn't correlatable the normal
  way, so that one check is skipped for PHP.
- Two narrow, real PHP bugs worked around (not "accepted differences" - the underlying bugs are
  still open): Daginfo's `UpdateObject` silently ignores text-column fields like `VLIEGBEDRIJF`/
  `METEO` (confirmed via direct testing - the call returns 200 but the value never persists), so
  the update payload uses a boolean field (`DDWV`) instead. Vliegtuigen's `normaliserenData()`
  crashes on a partial update missing `REGISTRATIE`, so the update payload always includes it.

## GetObjects value-check exceptions

Each was confirmed empirically (curl/direct DB queries against the live dev databases) before
being encoded as `getObjectsValueExceptions` in `generate.js` - either a bare field name (skipped
for every row - a systemic gap/representation difference) or `"ID:FIELD"` (skipped for one
specific, investigated row - an isolated historical anomaly), or `"ID:*"` (skip a whole row).
`skipGetObjectsValueCompare: true` turns the value check off for a module entirely.

- **AanwezigLeden**: `POSITIE` is `NULL` for all 15410 rows in the live NestJS database (confirmed
  via a direct Prisma count) while PHP always has a value - PHP assigns this queue position
  server-side and NestJS never ports that logic; a real, unimplemented feature, not data drift.
  `SECRET` - NestJS returns the raw 2FA secret, PHP a ready-made QR-code URL built from the same
  secret; a representation difference. `VLIEGTUIGTYPE_CODE` - empty type preferences occasionally
  render as `""`/`",,"` on NestJS instead of PHP's `null`, a minor formatting quirk. Its own
  `GetObjects` query window is also narrower than the other modules (one month, not the full year)
  - see the performance note below.
- **AanwezigVliegtuigen** / **Startlijst**: `ZITPLAATSEN`, `FLARMCODE`, `TYPE_ID`/
  `VLIEGTUIG_TYPE_ID`, `VLIEGTUIGTYPE_OMS`/`VLIEGTUIGTYPE`, `VOLGORDE`, `INZETBAAR` - all downstream
  of the single Vliegtuigen ID=201 anomaly below (any attendance/flight row for that aircraft joins
  in its now-incorrect type/seat/etc. data).
- **Agenda**: `"22:TIJD"` - record ID=22 has a different `TIJD` on the two databases, already known
  from the Jest e2e suite (`LAATSTE_AANPASSING` also differs there) - a single pre-existing,
  historical divergence between the two independently-evolved databases, not systemic.
- **Competenties**: `SCORE` folded into the shared boolean-coercion list (`toComparable`) rather
  than a per-module exception - every `RefCompetentie.SCORE` value in the live database is `0`
  (confirmed via Prisma), and PHP's driver renders a zero-valued TinyInt column as boolean `false`
  instead of `0`.
- **Daginfo**: `DIENSTEN` - PHP computes this as a dynamic attendance summary string ("Afwezig:
  ...\n\nAanwezig: ...\n\nOnbekend: ...") built from AanwezigLeden data at request time; NestJS
  only spreads the raw (always-null) `oper_daginfo.DIENSTEN` column and never rebuilds that
  summary. A real, substantial feature gap, out of scope to implement here.
- **Documenten**: `DATUM` - a `@DtoReadOnly` "created at" timestamp (`@default(now())`), not a
  user-supplied field. Since Documenten has no hard-delete, every suite run's own `AddObject` test
  record ends up soft-deleted and permanently in the dataset; NestJS and PHP appear to resolve
  "now" with a different timezone assumption around local midnight, so these auto-created rows can
  land on different calendar days on each side. Excluded rather than chased with per-ID exceptions
  since a new row (and ID) is added by every run.
- **Leden**: `WACHTWOORD`/`SECRET` differ for essentially every row (751/751 and 746/751 of a full
  comparison) because NestJS deliberately never returns them (stays `null`) instead of PHP's
  password hash/TOTP secret - an intentional, safer difference, not something to reconcile. `AUTH`
  (2/751) and `LIERIST_IO` (4/751) are small, real account-setting divergences that have apparently
  been changed independently on the two live systems since migration - same class as Agenda's
  `TIJD`. `BUDDY2` is a real, implemented joined relation (not a missing feature) but NestJS is
  `null` for 747/751 rows while PHP usually has a value - the underlying `BUDDY2_ID` link looks
  largely unmigrated. `"10109:KNVVL_LIDNUMMER"` and `"105:NAAM"` are two isolated, confirmed
  single-record anomalies (`"12341800"` vs `"123418"`; a doubled space in PHP's name), found to
  affect exactly one row each out of 751 compared.
- **Progressie** / **Tracks**: `skipGetObjectsValueCompare: true` - both modules' `UpdateObject`
  creates a new, linked history row rather than mutating in place (see `auditUpdateOverride`
  above), and neither has a hard-delete. Every CRUD e2e run this suite (and the Jest suite) has
  done during development therefore leaves permanently-linked, blijvend diverging test rows behind
  (confirmed: rows with obviously test-origin values like `"Gezet via import"`/
  `"E2E test (updated)"`). Shape comparison stays on.
- **TypesGroepen**: `"48:*"` - one specific, long-soft-deleted row accumulated unrelated leftover
  content from two different sources during this project's development (an early manual "audit
  spike" test on the NestJS side, an earlier run of this very suite on the PHP side) - test
  pollution on a single row, not a real difference.

### A real PHP performance bug found while narrowing the date range

`AanwezigLeden::GetObjects()` scales very badly with row count on PHP (likely an N+1 query pattern
in its attendance/flight-time computation per row): a 1-month window took 0.06s, 3 months 5.4s, 6
months 29s, and a full year (2024) consistently timed out (>60s, confirmed both via Newman and a
standalone curl). NestJS handles the same full-year query in about 1.3s. AanwezigLeden's own
`GetObjects` test window was therefore narrowed to one month (`2024-01-01`-`2024-01-31`) instead of
the full year used everywhere else - still enough data to exercise the comparison, without hitting
this pre-existing PHP bug.

## A real bug this suite found and fixed

Building the audit-trail checks surfaced a genuine, silent NestJS bug: `Audit.TABEL_NAAM` was
`VarChar(25)`, but the `AanwezigVliegtuigenService` class name is 26 characters - one over the
limit. Every audit write for that module threw `PrismaClientKnownRequestError` inside a
fire-and-forget event handler, so **no audit entry was ever recorded for that module's
Create/Update/Delete/Restore**, with no visible error anywhere except the file log. Fixed by
widening `TABEL`/`TABEL_NAAM` to `VarChar(50)` in `prisma/schema/Audit.prisma`, applied to the
live dev database via `npx prisma db execute` (this project has no `prisma/migrations` history -
the schema is applied directly) and verified live before/after.

## A real finding this suite surfaced but did NOT fix: likely data corruption on Vliegtuigen ID=201

Building the GetObjects value comparison turned up vliegtuig ID=201 (registration `PH-1623`,
callsign `E8`) with 8 fields differing between the two databases (`ZITPLAATSEN`, `FLARMCODE`,
`TYPE_ID`, `INZETBAAR`, `VOLGORDE`, `URL`, `BEVOEGDHEID_LOKAAL_ID`, `BEVOEGDHEID_OVERLAND_ID`) and
a NestJS `LAATSTE_AANPASSING` of `2026-08-06` versus PHP's untouched `2024-11-16`. This looks like
an unintended write to this real (non-test) aircraft record on the NestJS side, most likely from
earlier manual `curl` testing against an existing record while investigating the
`normaliserenData().trim()` crash documented above. It has not been restored - the mismatched
fields are excluded from the GetObjects value check (`"201:*"` on Vliegtuigen, plus the downstream
join fields on AanwezigVliegtuigen/Startlijst - see "GetObjects value-check exceptions" below) so
the rest of the comparison keeps working, but the underlying data has not been corrected.

## Verification

Run repeatedly with Newman against live dev servers while building the audit-trail checks:
399 requests / 788 HTTP calls / 1479 assertions, 0 failures, twice in a row, with no dangling
active test data left behind afterwards (both sides end soft-deleted, matching PHP's own
limitation).

Re-verified after adding the GetObjects value comparison (399 requests / 788 HTTP calls / 1588
assertions - more assertions since every GetObjects variant now also gets a value-check, not just
a shape-check): the first pass found 43 real, distinct value differences, investigated and either
fixed (a handful of missing normalizations in `toComparable`, plus one real PHP performance bug
worked around by narrowing AanwezigLeden's own date window) or encoded as a documented, understood
exception (see "GetObjects value-check exceptions" above) - down to 0 failures, confirmed clean on
two consecutive runs after that.
