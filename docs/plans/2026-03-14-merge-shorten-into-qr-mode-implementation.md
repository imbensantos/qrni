# Merge Shorten into QR Mode — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Remove the Shorten tab from the app, making QR Mode the unified single-URL experience with opt-in short link creation.

**Architecture:** All changes are in a single `.pen` design file (`designs/qrni-app.pen`). We delete 8 Shorten screens (4 desktop, 4 mobile), then update 6 Mode Toggle components from 3 tabs to 2 tabs by deleting the Shorten tab child and adjusting active states.

**Tech Stack:** Pencil MCP tools (batch_design, batch_get, get_screenshot)

---

### Task 1: Delete desktop Shorten screens (S1-S4)

Delete the 4 desktop Shorten screens that are no longer needed.

**Step 1: Delete screens**

Use `batch_design` on `designs/qrni-app.pen`:

```javascript
D("Ty57P")
D("1LQxm")
D("j302o")
D("DIihb")
```

- `Ty57P` = S1 Desktop - Shorten Anonymous
- `1LQxm` = S2 Desktop - Shorten Anonymous Result
- `j302o` = S3 Desktop - Shorten Signed In
- `DIihb` = S4 Desktop - Shorten Namespace Selected

**Step 2: Verify**

Use `batch_get` to confirm the deleted screen IDs no longer exist. Check top-level nodes.

**Step 3: Commit**

```bash
git add designs/qrni-app.pen
git commit -m "design: remove desktop Shorten screens (S1-S4)"
```

---

### Task 2: Delete mobile Shorten screens (M1-M4)

Delete the 4 mobile Shorten screens.

**Step 1: Delete screens**

Use `batch_design` on `designs/qrni-app.pen`:

```javascript
D("OuWIG")
D("hOZ9r")
D("2VCQI")
D("7uuuN")
```

- `OuWIG` = M1 Mobile - Shorten Anonymous
- `hOZ9r` = M2 Mobile - Shorten Anonymous Result
- `2VCQI` = M3 Mobile - Shorten Signed In
- `7uuuN` = M4 Mobile - Namespace Selected

**Step 2: Verify**

Use `batch_get` to confirm deletion.

**Step 3: Commit**

```bash
git add designs/qrni-app.pen
git commit -m "design: remove mobile Shorten screens (M1-M4)"
```

---

### Task 3: Update desktop Mode Toggles — remove Shorten tab

Update the 4 remaining desktop screens that have a 3-tab Mode Toggle. Remove the Shorten tab and keep only Single | Bulk.

**Screens and their Mode Toggle + Shorten tab IDs:**

| Screen | Toggle ID | Shorten Tab ID | Currently Active Tab |
|--------|-----------|---------------|---------------------|
| S5 (Create Namespace) `Zl9Gk` | `SVsCR` | `dIgma` | Shorten (needs to change to Single) |
| S6 (Namespace Mgmt) `zLCnP` | `l5geZ` | `o0yTN` | Shorten (needs to change to Single) |
| S7 (Editor/Viewer) `vTTXy` | `2m0pS` | `g9i3n` | Shorten (needs to change to Single) |
| S9 (QR Mode) `OXUT4` | `Mlp6P` | `yAH1L` | Single (stays Single) |

**Step 1: Delete Shorten tabs and fix active states for S5, S6, S7**

For S5, S6, S7: the Shorten tab is currently active (has white fill + shadow). After deleting it, the Single tab needs to become active.

Use `batch_design` on `designs/qrni-app.pen`:

```javascript
D("dIgma")
D("o0yTN")
D("g9i3n")
D("yAH1L")
```

**Step 2: Update Single tab to active state on S5, S6, S7**

The Single tabs on S5/S6/S7 currently have inactive styling. Update them to active:

S5 Single tab (`cvvHB`): update text child
```javascript
U("cvvHB", {fill: "$white", effect: {"blur": 3, "color": "#1A191810", "offset": {"x": 0, "y": 1}, "shadowType": "outer", "type": "shadow"}})
U("t3HOE", {fill: "$text-primary", fontWeight: "600"})
```

S6 Single tab (`3XLYx`): update text child
```javascript
U("3XLYx", {fill: "$white", effect: {"blur": 3, "color": "#1A191810", "offset": {"x": 0, "y": 1}, "shadowType": "outer", "type": "shadow"}})
U("QsoNm", {fill: "$text-primary", fontWeight: "600"})
```

S7 Single tab (`tIJzm`): update text child
```javascript
U("tIJzm", {fill: "$white", effect: {"blur": 3, "color": "#1A191810", "offset": {"x": 0, "y": 1}, "shadowType": "outer", "type": "shadow"}})
U("1Ku7l", {fill: "$text-primary", fontWeight: "600"})
```

All 10 operations (4 deletes + 6 updates) can be done in a single `batch_design` call.

**Step 3: Verify with screenshots**

Take screenshots of S5 (`Zl9Gk`), S6 (`zLCnP`), S7 (`vTTXy`), and S9 (`OXUT4`) to verify the toggles look correct — 2 tabs, correct active state.

**Step 4: Commit**

```bash
git add designs/qrni-app.pen
git commit -m "design: update desktop Mode Toggles to 2 tabs (Single | Bulk)"
```

---

### Task 4: Update mobile Mode Toggles — remove Shorten tab

Update the 2 remaining mobile screens that have a 3-tab Mode Toggle.

**Screens and their Mode Toggle + Shorten tab IDs:**

| Screen | Toggle ID | Shorten Tab ID | Currently Active Tab |
|--------|-----------|---------------|---------------------|
| M5 (Create Namespace) `G12x2` | `HUJkf` | `G1NND` | Shorten (needs to change to Single) |
| M9 (QR Mode) `0zMb7` | `iSQ18` | `kgwXs` | Single (stays Single) |

**Step 1: Delete Shorten tabs**

Use `batch_design` on `designs/qrni-app.pen`:

```javascript
D("G1NND")
D("kgwXs")
```

**Step 2: Update M5 Single tab to active state**

M5 Single tab (`S442W`): update text child
```javascript
U("S442W", {fill: "$white", effect: {"blur": 3, "color": "#1A191810", "offset": {"x": 0, "y": 1}, "shadowType": "outer", "type": "shadow"}})
U("Tgclb", {fill: "$text-primary", fontWeight: "600"})
```

**Step 3: Verify with screenshots**

Take screenshots of M5 (`G12x2`) and M9 (`0zMb7`) to verify the toggles look correct.

**Step 4: Commit**

```bash
git add designs/qrni-app.pen
git commit -m "design: update mobile Mode Toggles to 2 tabs (Single | Bulk)"
```

---

### Task 5: Update screen names to reflect new structure

Rename screens to remove "Shorten" references and clarify the new unified structure.

**Step 1: Rename screens**

Use `batch_design` on `designs/qrni-app.pen`:

```javascript
U("OXUT4", {name: "S5 Desktop - Single Mode with Short Link Toggle"})
U("0zMb7", {name: "M5 Mobile - Single Mode with Short Link Toggle"})
```

Renumber S5-S9 and M5-M9 if desired (screen naming is cosmetic).

**Step 2: Commit**

```bash
git add designs/qrni-app.pen
git commit -m "design: rename screens to reflect merged tab structure"
```

---

### Task 6: Visual verification pass

Final check — screenshot every remaining screen that had a Mode Toggle to confirm everything looks right.

**Step 1: Screenshot all updated screens**

- `Zl9Gk` (S5 Desktop)
- `zLCnP` (S6 Desktop)
- `vTTXy` (S7 Desktop)
- `OXUT4` (S9 Desktop)
- `G12x2` (M5 Mobile)
- `0zMb7` (M9 Mobile)

Verify: each toggle shows exactly 2 tabs (Single | Bulk), correct active state, no visual glitches.

**Step 2: Check that deleted screens are gone**

Use `batch_get` to list all top-level nodes. Confirm S1-S4 desktop and M1-M4 mobile are no longer present.
