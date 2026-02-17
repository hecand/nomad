/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import moment from 'moment';

export default class JobVersionsStream extends Component {
  get annotatedVersions() {
    const versions = (this.args.versions || []).sortBy('submitTime').reverse();
    return versions.map((version, index) => {
      const meta = {};

      if (index === 0) {
        meta.showDate = true;
      } else {
        const previousVersion = versions.objectAt(index - 1);
        const previousStart = moment(previousVersion.get('submitTime')).startOf(
          'day'
        );
        const currentStart = moment(version.get('submitTime')).startOf('day');
        if (previousStart.diff(currentStart, 'days') > 0) {
          meta.showDate = true;
        }
      }

      const diff = (this.args.diffs || []).objectAt(index);
      return { version, meta, diff };
    });
  }
}
