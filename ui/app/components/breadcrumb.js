/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

export default class Breadcrumb extends Component {
  @service breadcrumbs;

  constructor() {
    super(...arguments);
    this.register();
  }

  @action register() {
    this.breadcrumbs.registerBreadcrumb(this);
  }

  @action deregister() {
    this.breadcrumbs.deregisterBreadcrumb(this);
  }

  willDestroy() {
    super.willDestroy();
    this.deregister();
  }
}
