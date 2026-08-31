import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'docs/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Appendix B: deprecated event aliases must never appear as new canonical producers.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "Literal[value=/^(ActorBlocked|ActorUnblocked|UserReported|ContentReported|MessageDeliveryConfirmed|MatchCompleted|DatasetLocked|DatasetLockConfirmed|SafetyEventDetected|ProtocolAmended)$/]",
          message:
            'Deprecated event alias (Appendix B / ADR-S001..S006). Use the canonical event name; aliases are allowed only inside the versioned translation layer.',
        },
      ],
    },
  },
  {
    files: ['**/test/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    /*
     * The contact relay runs on Cloudflare Workers, not on Node and not in
     * a browser, so `Response` and `fetch` are its runtime's globals and
     * eslint has no way to know that from the file alone. Declared rather
     * than silenced with a disable comment: a comment would also hide the
     * next genuinely undefined name in this file.
     */
    files: ['contact-worker/**/*.js'],
    languageOptions: {
      globals: {
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    files: ['**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
      },
    },
  },
);
