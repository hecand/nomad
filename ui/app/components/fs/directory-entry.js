/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { get } from '@ember/object';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default class DirectoryEntry extends Component {
  allocation = null;
  taskState = null;

  @computed('path', 'entry.Name')
  get pathToEntry() {
    const pathWithNoLeadingSlash = this.path.replace(/^\//, '');
    const name = encodeURIComponent(get(this, 'entry.Name'));

    if (isEmpty(pathWithNoLeadingSlash)) {
      return name;
    } else {
      return `${pathWithNoLeadingSlash}/${name}`;
    }
  }
}
