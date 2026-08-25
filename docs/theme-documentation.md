# Pulse Ops - Theme Documentation

## Overview

This document defines the complete design system for Pulse Ops HRM, extracted from the admin dashboard prototype. The theme uses Tailwind CSS for styling and Shadcn/ui for component primitives.

---

## Color Palette

### Primary Colors

| Color             | Hex       | Tailwind Class  | Usage                                    |
| ----------------- | --------- | --------------- | ---------------------------------------- |
| **Primary Blue**  | `#1976D2` | `primary`       | Main brand color, primary buttons, links |
| **Primary Dark**  | `#0D47A1` | `primary-dark`  | Hover states, gradients                  |
| **Primary Light** | `#42A5FA` | `primary-light` | Backgrounds, subtle highlights           |

### Accent Colors

| Color             | Hex       | Tailwind Class | Usage                              |
| ----------------- | --------- | -------------- | ---------------------------------- |
| **Accent Orange** | `#FF9800` | `accent`       | Active states, highlights, borders |
| **Accent Light**  | `#FFB74D` | `accent-light` | Hover states                       |

### Status Colors

| Color              | Hex       | Tailwind Class  | Usage                           |
| ------------------ | --------- | --------------- | ------------------------------- |
| **Success Green**  | `#43A047` | `success`       | Success messages, active status |
| **Success Light**  | `#66BB6A` | `success-light` | Success backgrounds             |
| **Warning Orange** | `#FB8C00` | `warning`       | Warnings, pending status        |
| **Warning Light**  | `#FFA726` | `warning-light` | Warning backgrounds             |
| **Error Red**      | `#E53935` | `error`         | Errors, inactive status         |
| **Error Light**    | `#EF5350` | `error-light`   | Error backgrounds               |
| **Info Blue**      | `#2196F3` | `info`          | Information, neutral actions    |

### Neutral Colors

| Color              | Hex       | Tailwind Class   | Usage                       |
| ------------------ | --------- | ---------------- | --------------------------- |
| **Background**     | `#F5F7FA` | `background`     | Page background             |
| **Surface**        | `#FFFFFF` | `surface`        | Card backgrounds            |
| **Text Primary**   | `#2C3E50` | `text-primary`   | Main text                   |
| **Text Secondary** | `#78909C` | `text-secondary` | Secondary text, labels      |
| **Text Tertiary**  | `#546E7A` | `text-tertiary`  | Disabled text, placeholders |
| **Border**         | `#E0E0E0` | `border`         | Borders, dividers           |
| **Border Light**   | `#F0F0F0` | `border-light`   | Subtle borders              |

---

## Typography

### Font Family

- **Primary**: Inter
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### Font Sizes & Weights

| Element   | Size | Weight | Line Height | Tailwind Class              |
| --------- | ---- | ------ | ----------- | --------------------------- |
| **H1**    | 28px | 700    | 1.2         | `text-3xl font-bold`        |
| **H2**    | 24px | 600    | 1.3         | `text-2xl font-semibold`    |
| **H3**    | 20px | 600    | 1.4         | `text-xl font-semibold`     |
| **H4**    | 18px | 600    | 1.4         | `text-lg font-semibold`     |
| **H5**    | 16px | 500    | 1.5         | `text-base font-medium`     |
| **H6**    | 14px | 500    | 1.5         | `text-sm font-medium`       |
| **Body**  | 14px | 400    | 1.5         | `text-sm`                   |
| **Small** | 12px | 400    | 1.4         | `text-xs`                   |
| **Tiny**  | 10px | 600    | 1.3         | `text-[10px] font-semibold` |

---

## Spacing System

Based on 8px grid system:

| Size   | Value | Tailwind Class |
| ------ | ----- | -------------- |
| **0**  | 0px   | `0`            |
| **1**  | 4px   | `1`            |
| **2**  | 8px   | `2`            |
| **3**  | 12px  | `3`            |
| **4**  | 16px  | `4`            |
| **5**  | 20px  | `5`            |
| **6**  | 24px  | `6`            |
| **8**  | 32px  | `8`            |
| **10** | 40px  | `10`           |
| **12** | 48px  | `12`           |

---

## Border Radius

| Size       | Value  | Tailwind Class | Usage           |
| ---------- | ------ | -------------- | --------------- |
| **Small**  | 6px    | `rounded-md`   | Buttons, inputs |
| **Medium** | 8px    | `rounded-lg`   | Cards, modals   |
| **Large**  | 12px   | `rounded-xl`   | Large cards     |
| **Full**   | 9999px | `rounded-full` | Avatars, pills  |

---

## Shadows

| Level      | CSS                               | Tailwind Class   | Usage            |
| ---------- | --------------------------------- | ---------------- | ---------------- |
| **Small**  | `0 2px 4px rgba(0,0,0,0.05)`      | `shadow-sm`      | Subtle elevation |
| **Medium** | `0 2px 8px rgba(0,0,0,0.08)`      | `shadow-md`      | Cards, dropdowns |
| **Large**  | `0 8px 20px rgba(0,0,0,0.12)`     | `shadow-lg`      | Modals, popovers |
| **Hover**  | `0 4px 12px rgba(33,150,243,0.4)` | `shadow-primary` | Button hover     |

---

## Component Patterns

### Buttons

#### Primary Button

```tsx
className =
  "bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-md font-medium hover:shadow-primary transition-all duration-300";
```

#### Secondary Button

```tsx
className =
  "bg-white text-primary border-2 border-primary px-5 py-2.5 rounded-md font-medium hover:bg-primary hover:text-white transition-all duration-300";
```

### Cards

#### Standard Card

```tsx
className =
  "bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300";
```

#### Stat Card

```tsx
className =
  "bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-primary";
```

### Badges

#### Status Badge - Active

```tsx
className =
  "px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success";
```

#### Status Badge - Pending

```tsx
className =
  "px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning";
```

#### Status Badge - Inactive

```tsx
className =
  "px-3 py-1 rounded-full text-xs font-semibold bg-error/10 text-error";
```

### Inputs

#### Text Input

```tsx
className =
  "w-full px-4 py-2.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
```

### Navigation

#### Sidebar Item

```tsx
className =
  "flex items-center gap-4 px-6 py-3.5 text-white hover:bg-white/10 border-l-4 border-transparent hover:border-accent transition-all duration-300";
```

#### Active Sidebar Item

```tsx
className =
  "flex items-center gap-4 px-6 py-3.5 text-white bg-white/15 border-l-4 border-accent font-semibold";
```

---

## Gradients

### Primary Gradient

```css
background: linear-gradient(180deg, #1976d2 0%, #0d47a1 100%);
```

Tailwind: `bg-gradient-to-b from-primary to-primary-dark`

### Button Gradient

```css
background: linear-gradient(135deg, #2196f3, #1976d2);
```

Tailwind: `bg-gradient-to-br from-info to-primary`

### Card Accent Gradient

```css
background: linear-gradient(90deg, #2196f3, #1976d2);
```

Tailwind: `bg-gradient-to-r from-info to-primary`

---

## Animations & Transitions

### Standard Transition

```tsx
className = "transition-all duration-300";
```

### Hover Lift

```tsx
className = "hover:-translate-y-1 transition-transform duration-300";
```

### Fade In

```tsx
className = "animate-in fade-in duration-300";
```

---

## Responsive Breakpoints

| Breakpoint  | Min Width | Tailwind Prefix |
| ----------- | --------- | --------------- |
| **Mobile**  | 0px       | (default)       |
| **Tablet**  | 768px     | `md:`           |
| **Desktop** | 1024px    | `lg:`           |
| **Large**   | 1280px    | `xl:`           |
| **XL**      | 1536px    | `2xl:`          |

---

## Usage Examples

### Dashboard Card

```tsx
<div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-success">
  <div className="flex justify-between items-start mb-4">
    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success text-2xl">
      <CheckIcon />
    </div>
  </div>
  <div className="text-3xl font-bold text-primary mb-1">142</div>
  <div className="text-sm text-secondary">Employees Present Today</div>
  <div className="flex items-center gap-1 mt-2 text-xs text-success">
    <ArrowUpIcon className="w-3 h-3" />
    5.2% from yesterday
  </div>
</div>
```

### Login Form

```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-primary mb-2">
      Email Address
    </label>
    <input
      type="email"
      className="w-full px-4 py-2.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      placeholder="admin@pulseops.com"
    />
  </div>
  <button className="w-full bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-md font-medium hover:shadow-primary transition-all duration-300">
    Sign In
  </button>
</form>
```

---

## Design Principles

1. **Consistency**: Use the defined color palette and spacing system throughout
2. **Hierarchy**: Establish clear visual hierarchy with typography and spacing
3. **Feedback**: Provide immediate visual feedback for user interactions
4. **Accessibility**: Maintain WCAG 2.1 AA contrast ratios
5. **Performance**: Use CSS transitions over JavaScript animations
6. **Responsiveness**: Mobile-first approach with progressive enhancement

---

## Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
- **Shadcn/ui Components**: https://ui.shadcn.com
- **Lucide Icons**: https://lucide.dev
- **Inter Font**: https://fonts.google.com/specimen/Inter
