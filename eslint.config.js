import { baseWithPrettierConfig } from '@enormora/eslint-config-base-with-prettier';
import { browserConfig } from '@enormora/eslint-config-browser';
import { reactTsxConfig } from '@enormora/eslint-config-react-tsx';
import { noTsEnumDeclarationRestriction, typescriptConfig } from '@enormora/eslint-config-typescript';
import { vitestNodeAssertConfig } from '@enormora/eslint-config-vitest-node-assert';
import eslintConfigPrettier from 'eslint-config-prettier';

const entryPointTypeScriptFiles = ['src/main.tsx'];
const maxLinesPerFile = 500;
const runtimeGlobalMessage =
  'Runtime globals belong at the composition root. Pass the value or a capability into application code.';
const maybeAbsenceMessage =
  'Do not use null or undefined. Model absence with True Myth Maybe: ' +
  'import { just, nothing, of } from "true-myth/maybe".';
const noNullLiteralRestriction = {
  selector: 'Literal[raw="null"]',
  message: maybeAbsenceMessage
};
const noVoidRestriction = {
  selector: 'UnaryExpression[operator="void"]',
  message: maybeAbsenceMessage
};
const tryCatchMessage =
  'Do not write try/catch. Wrap fetch and other throwing APIs with fromPromise or tryOrElse so failure stays in Result or Task.';
const tryCatchRestriction = {
  selector: 'TryStatement',
  message: tryCatchMessage
};
const restrictedRuntimeGlobals = [
  { name: 'document', message: runtimeGlobalMessage },
  { name: 'event', message: 'Use the event argument passed to the handler.' },
  { name: 'globalThis', message: runtimeGlobalMessage },
  { name: 'history', message: runtimeGlobalMessage },
  { name: 'localStorage', message: runtimeGlobalMessage },
  { name: 'location', message: runtimeGlobalMessage },
  { name: 'navigator', message: runtimeGlobalMessage },
  { name: 'sessionStorage', message: runtimeGlobalMessage },
  { name: 'undefined', message: maybeAbsenceMessage },
  { name: 'window', message: runtimeGlobalMessage }
];
const fetchGlobalMessage = 'Inject fetch into the adapter factory. Do not call the global fetch.';
const typescriptRestrictedTypes = typescriptConfig.rules['@typescript-eslint/no-restricted-types'][1].types;

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'package-lock.json', 'coverage/**/*']
  },
  ...baseWithPrettierConfig,
  {
    ...browserConfig,
    files: ['src/**/*.{ts,tsx}']
  },
  {
    ...typescriptConfig,
    files: ['**/*.{ts,tsx}']
  },
  {
    ...reactTsxConfig,
    files: ['**/*.tsx'],
    settings: {
      ...reactTsxConfig.settings,
      react: {
        version: '19.3'
      }
    }
  },
  {
    files: ['eslint.config.js', 'prettier.config.js', 'vite.config.ts'],
    rules: {
      'import/no-default-export': 'off'
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_$',
          ignoreRestSiblings: true,
          vars: 'all'
        }
      ],
      'eslint-comments/no-restricted-disable': ['error', '*'],
      'eslint-comments/no-use': [
        'error',
        {
          allow: []
        }
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          cjs: 'never',
          cts: 'never',
          js: 'never',
          json: 'always',
          jsx: 'never',
          mjs: 'never',
          mts: 'never',
          ts: 'never',
          tsx: 'never'
        }
      ],
      'no-restricted-globals': [
        'error',
        {
          checkGlobalObject: true,
          globalObjects: ['global', 'window'],
          globals: restrictedRuntimeGlobals
        }
      ],
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            ...typescriptRestrictedTypes,
            null: { message: maybeAbsenceMessage },
            undefined: { message: maybeAbsenceMessage }
          }
        }
      ],
      'restricted-syntax-typescript/no-ts-enum-declaration': 'off',
      'no-barrel-files/no-barrel-files': 'error',
      'no-barrel-files/prefer-source-imports': 'error',
      'no-restricted-syntax': [
        'error',
        noNullLiteralRestriction,
        noVoidRestriction,
        noTsEnumDeclarationRestriction,
        tryCatchRestriction
      ]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', ...entryPointTypeScriptFiles],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message: 'Pass a timestamp or inject a clock. Do not call Date.now() in application code.'
        }
      ],
      'no-restricted-globals': [
        'error',
        {
          checkGlobalObject: true,
          globalObjects: ['global', 'window'],
          globals: [...restrictedRuntimeGlobals, { name: 'fetch', message: fetchGlobalMessage }]
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
          message: 'new Date() reads the clock. Pass an explicit timestamp into the constructor.'
        },
        {
          selector: 'CallExpression[callee.name="setTimeout"]',
          message: 'Inject a clock and call its setTimeout. Do not use the runtime timer here.'
        },
        {
          selector: 'CallExpression[callee.name="setInterval"]',
          message: 'Inject a clock and call its setInterval. Do not use the runtime timer here.'
        },
        noNullLiteralRestriction,
        noVoidRestriction,
        noTsEnumDeclarationRestriction,
        tryCatchRestriction
      ]
    }
  },
  {
    files: entryPointTypeScriptFiles,
    rules: {
      'no-restricted-globals': 'off'
    }
  },
  {
    ...vitestNodeAssertConfig,
    files: ['**/*.test.ts', '**/*.test.tsx']
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        assert: 'off',
        describe: 'off',
        expect: 'off',
        it: 'off',
        screen: 'off',
        test: 'off'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx,js}'],
    rules: {
      'max-lines': ['error', maxLinesPerFile]
    }
  },
  eslintConfigPrettier
];
