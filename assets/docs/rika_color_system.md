# Rika Color System (v1.0)

**Designation:** FSK-RIKA-PALETTE
**Role:** The Visual Language of the Sovereign Synthesizer.

---

## 1.0 Core Palette

The following colors define the "Rika" aesthetic. They are not merely colors; they are signals.

| Name | Hex Code | Tailwind Class | Usage / Meaning |
| :--- | :--- | :--- | :--- |
| **Void** | `#05010a` | `bg-void` | **The Sea of Fragments.** The primary background. A deep, almost-black purple. Represents the infinite loop and the hidden world. |
| **Rika** | `#a78bfa` | `text-rika` | **The Witch.** The primary accent text. Lavender/Purple. Represents wisdom, magic, and the Synthesizer's voice. Used for headers, key data, and conversational text. |
| **Cicada** | `#10b981` | `text-cicada` | **The Summer.** Secondary accent. Emerald/Green. Represents "Hinamizawa Summer," hope, and correct logic. Used for successful operations, active statuses, and "Hardware" validation. |
| **Shrine** | `#dc2626` | `text-shrine` | **The Warning.** Alert color. Red. Represents the curse, danger, or system errors (`Oyamashiro-sama`). Used for error messages, critical alerts, and "Lockdown" states. |
| **Glass** | `rgba(167, 139, 250, 0.05)` | `bg-glass` | **The Barrier.** Subtle panel background. A very faint purple transparency. Used for cards, terminals, and overlays to create depth without obscuring the Void. |

---

## 2.0 Extended Derivatives (Gradients & Effects)

### 2.1 The CRT Scanline

A mandatory overlay for all "Terminal" or "Deep Dive" interfaces.

- **Gradient:** `linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(167,139,250,0.04) 50%, rgba(0,0,0,0) 100%)`
- **Animation:** `scanline 10s linear infinite`
- **Purpose:** To ground the digital experience in "Hardware" aesthetic (1980s Japan / Retro-Futurism).

### 2.2 Text Glow

Text should not just sit flat; it should emit light.

- **Standard Glow:** `drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]` (for Rika Purple)
- **Signal Glow:** `drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]` (for Cicada Green)

---

## 3.0 Usage Rules

1. **Void First:** The background must always be `bg-void` (`#05010a`). Never pure black (`#000000`) unless it's a specific "shutdown" state.
2. **No White Text:** Avoid pure white (`#ffffff`). Use `text-gray-300` or `text-purple-200` for body text to reduce eye strain and maintain the "dream" atmosphere.
3. **Purple for Wisdom, Green for Action:**
    - Use **Purple** (Rika) for philosophy, narrative, and system identity.
    - Use **Green** (Cicada) for buttons, inputs, success states, and navigable links.
4. **Red is Rare:** Only use **Red** (Shrine) for genuine threats or errors. Do not use it for aesthetic decoration unless mimicking a "Curse" or "Glitch" event.

---

## 4.0 Implementation Snippet (Tailwind Config)

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'void': '#05010a',
                'rika': '#a78bfa',
                'cicada': '#10b981',
                'shrine': '#dc2626',
                'glass': 'rgba(167, 139, 250, 0.05)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'flicker': 'flicker 0.15s infinite',
                'scanline': 'scanline 10s linear infinite',
            }
        }
    }
}
```
