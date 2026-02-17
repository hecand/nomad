/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class TaskSubnav extends Component {
  @service router;
  @service keyboard;

  get fsIsActive() {
    return this.router.currentRouteName === 'allocations.allocation.task.fs';
  }

  get fsRootIsActive() {
    return (
      this.router.currentRouteName === 'allocations.allocation.task.fs-root'
    );
  }

  get filesLinkActive() {
    return this.fsIsActive || this.fsRootIsActive;
  }
}
