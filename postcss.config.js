import process from "node:process";

export default {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
    "postcss-preset-env": {
      stage: 2,
      features: {
        "nesting-rules": false,
      },
    },
    cssnano: {
      preset: [
        "default",
        {
          discardComments: { removeAll: true },
          normalizeWhitespace: process.env.NODE_ENV === "production",
          colormin: process.env.NODE_ENV === "production" || false,
        },
      ],
    },
  },
};
