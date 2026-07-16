# Data durability: backup & restore

Status: approved, ready for planning
Date: 2026-07-16
Related: [2026-07-16-aset-import-aliran-cleanup-design.md](2026-07-16-aset-import-aliran-cleanup-design.md) (shares the import file picker)

## Problem

Kanal is a PWA (`display: standalone`), storing all data in IndexedDB (Dexie) and
localStorage — both origin-scoped browser storage. On Android, a PWA installed
via Chrome shares Chrome's storage for that origin. When the user clears
Chrome's browsing data with "Cookies and other site data" selected, the
installed app's data is wiped along with it. This is a known characteristic of
the PWA model generally, not a defect specific to Kanal, and it isn't fixable
by patching app code — the browser genuinely owns that storage.

The user's actual goal, confirmed during design discussion, is narrower than
"stop using a PWA": **data must not be permanently lost**, not "must be
distributed/perceived as a native app." That reframes the problem from an
architecture migration into a durability/recoverability problem.

## Non-goals (considered and explicitly deferred)

- **Native shell (e.g. Capacitor) with app-owned storage.** Solves the problem
  at the root, but is disproportionate for a pure data-safety goal: new
  toolchain (Android Studio/Gradle/SDK), a CI build pipeline, app signing, and
  ongoing two-platform maintenance. It would *still* need this same
  backup/restore mechanism as the migration bridge from existing PWA installs,
  so it doesn't remove this work, only adds more on top. Revisit only if the
  goal changes to genuine native distribution (e.g. Play Store).
- **Automatic cloud sync** (Drive/WebDAV/etc). The most complete protection
  (no manual step to forget), but a much bigger lift (auth, multi-device
  conflict resolution, a hosting/provider decision) and in tension with the
  app's existing positioning — Pengaturan already states "v1.0 · lokal, tanpa
  server". Worth revisiting later as an explicit opt-in, not for v1.

## Design

### Storage hardening (defense in depth, not a full fix)

Call `navigator.storage.persist()` once on app init (best-effort, no UI
feedback required). This asks the browser not to auto-evict this origin's
storage under device storage pressure. It does **not** protect against the
user manually clearing site data — that's a distinct, deliberate action this
API cannot intercept. It's cheap and strictly additive, so it ships regardless
of the backup/restore work below.

### Backup file format

A single JSON file capturing full app state, independent of the existing
`.xlsx` transaction export (which is transaction-only and lossy for
accounts/categories/settings):

```
{
  "version": 1,
  "exportedAt": "<ISO timestamp>",
  "transactions": RawTx[],   // same shape as db.ts's RawTx
  "accounts": Account[],     // full catalog, incl. group/balance/anchorAt/subtitle/includeInRunway/archived
  "categories": Category[],
  "theme": "dark" | "light" | "system"
}
```

`version` exists so a future format change can migrate or reject gracefully;
there is only one version today.

### Backup flow

New "Cadangkan data" button in [PengaturanSheet.tsx](../../src/features/settings/PengaturanSheet.tsx),
next to the existing "Ekspor transaksi", in the same Data section. On tap:
serialize `txStore.transactions` + `catalogStore.accounts` + `catalogStore.categories`
+ `themeStore.choice` into the format above, trigger a file download
(`kanal-backup-YYYY-MM-DD.json`), and record `localStorage['kanal:last-backup'] = Date.now()`.

Below the button, a passive status line: "Terakhir: X hari lalu" or "Belum
pernah dicadangkan", reading that same localStorage key. This is intentionally
passive rather than a proactive nagging banner — consistent with the app's
existing quiet tone (the PWA install banner is dismiss-once-for-7-days, never
blocking). A one-time proactive nudge (e.g. after the user has recorded a
meaningful amount of data with zero backups ever) was discussed as an optional
addition; not required for v1 unless requested.

### Restore flow

Extend the existing file-picker flow (currently only Realbyte `.xlsx`/`.xls`,
in [ImportPanel.tsx](../../src/features/statistik/runway/ImportPanel.tsx) —
see the companion spec for the exact accepted-extensions list, which this
feature also touches) to also accept `.json`. Routing is by file content, not
just extension: if the parsed JSON has the shape above (`version` + expected
keys), treat it as a Kanal backup; otherwise fall through to the existing
Realbyte parser.

On a valid backup file: replace `txStore.transactions` (same mechanism as the
existing `replaceAll`), replace `catalogStore.accounts` and `.categories`
directly (this is a full restore, not a merge — unlike `syncFromTransactions`,
which only adds missing entries), and apply `theme` via `themeStore.setChoice`.

### Error handling

Malformed JSON, or JSON missing required keys/an unrecognized `version`: show
a clear error ("File cadangan tidak valid atau rusak.") and apply nothing —
all-or-nothing, matching the existing import preview's behavior of not
touching the store until the user confirms.

## Testing / verification

Manual, since this is inherently about surviving a real storage wipe:
1. Record some transactions, accounts, and categories; set a non-default theme.
2. Back up.
3. Clear the site's storage via DevTools (Application → Clear storage) to
   simulate the Chrome "clear browsing data" scenario.
4. Restore from the backup file.
5. Confirm transactions, account balances/groups, categories, and theme all
   match the pre-wipe state exactly.
