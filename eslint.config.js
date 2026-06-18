// eslint.config.js — ESLint v9 flat config (replaces .eslintrc.json)
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ─── Files to ignore ──────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
    ],
  },

  // ─── Base TypeScript rules for all .ts/.tsx files ─────────
  ...tseslint.configs.recommended,

  {
    rules: {
      // Error on unused variables — catches bugs early
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Warn on any — sometimes needed, but should be rare
      '@typescript-eslint/no-explicit-any': 'warn',

      // Warn on console.log — should use a logger in production
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Require explicit return types on functions — good for readability
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow empty interfaces (common in React Native)
      '@typescript-eslint/no-empty-interface': 'off',
    },
  }
);
