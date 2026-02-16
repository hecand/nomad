/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Ember from 'ember';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import { alias } from '@ember/object/computed';
import { task, timeout } from 'ember-concurrency';
import { lazyClick } from '../helpers/lazy-click';

import {
  classNames,
  tagName,
  attributeBindings,
} from '@ember-decorators/component';

@tagName('tr')
@classNames('task-row', 'is-interactive')
@attributeBindings('data-test-task-row')
export default class TaskRow extends Component {
  @service store;
  @service token;
  @service('stats-trackers-registry') statsTrackersRegistry;

  task = null;

  // Internal state
  statsError = false;

  @computed
  get enablePolling() {
    return !Ember.testing;
  }

  // Since all tasks for an allocation share the same tracker, use the registry
  @computed('task.{allocation,isRunning}')
  get stats() {
    if (!get(this, 'task.isRunning')) return undefined;

    return this.statsTrackersRegistry.getTracker(get(this, 'task.allocation'));
  }

  @computed('task.name', 'stats.tasks.[]')
  get taskStats() {
    if (!this.stats) return undefined;

    return get(this, 'stats.tasks').findBy('task', get(this, 'task.name'));
  }

  @alias('taskStats.cpu.lastObject') cpu;
  @alias('taskStats.memory.lastObject') memory;

  onClick() {}

  click(event) {
    lazyClick([this.onClick, event]);
  }

  @(task(function* () {
    do {
      if (this.stats) {
        try {
          yield get(this, 'stats.poll').linked().perform();
          set(this, 'statsError', false);
        } catch (error) {
          set(this, 'statsError', true);
        }
      }

      yield timeout(500);
    } while (this.enablePolling);
  }).drop())
  fetchStats;

  didReceiveAttrs() {
    super.didReceiveAttrs();
    const allocation = get(this, 'task.allocation');

    if (allocation) {
      this.fetchStats.perform();
    } else {
      this.fetchStats.cancelAll();
    }
  }
}
