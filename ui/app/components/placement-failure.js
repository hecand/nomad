/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { or } from '@ember/object/computed';

export default class PlacementFailure extends Component {
  // Either provide a taskGroup or a failedTGAlloc
  taskGroup = null;
  failedTGAlloc = null;

  @or('taskGroup.placementFailures', 'failedTGAlloc') placementFailures;
}
