/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { isEmpty } from '@ember/utils';

export default class DirectoryEntry extends Component {
  get pathToEntry() {
    const pathWithNoLeadingSlash = this.args.path?.replace(/^\//, '');
    const name = encodeURIComponent(this.args.entry?.Name);

    if (isEmpty(pathWithNoLeadingSlash)) {
      return name;
    } else {
      return `${pathWithNoLeadingSlash}/${name}`;
    }
  }
}
