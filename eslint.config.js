import tsPlugin from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
  ...tsPlugin.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
