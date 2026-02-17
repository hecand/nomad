/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { get } from '@ember/object';

export default class LifecycleChart extends Component {
  get lifecyclePhases() {
    const tasksOrStates = this.args.taskStates || this.args.tasks;
    const lifecycles = {
      'prestart-ephemerals': [],
      'prestart-sidecars': [],
      'poststart-ephemerals': [],
      'poststart-sidecars': [],
      poststops: [],
      mains: [],
    };

    tasksOrStates.forEach((taskOrState) => {
      const task = taskOrState.task || taskOrState;

      if (task.lifecycleName) {
        lifecycles[`${task.lifecycleName}s`].push(taskOrState);
      }
    });

    const phases = [];
    const stateActiveIterator = (state) => get(state, 'state') === 'running';

    if (lifecycles.mains.length < tasksOrStates.length) {
      phases.push({
        name: 'Prestart',
        isActive: lifecycles['prestart-ephemerals'].some(stateActiveIterator),
      });

      phases.push({
        name: 'Main',
        isActive:
          lifecycles.mains.some(stateActiveIterator) ||
          lifecycles['poststart-ephemerals'].some(stateActiveIterator),
      });

      // Poststart is rendered as a subphase of main and therefore has no independent active state
      phases.push({
        name: 'Poststart',
      });

      phases.push({
        name: 'Poststop',
        isActive: lifecycles.poststops.some(stateActiveIterator),
      });
    }

    return phases;
  }

  get sortedLifecycleTaskStates() {
    return (this.args.taskStates || [])
      .slice()
      .sort((a, b) =>
        getTaskSortPrefix(a.task).localeCompare(getTaskSortPrefix(b.task))
      );
  }

  get sortedLifecycleTasks() {
    return (this.args.tasks || [])
      .slice()
      .sort((a, b) => getTaskSortPrefix(a).localeCompare(getTaskSortPrefix(b)));
  }
}

const lifecycleNameSortPrefix = {
  'prestart-ephemeral': 0,
  'prestart-sidecar': 1,
  main: 2,
  'poststart-sidecar': 3,
  'poststart-ephemeral': 4,
  poststop: 5,
};

function getTaskSortPrefix(task) {
  return `${lifecycleNameSortPrefix[task.lifecycleName]}-${task.name}`;
}
