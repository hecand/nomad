/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class RegionSwitcher extends Component {
  @service system;
  @service router;
  @service store;
  @service token;

  get sortedRegions() {
    return (this.system.regions || []).toArray().sort();
  }

  @action
  async gotoRegion(region) {
    this.system.set('activeRegion', region);
    await this.token.fetchSelfTokenAndPolicies.perform().catch();

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
