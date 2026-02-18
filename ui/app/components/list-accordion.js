/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { get } from '@ember/object';

export default class ListAccordion extends Component {
  // Not @tracked — this is an internal cache to preserve open/close state
  // across re-renders. The getter re-runs when args change (autotracked).
  _stateCache = [];

  @action
  handleToggle(item, isOpen) {
    this.args.onToggle?.(item, isOpen);
  }

  get decoratedSource() {
    const stateCache = this._stateCache;
    const key = this.args.key || 'id';
    const deepKey = `item.${key}`;
    const startExpanded = this.args.startExpanded;
    const source = this.args.source || [];

    const decoratedSource = source.map((item) => {
      const cacheItem = stateCache.findBy(deepKey, get(item, key));
      return {
        item,
        isOpen: cacheItem ? !!cacheItem.isOpen : startExpanded,
      };
    });

    // eslint-disable-next-line ember/no-side-effects
    this._stateCache = decoratedSource;
    return decoratedSource;
  }
}
