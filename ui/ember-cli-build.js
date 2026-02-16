/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const environment = EmberApp.env();
const isProd = environment === 'production';
const isTest = environment === 'test';

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    codemirror: {
      modes: ['javascript', 'ruby'],
    },
    'ember-cli-babel': {
      includePolyfill: isProd,
    },
    hinting: isTest,
    tests: isTest,
    sassOptions: {
      precision: 4,
      includePaths: [
        './node_modules/bulma',
        './node_modules/@hashicorp/design-system-tokens/dist/products/css',
        './node_modules/@hashicorp/design-system-components/dist/styles',
        './node_modules/ember-basic-dropdown/vendor',
        './node_modules/ember-power-select/vendor',
        './node_modules/bulma/sass',
      ],
    },

    // Add options here
  });

  app.import('node_modules/xterm/css/xterm.css');
  app.import('node_modules/codemirror/lib/codemirror.css');

  return app.toTree();
};
