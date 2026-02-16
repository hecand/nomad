/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { equal, or } from '@ember/object/computed';

export default class TaskSubnav extends Component {
  @service router;
  @service keyboard;

  @equal('router.currentRouteName', 'allocations.allocation.task.fs')
  fsIsActive;

  @equal('router.currentRouteName', 'allocations.allocation.task.fs-root')
  fsRootIsActive;

  @or('fsIsActive', 'fsRootIsActive')
  filesLinkActive;
}
