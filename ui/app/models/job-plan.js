/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Model, { attr, hasMany } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default class JobPlan extends Model {
  @attr() diff;
  @fragmentArray('placement-failure', { defaultValue: () => [] })
  failedTGAllocs;

  @hasMany('allocation') preemptions;

  @attr('string') warnings;
}
