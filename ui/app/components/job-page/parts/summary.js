/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class Summary extends Component {
  @service router;

  @tracked _expandedOverride = null;

  get isExpanded() {
    if (this.args.forceCollapsed) return false;
    if (this._expandedOverride !== null) return this._expandedOverride;

    const storageValue = window.localStorage.nomadExpandJobSummary;
    return storageValue != null ? JSON.parse(storageValue) : true;
  }

  @action
  persist(item, isOpen) {
    window.localStorage.nomadExpandJobSummary = isOpen;
    this._expandedOverride = isOpen;
  }
}
