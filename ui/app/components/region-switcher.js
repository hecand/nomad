/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { get, set } from '@ember/object';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default class RegionSwitcher extends Component {
  @service system;
  @service router;
  @service store;
  @service token;

  @computed('system.regions')
  get sortedRegions() {
    return get(this, 'system.regions').toArray().sort();
  }

  async gotoRegion(region) {
    // Note: redundant but as long as we're using PowerSelect, the implicit set('activeRegion')
    // is not something we can await, so we do it explicitly here.
    set(this.system, 'activeRegion', region);
    await get(this, 'token.fetchSelfTokenAndPolicies').perform().catch();

    this.router.transitionTo({ queryParams: { region } });
  }

  get keyCommands() {
    if (this.sortedRegions.length <= 1) {
      return [];
    }
    return this.sortedRegions.map((region, iter) => {
      return {
        label: `Switch to ${region} region`,
        pattern: ['r', `${iter + 1}`],
        action: () => this.gotoRegion(region),
      };
    });
  }
}
