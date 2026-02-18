/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';

export default class JobDiff extends Component {
  get isEdited() {
    return this.args.diff?.Type === 'Edited';
  }

  get isAdded() {
    return this.args.diff?.Type === 'Added';
  }

  get isDeleted() {
    return this.args.diff?.Type === 'Deleted';
  }
}
