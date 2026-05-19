// .prettierrc.mjs

/** @type {import('prettier').Config} */
const config = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  bracketSpacing: true,
  arrowParens: 'always',

  // 중요
  proseWrap: 'preserve',
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
