/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';

export default class Browser extends Component {
  get allocation() {
    if (this.args.model?.allocation) {
      return this.args.model.allocation;
    } else {
      return this.args.model;
    }
  }

  get taskState() {
    if (this.args.model?.allocation) {
      return this.args.model;
    }

    return undefined;
  }

  get type() {
    if (this.taskState) {
      return 'task';
    } else {
      return 'allocation';
    }
  }

  get directories() {
    return (this.args.directoryEntries || []).filterBy('IsDir');
  }

  get files() {
    return (this.args.directoryEntries || []).filterBy('IsDir', false);
  }

  get sortedDirectoryEntries() {
    const sortProperty = this.args.sortProperty;

    const directorySortProperty =
      sortProperty === 'Size' ? 'Name' : sortProperty;

    const sortedDirectories = this.directories.sortBy(directorySortProperty);
    const sortedFiles = this.files.sortBy(sortProperty);

    const sortedDirectoryEntries = sortedDirectories.concat(sortedFiles);

    if (this.args.sortDescending) {
      return sortedDirectoryEntries.reverse();
    } else {
      return sortedDirectoryEntries;
    }
  }
}
