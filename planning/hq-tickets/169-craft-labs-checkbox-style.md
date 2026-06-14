# 169 · craft · Labs toggles are native OS checkboxes

**Status:** draft PR open · **Surface:** Settings → Labs · **Type:** craft / brand consistency

## Outcome
The Labs feature toggles now use a checkbox styled in the app's own design language — warm-paper fill, `--mut` border, the system `5px` corner radius, and an ink fill with a paper check when on — instead of a raw native OS checkbox.

## Root cause
`.labsRow__toggle input` styled the checkboxes with only `width/height/accent-color`, leaving them as **native OS checkboxes**. On the warm-paper / ink surface those render as stark white, square-cornered boxes in the platform default style — inconsistent with every other control in the app (inputs, buttons, cards all use `var(--bg)` fills, `var(--line)`/`var(--mut)` borders, and rounded corners). It's the only place in Settings where a raw native control breaks the visual language.

## Fix
Style the checkbox with `appearance: none` and the app's own tokens (CSS-only, scoped to `.labsRow__toggle input`):

```css
.labsRow__toggle input {
  appearance: none; -webkit-appearance: none;
  width: 18px; height: 18px; margin: 0;
  border: 1.5px solid var(--mut); border-radius: 5px; background: var(--bg);
  display: grid; place-content: center; cursor: pointer;
  transition: background .12s ease, border-color .12s ease;
}
.labsRow__toggle input:checked { background: var(--accent); border-color: var(--accent); }
.labsRow__toggle input:checked::after { content: ""; width: 5px; height: 9px;
  border: solid var(--bg); border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.labsRow__toggle input:disabled { opacity: .45; cursor: not-allowed; }
```

The checkmark is a CSS pseudo-element (no asset). Unchecked / checked / disabled states all covered.

## Verification
- Rendered all three states (unchecked / checked / disabled) against the native control with the real tokens — the designed checkbox is clearly perceivable and on-brand (see PR before/after).
- Applied via Vite HMR at `#settings` → the Labs checkboxes adopt the new style in-context and the rest of Settings is unchanged (no regression).
- CSS-only, scoped to `.labsRow__toggle input` — no other control affected; no TypeScript touched.
- Collision-safe: `styles.css` working tree is clean and line 1574 sits outside every unpushed `ship/functional-labs` hunk.
