/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class ForbiddenMessage extends Component {
  @service token;
  @service store;
  @service router;

  get authMethods() {
    return this.store.findAll('auth-method');
  }
}
