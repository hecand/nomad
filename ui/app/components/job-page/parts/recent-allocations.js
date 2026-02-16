/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { action, computed, get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import PromiseArray from 'nomad-ui/utils/classes/promise-array';
import { classNames } from '@ember-decorators/component';

import localStorageProperty from 'nomad-ui/utils/properties/local-storage';

@classNames('boxed-section')
export default class RecentAllocations extends Component {
  @service router;

  sortProperty = 'modifyIndex';
  sortDescending = true;

  @localStorageProperty('nomadShowSubTasks', true) showSubTasks;

  @action
  toggleShowSubTasks(e) {
    e.preventDefault();
    set(this, 'showSubTasks', !get(this, 'showSubTasks'));
  }

  @computed('job.allocations.@each.modifyIndex')
  get sortedAllocations() {
    return PromiseArray.create({
      promise: get(this, 'job.allocations').then((allocations) =>
        allocations.sortBy('modifyIndex').reverse().slice(0, 5)
      ),
    });
  }

  @action
  gotoAllocation(allocation) {
    this.router.transitionTo('allocations.allocation', allocation.id);
  }
}
