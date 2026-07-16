# Import balance fix, Aset/Kategori consolidation, Aliran icon cleanup

Status: approved, ready for planning
Date: 2026-07-16
Related: [2026-07-16-data-durability-backup-design.md](2026-07-16-data-durability-backup-design.md) (shares the import file picker)

Three independent, contained fixes to the existing app — no architecture
change, each separately committable. Bundled into one spec because they were
raised and diagnosed together, not because they depend on each other.

## Fix 1 — Imported account balances stuck at Rp 0

### Root cause (confirmed by reproduction against the user's real export)

[`catalogStore.ts`'s `syncFromTransactions`](../../src/data/catalogStore.ts)
creates a new `Account` for every unrecognized name found in imported rows,
with `balance: 0` and `anchorAt: now` (import time). The balance actually
shown anywhere in the app is never that stored field directly — it's derived
live by [`useLiveAccounts.ts`](../../src/data/useLiveAccounts.ts): stored
balance plus every transaction delta that occurred **after** `anchorAt`
(`deriveDeltas`: `if (!rec || ts <= rec.anchor) return`).

Imported transactions are historical — every one of them is dated before "the
moment the import happened". So for a freshly-created import account, *no*
transaction ever satisfies `ts > anchor`, no delta is ever applied, and the
displayed balance stays at the hardcoded starting value of 0 forever — even
though the transactions themselves are correctly recorded and individually
correct. Confirmed against the user's real `01-01-25_31-12-25.xlsx`: accounts
are created with the right names, transactions import cleanly, but every
account showed Rp 0 in Aset.

This is a genuine bug (unlike the E-wallet default grouping below, which is a
deliberate documented stopgap) — nothing about "new accounts start at zero"
was intended.

### Fix

Anchor new import-created accounts at `anchorAt: 0` (epoch) instead of `now`,
keeping `balance: 0` as the true pre-history starting point. This requires no
new summing logic — `deriveDeltas` already sums every delta after the anchor,
so anchoring at the beginning of time makes it naturally include the entire
imported history for that account.

### Explicitly out of scope

Earlier in this discussion, corrupted dates/categories ("undefined, NaN
undefined" headers, "NaN.NaN" times) were suspected as a live parser bug.
Reproducing the exact import pipeline against two different real export files
(including the one that originally produced the bad screenshots) found zero
parse failures — the user confirmed the actual cause was importing a `.csv`
export at the time, not the `.xlsx` format the app is designed around; a
subsequent `.xlsx` import of the same period worked cleanly except for this
balance bug. Per the user, no further work on CSV date-format robustness is
needed.

Optional, cheap, not required: [`ImportPanel.tsx`](../../src/features/statistik/runway/ImportPanel.tsx)'s
file input currently still lists `.csv` as an accepted extension
(`accept=".xlsx,.xls,.csv"`) even though the parser's plain-text date fallback
doesn't reliably handle CSV's un-typed date cells. Removing `.csv` from the
accepted list would stop advertising support that doesn't actually work well,
preventing a repeat of the original confusion — worth a one-line change while
touching this file, but not blocking.

## Fix 2 — Aset gains Kategori management; Runway's Kelola sheet retired

### Current state

[`AsetTab.tsx`](../../src/features/aset/AsetTab.tsx) already has a complete
account CRUD: tapping any account opens
[`AccountEditSheet.tsx`](../../src/features/aset/AccountEditSheet.tsx) (name,
balance, group, runway-toggle, archive, delete) — this is a superset of what
Runway's Kelola sheet offers for accounts. Separately,
[`KelolaSheet.tsx`](../../src/features/statistik/runway/KelolaSheet.tsx)
(opened from a pencil icon in [`RunwayView.tsx`](../../src/features/statistik/runway/RunwayView.tsx))
has three tabs: Akun (an older, less capable duplicate `AccountManager`),
Kategori (the only category manager that exists today), and Impor (already a
duplicate — import was previously relocated to
[`PengaturanSheet.tsx`](../../src/features/settings/PengaturanSheet.tsx), but
the old copy in Kelola was never removed).

### Design

- **AsetTab.tsx**: add a small pill-style segmented control ("Akun" /
  "Kategori") near the top of the tab, visually matching the tab-row style
  already used in KelolaSheet (`rounded-[8px]` pill buttons on `bg-kanal-surf2`
  when active) — reusing an existing pattern, not inventing a new one.
  - **Akun segment** (default): current behavior, unchanged — hero total,
    grouped account list, sticky "Tambah akun", archive menu.
  - **Kategori segment**: the `CategoryManager` component relocated as-is
    from KelolaSheet.tsx (same inline add/edit/delete list UI, no redesign).
    The hero total, account grouping, sticky add-account button, and archive
    menu are hidden while this segment is active — none of them apply to
    categories.
- **Delete `KelolaSheet.tsx` entirely.** All three of its tabs are superseded:
  Akun by Aset's own sheet, Kategori by the segment above, Impor by
  Pengaturan's existing import flow.
- **Remove the Kelola entry point from `RunwayView.tsx`**: the pencil-icon
  button (`aria-label="Kelola akun & kategori"`), its `editorOpen` state, and
  the `<KelolaSheet>` mount.

### Verification

Before deleting `AccountManager` (KelolaSheet's inline account editor),
confirm `AccountEditSheet` covers everything it did — already checked: name,
group, and balance are covered by both, but `AccountEditSheet` additionally
has archive, delete-with-confirmation, and the runway-inclusion toggle that
the Kelola version lacks. Safe to remove.

## Fix 3 — Aliran: remove dead/unnecessary icons

[`AliranView.tsx`](../../src/features/statistik/aliran/AliranView.tsx)
currently shows three icon buttons over the 3D scene: reset-camera, a 2D/3D
toggle, and a "Bantuan" (help) button. Keep only the 2D/3D toggle — this is
the one the user described wanting to keep ("akses gambar 2D dari Aliran").

- Remove the reset-camera `IconButton` (`ArrowCounterClockwise`, "Atur ulang
  kamera") and its `requestReset` call from AliranView. The underlying
  reset capability is not orphaned — it's also invoked from
  [`AliranInfoPanel.tsx`](../../src/features/statistik/aliran/AliranInfoPanel.tsx)
  when the user clears a selection, which is unaffected by this change.
- Remove the "Bantuan" `IconButton` (`Question`). Its `onClick` handler is
  currently a literal no-op (`() => {}`) — it does nothing today, so this is
  dead-code removal, not a behavior change.
- Remove the now-unused `ArrowCounterClockwise` and `Question` imports.

## Testing / verification (all three fixes)

Manual UI pass:
1. Import a real `.xlsx` export; confirm new accounts in Aset show their
   correct derived balances (not Rp 0).
2. In Aset, switch between Akun and Kategori segments; add/edit/delete an
   entry in each; confirm balances and category list both behave as before
   relocation.
3. Open Statistik → Runway; confirm there is no remaining "Kelola" entry
   point.
4. Open Statistik → Aliran; confirm exactly one icon (2D/3D toggle) appears
   over the 3D scene, and it still switches views correctly.
