# Assistly Design System

## Overview
Assistly uses a modern, cohesive design system combining Tailwind CSS for rapid UI development and Material-UI for component consistency. The design system is centered on an **Indigo primary brand color** with emerald for secondary actions and amber for highlights.

## Color Palette

### Primary - Indigo (Brand Color)
The main brand color for primary actions, navigation, and emphasis.

- **Main:** `#4f46e5` (Indigo 600)
- **Light:** `#818cf8` (Indigo 400)
- **Dark:** `#3730a3` (Indigo 800)

**Usage:**
- Primary buttons and CTAs
- Navigation highlights
- Form input focus states
- Link text

### Secondary - Emerald (Success, Growth)
Used to indicate positive actions, success states, and community growth.

- **Main:** `#22c55e` (Emerald 500)
- **Light:** `#86efac` (Emerald 300)
- **Dark:** `#15803d` (Emerald 700)

**Usage:**
- Success messages and checkmarks
- Completed tasks
- Helper badges
- Growth indicators

### Accent - Amber (Warnings, Highlights)
Draws attention to important items or warnings without indicating errors.

- **Main:** `#f59e0b` (Amber 500)
- **Light:** `#fbbf24` (Amber 400)
- **Dark:** `#d97706` (Amber 600)

**Usage:**
- Pending or in-progress status
- Important highlights
- Warning messages
- Limited availability indicators

### Neutral - Slate (Backgrounds, Borders)
Provides the foundation for layouts and subtle UI elements.

- **50:** `#f8fafc` (lightest)
- **900:** `#0f172a` (darkest)

**Usage:**
- Backgrounds and containers
- Borders and dividers
- Text hierarchy (secondary/tertiary)
- Disabled states

### Semantic Colors

| Color   | Hex Code | Usage                                    |
|---------|----------|------------------------------------------|
| Success | `#22c55e` | Positive confirmations, successful states |
| Error   | `#ef4444` | Errors, destructive actions               |
| Warning | `#f59e0b` | Alerts, pending states                   |
| Info    | `#3b82f6` | Informational messages, hints             |

## Typography

### Font Family
- **Base:** System stack for better performance
  ```
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, 'Helvetica Neue', sans-serif
  ```
- **Monospace:** For code blocks
  ```
  source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace
  ```

### Font Sizes

| Scale | Size    | Use Case                 |
|-------|---------|--------------------------|
| xs    | 12px    | Small labels, captions   |
| sm    | 14px    | Secondary text           |
| base  | 16px    | Body text (default)      |
| lg    | 18px    | Subheadings, emphasis    |
| xl    | 20px    | Section headings         |
| 2xl   | 24px    | Major sections           |
| 3xl   | 30px    | Page titles              |
| 4xl   | 36px    | Hero headlines           |

### Font Weights

| Weight    | Value |
|-----------|-------|
| Light     | 300   |
| Normal    | 400   |
| Medium    | 500   |
| Semibold  | 600   |
| Bold      | 700   |

## Spacing Scale

Uses an 8px base unit for consistent rhythm throughout the interface.

| Token | Pixels | Usage                                      |
|-------|--------|-------------------------------------------|
| 0     | 0px    | Reset margins/padding                      |
| 1     | 4px    | Tight spacing, small gaps                  |
| 2     | 8px    | Default margin/padding                     |
| 3     | 12px   | Medium spacing                             |
| 4     | 16px   | Standard spacing (default)                 |
| 5     | 20px   | Comfortable spacing                        |
| 6     | 24px   | Section spacing                            |
| 8     | 32px   | Large section spacing                      |
| 10    | 40px   | Extra large spacing                        |
| 12    | 48px   | Major section separation                   |
| 16    | 64px   | Hero and layout sections                   |

## Border Radius

| Token | Value  | Usage                            |
|-------|--------|----------------------------------|
| sm    | 2px    | Subtle rounding                  |
| base  | 4px    | Small elements                   |
| md    | 6px    | Buttons, inputs                  |
| lg    | 8px    | Cards, modals                    |
| xl    | 12px   | Large containers                 |
| 2xl   | 16px   | Featured components              |
| 3xl   | 24px   | Hero sections                    |
| full  | 9999px | Perfect circles, pill shapes     |

## Shadows

Used to establish hierarchy and depth.

| Size  | Use Case                                |
|-------|------------------------------------------|
| none  | Flat, modern aesthetic                   |
| sm    | Subtle elevation, hover states           |
| base  | Standard card and container shadows      |
| md    | Medium elevation, dialog boxes           |
| lg    | High elevation, dropdowns, tooltips      |
| xl    | Modal overlays                           |
| 2xl   | Maximum depth, floating windows          |

## Transitions

Consistent motion for smooth interactions.

| Speed | Duration | Use Case                       |
|-------|----------|--------------------------------|
| fast  | 150ms    | Hover states, quick feedback   |
| base  | 200ms    | Standard interactions          |
| slow  | 300ms    | Complex animations, page transitions |

## Component Guidance

### Buttons
- **Primary:** Indigo background, white text
- **Secondary:** Outlined, indigo borders
- **Success:** Emerald background
- **Danger:** Red background
- **Disabled:** Neutral gray with reduced opacity

### Cards
- Neutral background with subtle shadows
- Padding: 4-6 (16-24px)
- Border radius: lg-xl (8-12px)

### Forms
- Input focus: Indigo primary color ring
- Labels: Semibold, dark gray
- Placeholders: Medium gray
- Validation: Red for errors, green for success

### Navigation
- Primary color for active/hover states
- Smooth transitions (200ms)
- Clear visual hierarchy

### Status Indicators
- **Open/Available:** Indigo
- **In Progress/Claimed:** Amber
- **Completed/Success:** Emerald
- **Closed/Unavailable:** Neutral gray
- **Error/Critical:** Red

## Implementation

### Using Tailwind Classes
```jsx
// Primary button
<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
  Click me
</button>

// Success badge
<span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
  Completed
</span>

// Card
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  Content here
</div>
```

### Using Design System Constants
```jsx
import { COLORS, TYPOGRAPHY, SPACING } from '@/utils/designSystem';

// In styled components or inline styles
const styles = {
  container: {
    backgroundColor: COLORS.primary[50],
    padding: SPACING[4],
    borderRadius: '8px',
  },
  heading: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
};
```

### Using MUI Theme
The Material-UI theme is automatically synchronized with the design system. MUI components will use the primary indigo color and semantic colors defined above.

```jsx
<Button variant="contained" color="primary">
  Primary Action
</Button>

<Alert severity="success">
  Success message
</Alert>
```

## Dark Mode

The design system supports both light and dark modes. Dark mode uses inverted backgrounds and adjusted text colors while maintaining the same color palette for interactive elements.

- **Light mode:** Clean, white backgrounds
- **Dark mode:** Dark slate (900) backgrounds with light text

Both modes are automatically handled by MUI's theme provider in `App.js`.

## Accessibility

- All colors meet WCAG AA contrast ratios for text
- Interactive elements have clear focus states
- Typography hierarchy supports scanning and comprehension
- Sufficient spacing prevents cognitive overload

## Future Enhancements

1. **Build-time Tailwind:** Migrate from CDN to PostCSS for better tree-shaking
2. **Component Library:** Create a comprehensive component library built on this system
3. **Animation System:** Define standard animations for micro-interactions
4. **Responsive Design:** Establish breakpoint strategy for mobile-first design
5. **Theming:** Support custom brand colors and themes for community customization
