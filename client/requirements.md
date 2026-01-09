## Packages
framer-motion | Smooth animations for a premium feel
recharts | Analytics charts for the admin dashboard
clsx | Conditional class merging
tailwind-merge | Class conflict resolution

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  serif: ["'Playfair Display'", "serif"],
  sans: ["'DM Sans'", "sans-serif"],
}
colors: {
  ink: "hsl(var(--ink))",
  navy: "hsl(var(--navy))",
  pink: {
    DEFAULT: "hsl(var(--pink))",
    foreground: "hsl(var(--pink-foreground))",
  }
}
