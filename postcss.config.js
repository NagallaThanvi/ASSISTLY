module.exports = {
  plugins: {
    // Use the @tailwindcss/postcss bridge where required by the installed Tailwind version
    // This ensures Tailwind's JIT and processing are invoked by PostCSS.
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
