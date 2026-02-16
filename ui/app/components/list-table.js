/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { computed } from '@ember/object';
import { computed as overridable } from 'ember-overridable-computed';

export default class ListTable extends Component {
  @overridable(() => []) source;

  // Plan for a future with metadata (e.g., isSelected)
  @computed('args.source.{[],isFulfilled}')
  get decoratedSource() {
    return (this.args.source || []).map((row) => ({
      model: row,
    }));
  }
}
