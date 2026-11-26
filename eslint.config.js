// @ts-check
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: ['projects/**/*', 'www/**/*', 'android/**/*', '.angular/**/*'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      // Components deliberately keep ChangeDetectionStrategy.Eager (pre-Angular-22 behaviour):
      // they mutate plain fields after async storage calls, which OnPush would not re-render.
      // Re-enable once the components are migrated to signals.
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/component-class-suffix': [
        'error',
        {
          suffixes: ['Page', 'Component'],
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended],
    rules: {},
  },
]);
