/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { get } from '@ember/object';

export default class LifecycleChartRow extends Component {
  get taskState() {
    return this.args.taskState;
  }

  get taskStateValue() {
    return this.taskState ? get(this.taskState, 'state') : undefined;
  }

  get taskColor() {
    let color = 'neutral';
    const state = this.taskStateValue;
    if (state === 'running') {
      color = 'success';
    }
    if (state === 'pending') {
      color = 'neutral';
    }
    if (state === 'dead') {
      if (get(this.taskState, 'failed')) {
        color = 'critical';
      } else {
        color = 'neutral';
      }
    }
    return color;
  }

  get taskIcon() {
    let icon;
    const state = this.taskStateValue;
    if (state === 'running') {
      icon = 'running';
    }
    if (state === 'pending') {
      icon = 'test';
    }
    if (state === 'dead') {
      if (get(this.taskState, 'failed')) {
        icon = 'alert-circle';
      } else {
        if (get(this.taskState, 'startedAt')) {
          icon = 'check-circle';
        } else {
          icon = 'minus-circle';
        }
      }
    }

    return icon;
  }

  get activeClass() {
    if (this.taskStateValue === 'running') {
      return 'is-active';
    }

    return undefined;
  }

  get finishedClass() {
    if (this.taskStateValue === 'dead') {
      return 'is-finished';
    }

    return undefined;
  }

  get lifecycleLabel() {
    if (!this.args.task) {
      return '';
    }

    const name = this.args.task.lifecycleName;

    if (name.includes('sidecar')) {
      return 'sidecar';
    } else if (name.includes('ephemeral')) {
      return name.substr(0, name.indexOf('-'));
    } else {
      return name;
    }
  }
}
