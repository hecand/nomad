/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { formatBytes, formatHertz } from 'nomad-ui/utils/units';

export default class AllocationStat extends Component {
  get metric() {
    return this.args.metric ?? 'memory';
  }

  get statClass() {
    return this.metric === 'cpu' ? 'is-info' : 'is-danger';
  }

  get cpu() {
    return this.args.statsTracker?.cpu?.lastObject;
  }

  get memory() {
    return this.args.statsTracker?.memory?.lastObject;
  }

  get stat() {
    const { metric } = this;
    if (metric === 'cpu') return this.cpu;
    if (metric === 'memory') return this.memory;
    return undefined;
  }

  get formattedStat() {
    if (!this.stat) return undefined;
    if (this.metric === 'memory') return formatBytes(this.stat.used);
    if (this.metric === 'cpu') return formatHertz(this.stat.used, 'MHz');
    return undefined;
  }

  get formattedReserved() {
    if (this.metric === 'memory')
      return formatBytes(this.args.statsTracker?.reservedMemory, 'MiB');
    if (this.metric === 'cpu')
      return formatHertz(this.args.statsTracker?.reservedCPU, 'MHz');
    return undefined;
  }
}
