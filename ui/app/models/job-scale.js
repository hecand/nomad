/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Model, { belongsTo } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default class JobSummary extends Model {
  @belongsTo('job') job;

  @fragmentArray('task-group-scale') taskGroupScales;
}
