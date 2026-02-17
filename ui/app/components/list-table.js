/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';

export default class ListTable extends Component {
  // Plan for a future with metadata (e.g., isSelected)
  get decoratedSource() {
    return (this.args.source || []).map((row) => ({
      model: row,
    }));
  }
}
