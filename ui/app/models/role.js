/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: MPL-2.0
 */

import Model, { attr, hasMany } from '@ember-data/model';

export default class Role extends Model {
  @attr('string') name;
  @attr('string') description;
  @hasMany('policy', { defaultValue: () => [] }) policies;
  @attr() policyNames;
}
