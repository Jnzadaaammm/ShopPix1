import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => ({
  opacityValue,
}: {
  opacityValue: number | string | undefined;
}) => {
  if (opacityValue !== undefined) return `rgb(var(${variable}) / ${opacityValue})`;
  return `rgb(var(${variable}))`;
};

const brandColors = {
  50: withOpacity("--color-brand-50"),
  100: withOpacity("--color-brand-100"),
  200: withOpacity("--color-brand-200"),
  300: withOpacity("--color-brand-300"),
  400: withOpacity("--color-brand-400"),
  500: withOpacity("--color-brand-500"),
  600: withOpacity("--color-brand-600"),
  700: withOpacity("--color-brand-700"),
  800: withOpacity("--color-brand-800"),
  900: withOpacity("--color-brand-900"),
};

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: brandColors as any,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
