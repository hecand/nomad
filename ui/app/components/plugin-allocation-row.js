/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import { attributeBindings } from '@ember-decorators/component';
import { set } from '@ember/object';
import AllocationRow from 'nomad-ui/components/allocation-row';

@attributeBindings(
  'data-test-controller-allocation',
  'data-test-node-allocation'
)
export default class PluginAllocationRow extends AllocationRow {
  pluginAllocation = null;
  allocation = null;

  didReceiveAttrs() {
    // Allocation is always set through pluginAllocation
    set(this, 'allocation', null);
    this.setAllocation();
  }

  // The allocation for the plugin's controller or storage plugin needs
  // to be imperatively fetched since these plugins are Fragments which
  // can't have relationships.
  async setAllocation() {
    if (this.pluginAllocation && !this.allocation) {
      const allocation = await this.pluginAllocation.getAllocation();
      if (!this.isDestroyed) {
        set(this, 'allocation', allocation);
        this.updateStatsTracker();
      }
    }
  }
}
