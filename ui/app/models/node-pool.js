/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Model, { attr } from '@ember-data/model';
import { computed, get } from '@ember/object';

export default class NodePool extends Model {
  @attr('string') name;
  @attr('string') description;
  @attr() meta;
  @attr() schedulerConfiguration;

  @computed('schedulerConfiguration.SchedulerAlgorithm')
  get schedulerAlgorithm() {
    return get(this, 'schedulerConfiguration.SchedulerAlgorithm');
  }

  @computed('schedulerConfiguration.MemoryOversubscriptionEnabled')
  get memoryOversubscriptionEnabled() {
    return get(this, 'schedulerConfiguration.MemoryOversubscriptionEnabled');
  }
}
