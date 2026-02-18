/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { debounce } from '@ember/runloop';

export default class SearchBox extends Component {
  @tracked _searchTerm = this.args.searchTerm;

  // Used to throttle sets to searchTerm
  get debounceInterval() {
    return this.args.debounce ?? 150;
  }

  @action
  setSearchTerm(e) {
    this._searchTerm = e.target.value;
    debounce(this, this._updateSearch, this.debounceInterval);
  }

  @action
  clear() {
    this._searchTerm = '';
    debounce(this, this._updateSearch, this.debounceInterval);
  }

  _updateSearch() {
    const newTerm = this._searchTerm;
    this.args.onChange?.(newTerm);
  }
}
