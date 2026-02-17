/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';

export default class SortBy extends Component {
  get isActive() {
    return this.args.currentProp === this.args.prop;
  }

  get shouldSortDescending() {
    return !this.isActive || !this.args.sortDescending;
  }
}
