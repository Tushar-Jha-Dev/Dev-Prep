# Design: DevPrep

## 1. Shared Design Philosophy & Universal Rules

### Visual Ethos
DevPrep is a focused developer workbench. Whether in "Paper" or "Studio" skin, the platform feels deliberate, calm, and purposeful. It rejects generic templates and AI-generated SaaS aesthetics:

- **Strict Avoid List:**
  - No purple/blue/indigo glowing gradients, blurred blobs, or glassmorphism.
  - No default "navy sidebar + bright blue buttons" template look.
  - No emoji used as icons; no stock rocket/sparkle graphics.
  - No icons trapped inside rounded squares on stat cards.
  - No pure `#000000` or pure `#FFFFFF` surfaces.
  - Never use pure `#000` or `#FFF` anywhere in Studio or Paper.
  - No heavy drop shadows; depth comes from thin borders (`1px`) and subtle surface elevation.
  - Ligatures stay strictly **disabled** across all monospace code elements (`font-variant-ligatures: none !important; font-feature-settings: "liga" 0, "calt" 0 !important;`) so operators like `!==`, `===`, and `=>` render as literal characters.
  - Numbers in tables, stat values, timer displays, cursor positions, and progress percentages use `font-variant-numeric: tabular-nums` to eliminate layout jitter.

### Semantic Status Mapping (Shared)
- **Difficulty Badges:** Easy = `--success`, Medium = `--warning`, Hard = `--danger`.
- **Application Status Badges:** Applied = `--info`, Interview = `--warning`, Selected = `--success`, Rejected = `--danger`.
- **Primary Actions:** Use `--accent` fill with `--accent-contrast` text.
- **Charts:** Series 1 = `--chart-1` (or `--accent`), Series 2 = `--chart-2` (or `--info`), Series 3–5 = `--chart-3`..`--chart-5`.
- **Focus Rings:** Universal accessible focus visible via `box-shadow: var(--focus-ring); outline: none;`.

---

## 2. Skin: Paper (Current Default)

### Concept: Warm Paper and Ink
Feels like a well-kept study notebook on a desk. Warm off-white paper or warm charcoal ink surfaces, ink-colored text, and a single terracotta accent.

### Color Tokens (CSS Variables)

Defined in `client/src/styles/skins/paper.css` under `[data-skin="paper"]`:

#### Light Mode (`[data-skin="paper"]` / `:root`)
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--bg` | `#F4EFE6` | Page background, warm paper |
| `--surface` | `#FBF8F2` | Cards, modals, topbar |
| `--surface-2` | `#EFE8DB` | Table headers, hover rows, inputs |
| `--surface-3` | `#E6DFD2` | Active containers, skeleton shimmer |
| `--border` | `#DDD3C1` | Subtle divider borders |
| `--border-strong` | `#C8BDA7` | High-contrast inputs & table borders |
| `--text` | `#26211B` | Ink text |
| `--text-muted` | `#766B5B` | Secondary labels & timestamps |
| `--accent` | `#B5472B` | Terracotta accent |
| `--accent-hover` | `#9A3A21` | Terracotta button hover |
| `--accent-soft` | `#F1DDD3` | Soft terracotta badge background |
| `--accent-contrast`| `#FFF8F0` | Text on terracotta button |
| `--success` | `#346841` | Warm moss green (WCAG AA 5.3:1) |
| `--success-soft`| `#DDEBDD` | Soft moss badge background |
| `--warning` | `#925807` | Ochre gold (WCAG AA 4.65:1) |
| `--warning-soft`| `#F4E5C2` | Soft ochre badge background |
| `--danger` | `#A8332E` | Brick red (WCAG AA 4.9:1) |
| `--danger-soft` | `#F2D9D5` | Soft brick badge background |
| `--info` | `#2F6F73` | Deep teal (WCAG AA 4.55:1) |
| `--info-soft` | `#D7E8E6` | Soft teal badge background |
| `--sidebar-bg` | `#EAE2D3` | Warm sidebar navigation background |
| `--sidebar-text` | `#5E5444` | Muted sidebar navigation text |
| `--sidebar-active-bg` | `#26211B` | Ink active sidebar link fill |
| `--sidebar-active-text`| `#F4EFE6` | Paper text on active link |
| `--shadow-sm` | `0 1px 0 rgba(38,33,27,0.04)` | Subtle bottom paper edge |
| `--radius-sm` | `6px` | Inputs, buttons, badges |
| `--radius-md` | `10px` | Cards, dialogs |
| `--focus-ring` | `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)` | Focus ring |
| `--selection` | `rgba(181, 71, 43, 0.20)` | Text selection highlight |
| `--modal-backdrop`| `rgba(21, 19, 16, 0.45)` | Dimmed paper backdrop |
| `--logo-tile` | `transparent` | Sits transparent on light page |

#### Dark Mode (`[data-skin="paper"][data-theme="dark"]`)
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--bg` | `#151310` | Dark warm charcoal |
| `--surface` | `#1D1A16` | Dark card surface |
| `--surface-2` | `#26221C` | Dark table headers & hover |
| `--surface-3` | `#2F2A23` | Dark inputs & skeletons |
| `--border` | `#342F27` | Thin dark borders |
| `--border-strong` | `#453E34` | Higher contrast dark borders |
| `--text` | `#EDE6D9` | Warm cream text |
| `--text-muted` | `#A0947F` | Muted warm cream text |
| `--accent` | `#E07A55` | Luminous terracotta |
| `--accent-hover` | `#EA8C69` | Hover terracotta |
| `--accent-soft` | `#3A241B` | Soft dark terracotta fill |
| `--accent-contrast`| `#1A0F0A` | Text on luminous terracotta |
| `--success` | `#7FB58A` | Muted moss green (6.0:1) |
| `--success-soft`| `#1F2E22` | Dark moss soft fill |
| `--warning` | `#E0B055` | Warm ochre (7.1:1) |
| `--warning-soft`| `#33291A` | Dark ochre soft fill |
| `--danger` | `#E27A72` | Warm salmon brick (5.1:1) |
| `--danger-soft` | `#3A2120` | Dark brick soft fill |
| `--info` | `#6FB3B5` | Luminous teal (5.95:1) |
| `--info-soft` | `#1B2E2F` | Dark teal soft fill |
| `--sidebar-bg` | `#100E0B` | Deep ink sidebar |
| `--sidebar-text` | `#A0947F` | Sidebar link text |
| `--sidebar-active-bg` | `#2A251D` | Active sidebar link fill |
| `--sidebar-active-text`| `#EDE6D9` | Active sidebar link text |
| `--shadow-sm` | `none` | Zero shadows in dark mode |
| `--radius-sm` | `6px` | Radii |
| `--radius-md` | `10px` | Radii |
| `--modal-backdrop`| `rgba(0, 0, 0, 0.65)` | Dimmed backdrop |
| `--logo-tile` | `#F4EFE6` | Cream tile for logo contrast |

### Paper Typography
- **Headings & Stat Numbers:** "Young Serif" (weight 400 only). Enforces `font-weight: 400; font-synthesis: none;` to avoid artificial faux-bold distortion. Visual hierarchy relies on scale and ink contrast.
- **Body & UI:** "Hanken Grotesk" (400, 500, 600).
- **Code & Timer:** "IBM Plex Mono" (400, 500).

---

## 3. Skin: Studio (Modern Precision)

### Concept: Precision Engineering Workbench
Clean, sharp, structured, and modern. Built with cool neutrals, a confident cobalt blue accent, and high-readability grotesque typography.

### Color Tokens (Hex & HSL Equivalents)

Defined in `client/src/styles/skins/studio.css` under `[data-skin="studio"]`:

#### Light Mode (`[data-skin="studio"]`)
| Token | Hex | HSL Equivalent | Role |
| :--- | :--- | :--- | :--- |
| `--bg` | `#F8F7F4` | `hsl(45, 22%, 96%)` | Crisp neutral workbench background |
| `--surface` | `#FDFDFB` | `hsl(60, 33%, 99%)` | Clean card & modal surface |
| `--surface-2` | `#EFEEE9` | `hsl(50, 16%, 93%)` | Table headers, secondary hover |
| `--surface-3` | `#E7E6E0` | `hsl(51, 13%, 89%)` | Active control background, skeletons |
| `--border` | `#E3E1DA` | `hsl(47, 14%, 87%)` | Standard 1px container borders |
| `--border-strong` | `#CFCDC4` | `hsl(49, 10%, 79%)` | Input borders & active table dividers |
| `--text` | `#18181B` | `hsl(240, 6%, 10%)` | Deep zinc text (16.5:1 ratio) |
| `--text-muted` | `#5C5E66` | `hsl(228, 5%, 38%)` | Balanced muted text (6.0:1 ratio) |
| `--accent` | `#2B44B8` | `hsl(229, 62%, 45%)` | Cobalt blue accent (7.5:1 ratio) |
| `--accent-hover` | `#22379A` | `hsl(230, 64%, 37%)` | Darkened cobalt hover state |
| `--accent-soft` | `#E4E8F8` | `hsl(228, 59%, 93%)` | Soft cobalt pill background |
| `--accent-contrast`| `#F8F7F4` | `hsl(45, 22%, 96%)` | Text on cobalt button (7.5:1 ratio) |
| `--success` | `#27703F` | `hsl(140, 48%, 30%)` | Forest green status (5.1:1 ratio) |
| `--success-soft`| `#E1F0E6` | `hsl(140, 33%, 91%)` | Forest soft badge fill |
| `--warning` | `#8A5A00` | `hsl(39, 100%, 27%)` | Amber warning status (5.0:1 ratio) |
| `--warning-soft`| `#F6EBCF` | `hsl(43, 68%, 89%)` | Amber soft badge fill |
| `--danger` | `#B42318` | `hsl(4, 76%, 40%)` | Crimson danger status (5.1:1 ratio) |
| `--danger-soft` | `#F8DEDA` | `hsl(8, 68%, 91%)` | Crimson soft badge fill |
| `--info` | `#475569` | `hsl(215, 19%, 35%)` | Slate info status (6.1:1 ratio) |
| `--info-soft` | `#E3E8EF` | `hsl(215, 27%, 91%)` | Slate soft badge fill |
| `--sidebar-bg` | `#F1F0EB` | `hsl(50, 18%, 93%)` | Neutral structured sidebar |
| `--sidebar-text` | `#5C5E66` | `hsl(228, 5%, 38%)` | Sidebar text |
| `--sidebar-active-bg`| `#E4E8F8` | `hsl(228, 59%, 93%)` | Soft cobalt active nav pill |
| `--sidebar-active-text`| `#2B44B8`| `hsl(229, 62%, 45%)` | Cobalt blue active nav text |
| `--shadow-sm` | `0 1px 2px rgba(24,24,27,0.05)` | Micro crisp shadow |
| `--radius-sm` | `6px` | Buttons, inputs, chips |
| `--radius-md` | `8px` | Cards, dialogs |
| `--focus-ring` | `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)` | Two-tone focus ring |
| `--selection` | `rgba(43, 68, 184, 0.18)` | Cobalt selection tint |
| `--chart-1` | `#2B44B8` | Primary chart series (Cobalt) |
| `--chart-2` | `#475569` | Secondary series (Slate) |
| `--chart-3` | `#27703F` | Tertiary series (Forest) |
| `--chart-4` | `#8A5A00` | Quaternary series (Amber) |
| `--chart-5` | `#B42318` | Quinary series (Crimson) |
| `--logo-tile` | `transparent` | Transparent on light |
| `--modal-backdrop`| `rgba(18, 19, 22, 0.50)` | Crisp dark neutral backdrop without blur |

#### Dark Mode (`[data-skin="studio"][data-theme="dark"]`)
| Token | Hex | HSL Equivalent | Role |
| :--- | :--- | :--- | :--- |
| `--bg` | `#121316` | `hsl(225, 10%, 8%)` | Deep slate-black canvas |
| `--surface` | `#181B20` | `hsl(218, 14%, 11%)` | Elevated surface card |
| `--surface-2` | `#22262E` | `hsl(220, 15%, 16%)` | Dark table headers & active rows |
| `--surface-3` | `#2A2F38` | `hsl(219, 14%, 19%)` | Dark inputs & skeleton fills |
| `--border` | `rgba(255,255,255,0.08)` | `hsla(0, 0%, 100%, 0.08)` | Minimal white border |
| `--border-strong` | `rgba(255,255,255,0.16)` | `hsla(0, 0%, 100%, 0.16)` | Clear high-contrast boundary |
| `--text` | `#EDEDEF` | `hsl(240, 6%, 93%)` | Crisp light text (15.9:1 ratio) |
| `--text-muted` | `#9A9CA6` | `hsl(230, 6%, 63%)` | High-contrast secondary text (6.8:1 ratio) |
| `--accent` | `#8FA6FF` | `hsl(228, 100%, 78%)` | Electric periwinkle accent (8.0:1 ratio) |
| `--accent-hover` | `#A7B8FF` | `hsl(228, 100%, 83%)` | Highlighted accent hover |
| `--accent-soft` | `#1D2548` | `hsl(229, 43%, 20%)` | Dark cobalt soft fill |
| `--accent-contrast`| `#0B1030` | `hsl(232, 63%, 12%)` | Dark text on electric periwinkle button |
| `--success` | `#66C28A` | `hsl(143, 43%, 58%)` | Vivid green status (7.1:1 ratio) |
| `--success-soft`| `#16281F` | `hsl(150, 29%, 12%)` | Dark green soft fill |
| `--warning` | `#E0B04F` | `hsl(40, 70%, 59%)` | Vivid gold status (7.7:1 ratio) |
| `--warning-soft`| `#2B2414` | `hsl(41, 37%, 12%)` | Dark gold soft fill |
| `--danger` | `#F2867E` | `hsl(4, 82%, 72%)` | Soft coral red (6.6:1 ratio) |
| `--danger-soft` | `#2E1A19` | `hsl(3, 30%, 14%)` | Dark coral soft fill |
| `--info` | `#9AA7BD` | `hsl(218, 21%, 67%)` | Soft slate blue (6.4:1 ratio) |
| `--info-soft` | `#1E242E` | `hsl(218, 21%, 15%)` | Dark slate blue soft fill |
| `--sidebar-bg` | `#0E0F12` | `hsl(225, 13%, 6%)` | Solid dark sidebar background |
| `--sidebar-text` | `#9A9CA6` | `hsl(230, 6%, 63%)` | Muted sidebar text |
| `--sidebar-active-bg`| `#1D2548` | `hsl(229, 43%, 20%)` | Dark cobalt active pill fill |
| `--sidebar-active-text`| `#8FA6FF`| `hsl(228, 100%, 78%)` | Electric periwinkle active link text |
| `--shadow-sm` | `none` | Zero shadows |
| `--radius-sm` | `6px` | Sharp radii |
| `--radius-md` | `8px` | Sharp radii |
| `--selection` | `rgba(143, 166, 255, 0.28)` | Periwinkle selection highlight |
| `--chart-1` | `#8FA6FF` | Electric Periwinkle |
| `--chart-2` | `#9AA7BD` | Slate Blue |
| `--chart-3` | `#66C28A` | Vivid Green |
| `--chart-4` | `#E0B04F` | Vivid Gold |
| `--chart-5` | `#F2867E` | Soft Coral |
| `--logo-tile` | `#F2F0EA` | Cream tile for logo contrast on dark |
| `--modal-backdrop`| `rgba(18, 19, 22, 0.65)` | Backdrop without blur |

### Studio Typography
- **Headings, Big Numbers & Wordmark:** "Bricolage Grotesque" (weight 600, using native `opsz` axis).
  - Letter-spacing: `-0.02em` for 28px and larger; `-0.01em` for 19–27px.
  - Line-height: `1.15`–`1.22`.
- **Body & UI:** "Plus Jakarta Sans" (weights 400, 500, 600), font size 15px, line-height 1.6.
- **Code, Timer & Editor:** "JetBrains Mono" (weights 400, 500). Ligatures disabled (`font-variant-ligatures: none !important`), tabular numerals.

### Studio Component Rules
- **Buttons:**
  - Primary: Flat `--accent` fill with `--accent-contrast` text, 40px height, `--radius-sm`, hover `--accent-hover`. No gradients, no glows.
  - Secondary: Transparent with 1px `--border-strong` border.
  - Danger: Outlined brick/crimson with `--danger`, fills on hover.
  - Visible focus ring (`--focus-ring`) on all interactive buttons.
- **Cards:** `--surface`, 1px `--border`, `--radius-md` (8px), `--shadow-sm` only in light mode, none in dark mode. No glassmorphism and no backdrop blur anywhere.
- **Inputs & Selects:** `--surface` background, 1px `--border-strong`, focus applies `--accent` border and `--focus-ring`.
- **Modals:** Centered dialog on `--surface`, 1px `--border`, `--radius-md` (8px), backdrop `rgba(18, 19, 22, 0.50)` without backdrop-filter blur.
- **Tables:** Header row on `--surface-2`, row hover on `--surface-2`, 1px dividers with `--border`.
- **Charts:** Dynamic mapping through `var(--chart-1)` through `var(--chart-5)`, allowing charts to automatically re-theme upon skin switch.

---

## 4. Skin and Mode Switching Architecture

### Root Attributes
Visual styles are driven purely by HTML attributes on `document.documentElement`:
- `data-skin="paper"` or `data-skin="studio"`
- `data-theme="dark"` (present for dark mode, removed for light mode)

### Single Source of Truth
- `DEFAULT_SKIN = 'paper'` in `client/src/config/theme.js`.
- `ThemeContext.jsx` manages `{ skin, setSkin, mode, toggleMode }`.
- Persisted in localStorage:
  - `devprep-skin` = `'paper' | 'studio'`
  - `devprep-theme` = `'light' | 'dark'`

### Zero Flash on Initial Load (FOIT Prevention)
An inline synchronous `<script>` in `client/index.html` executes before React mounts:
```javascript
var savedSkin = localStorage.getItem('devprep-skin');
var activeSkin = (savedSkin === 'studio' || savedSkin === 'paper') ? savedSkin : 'paper';
document.documentElement.setAttribute('data-skin', activeSkin);

var savedTheme = localStorage.getItem('devprep-theme');
var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.setAttribute('data-theme', 'dark');
} else {
  document.documentElement.removeAttribute('data-theme');
}
```

---

## 5. How to Revert to Paper

Reverting back to the original Paper skin is effortless and can be done in three ways:

1. **Via UI (Instant, No Reload):**
   Go to **Profile > Appearance & Theme** and click the **"Paper"** skin card. The entire app switches back immediately.
2. **Via Config File (Developer Revert):**
   In [`client/src/config/theme.js`](client/src/config/theme.js), ensure `export const DEFAULT_SKIN = 'paper';` and clear the `devprep-skin` key in your browser (`localStorage.removeItem('devprep-skin')`).
3. **Via Git Tag / Branch (Codebase Baseline):**
   Switch back to the tagged baseline commit:
   ```bash
   git checkout theme-paper-v1
   ```
   Or switch back to the master branch:
   ```bash
   git checkout master
   ```

---

## 6. Component Design: Profile Photo & Reusable Avatar

### Reusable `<Avatar />` Component
- **Props:** `user` (object containing `{ name }`), `size` (number in px, default 38), `className`, `src` (optional dataUrl override, defaults to AuthContext `avatar`).
- **Rendering:**
  - When photo dataUrl is present: `<img>` with `src={dataUrl}`, `alt={user?.name || 'User avatar'}`, `decoding="async"`, `object-fit: cover`, and `border-radius: 50%`.
  - When photo is absent: Circular initials badge with `background-color: var(--surface-2)`, `color: var(--text)`, and `1px solid var(--border)`. Font size scales proportionately (`Math.round(size * 0.42)`).
  - Shimmer / Placeholder: While photo is hydrating, an unobtrusive skeleton placeholder prevents initials-to-photo layout flashing.
- **Sizes across views:**
  - Top bar: `size={32}` (compact header link).
  - Sidebar & Mobile Drawer: `size={38}` (footer user summary).
  - Dashboard Greeting: `size={48}` (welcome banner).
  - Profile Page: `size={72}` (prominent identity card).

### Interactive Crop Modal
- Built with HTML5 Canvas (zero external packages).
- **Preview & Guideline:** Square viewport with a circular stencil guide (semi-transparent darkened overlay outside the circle).
- **Controls:**
  - Drag to reposition (mouse move & touch support with boundary clamping).
  - Zoom slider: Range `1x` to `3x` with smooth step increments.
  - Keyboard accessibility: Arrow keys adjust pan by 8px; slider responds to Left/Right arrow keys.
- **Export Specifications:**
  - 256x256 WebP (or JPEG fallback) canvas export at 0.85 quality (~15–60 KB).
  - Canvas rendering automatically strips EXIF metadata (GPS, device info) for user privacy.
- **Profile Edit Actions:**
  - "Change photo" triggers file selector (`accept="image/jpeg,image/png,image/webp"`).
  - "Remove photo" displays confirmation dialog and reverts to initials immediately across all components.
  - Explanatory note: "Photo updates immediately".
