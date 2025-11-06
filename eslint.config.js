import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Ignore patterns
  {
    ignores: ['dist', 'node_modules', 'coverage', 'build']
  },

  // Backend Node.js files (server-side)
  {
    files: [
      'src/server.js',
      'src/config/**/*.js',
      'src/db/**/*.js',
      'src/middleware/**/*.js',
      'src/routes/**/*.js',
      'src/services/**/*.js',
      'src/utils/**/*.js',
      'scripts/**/*.js',
      'migrations/**/*.js',
      'knexfile.js',
      'jest.config.js',
      'examples/**/*.js',
      'api/**/*.js'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }]
    }
  },

  // Test files
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2021
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }]
    }
  },

  // Frontend React files
  {
    files: ['src/**/*.{jsx,tsx}', 'src/App.jsx', 'src/main.jsx', 'src/components/**/*.jsx', 'src/pages/**/*.jsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^(React|_)',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  }
]
