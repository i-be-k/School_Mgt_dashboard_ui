import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        lopeSky: "#c3ebfa",
        // lopeYellow: "#fae27c",
        lopeRose: "#ffccd3",
        lopeRoseLight: "#fff1f2",
        lopeEmerald: "#a4f4cf",
        lopeEmeraldLight: "#ecfdf5",
        lopeAmber: "#fee685",
        lopeAmberLight: "#fffbeb",
      },
    },
  },
  plugins: [],
};
export default config;
