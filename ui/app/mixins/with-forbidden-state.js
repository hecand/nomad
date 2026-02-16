/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import { set } from '@ember/object';
import Mixin from '@ember/object/mixin';

// eslint-disable-next-line ember/no-new-mixins
export default Mixin.create({
  setupController(controller) {
    if (this.isForbidden) {
      set(this, 'isForbidden', undefined);
      controller.set('isForbidden', true);
    }
    this._super(...arguments);
  },

  resetController(controller) {
    controller.set('isForbidden', false);
    this._super(...arguments);
  },
});
