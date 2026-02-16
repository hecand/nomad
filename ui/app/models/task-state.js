/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import { computed, get } from '@ember/object';
import { alias, and } from '@ember/object/computed';
import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';
import {
  fragment,
  fragmentOwner,
  fragmentArray,
} from 'ember-data-model-fragments/attributes';

export default class TaskState extends Fragment {
  @fragmentOwner() allocation;

  @attr('string') name;
  @attr('string') state;
  @attr('date') startedAt;
  @attr('date') finishedAt;
  @attr('boolean') failed;
  @attr() paused;

  @and('isActive', 'allocation.isRunning') isRunning;

  @computed('task.kind')
  get isConnectProxy() {
    return (get(this, 'task.kind') || '').startsWith('connect-proxy:');
  }

  @computed('name', 'allocation.taskGroup.tasks.[]')
  get task() {
    const tasks = get(this, 'allocation.taskGroup.tasks');
    return tasks && tasks.findBy('name', this.name);
  }

  @alias('task.driver') driver;

  // TaskState represents a task running on a node, so in addition to knowing the
  // driver via the task, the health of the driver is also known via the node
  @computed('task.driver', 'allocation.node.drivers.[]')
  get driverStatus() {
    const nodeDrivers = get(this, 'allocation.node.drivers') || [];
    return nodeDrivers.findBy('name', get(this, 'task.driver'));
  }

  @fragment('resources') resources;
  @fragmentArray('task-event') events;

  @computed('state')
  get stateClass() {
    const classMap = {
      pending: 'is-pending',
      running: 'is-primary',
      finished: 'is-complete',
      failed: 'is-error',
    };

    return classMap[this.state] || 'is-dark';
  }

  @computed('state')
  get isActive() {
    return this.state === 'running';
  }

  restart() {
    return this.allocation.restart(this.name);
  }

  forcePause() {
    return this.allocation.forcePause(this.name);
  }

  forceRun() {
    return this.allocation.forceRun(this.name);
  }

  reEnableSchedule() {
    return this.allocation.reEnableSchedule(this.name);
  }
}
