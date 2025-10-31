import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    rules: {
      // Variables
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',

      // Functions
      'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      'func-style': 'off', // Disabled - both styles have their place
      'prefer-arrow-callback': 'warn', // Warn only

      // Code Quality
      'no-console': 'off', // Allowed for server-side logging
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'consistent-return': ['error', { treatUndefinedAsUnspecified: false }],
      'default-case': 'error',
      'default-case-last': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-floating-decimal': 'error',
      'no-lone-blocks': 'error',
      'no-multi-spaces': 'error',
      'no-redeclare': 'error',
      'no-return-await': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-useless-catch': 'error',
      'no-useless-return': 'error',
      'require-await': 'warn', // Warn only, as some async functions may be placeholders
      yoda: 'error',

      // Best Practices
      curly: ['error', 'all'],
      'dot-notation': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-implicit-coercion': 'error',
      'no-magic-numbers': [
        'off', // Disabled - too noisy for practical development
      ],
      'no-param-reassign': 'off', // Disabled - sometimes needed for transformations
      'prefer-template': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',

      // ES6+
      'object-shorthand': 'warn', // Warn only, not always clearer
      'prefer-destructuring': 'off', // Disabled - not always clearer
      'arrow-body-style': 'off', // Disabled - explicit returns are often clearer

      // Error Prevention
      'no-await-in-loop': 'warn',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-promise-executor-return': 'error',
      'no-template-curly-in-string': 'error',
      'require-atomic-updates': 'warn', // Warn only - can have false positives

      // Complexity
      complexity: ['warn', 15], // Increased from 10 for practical development
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 5],
    },
  },
  // Test files - allow more nested callbacks for Jest describe/it blocks
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
    rules: {
      'max-nested-callbacks': ['warn', 5], // Allow more nesting in tests
    },
  },
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'build/',
      '*.min.js',
      '.env*',
      '!.env.example',
    ],
  },
];
