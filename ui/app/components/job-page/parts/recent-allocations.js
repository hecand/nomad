/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import PromiseArray from 'nomad-ui/utils/classes/promise-array';

export default class RecentAllocations extends Component {
  @service router;

  sortProperty = 'modifyIndex';
  sortDescending = true;

  @tracked _showSubTasks = null;

  get showSubTasks() {
    if (this._showSubTasks !== null) return this._showSubTasks;
    const persistedValue = window.localStorage.getItem('nomadShowSubTasks');
    return persistedValue ? JSON.parse(persistedValue) : true;
  }

  @action
  toggleShowSubTasks(e) {
    e.preventDefault();
    const newValue = !this.showSubTasks;
    window.localStorage.setItem('nomadShowSubTasks', JSON.stringify(newValue));
    this._showSubTasks = newValue;
  }

  get sortedAllocations() {
    return PromiseArray.create({
      promise: this.args.job.allocations.then((allocations) =>
        allocations.sortBy('modifyIndex').reverse().slice(0, 5)
      ),
    });
  }

  @action
  gotoAllocation(allocation) {
    this.router.transitionTo('allocations.allocation', allocation.id);
  }
}
