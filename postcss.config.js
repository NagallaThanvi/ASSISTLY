module.exports = {
  plugins: [
    // Using require-forms to be compatible with different PostCSS loaders
    require('@tailwindcss/postcss')(),
    require('autoprefixer')(),
  ],
};
