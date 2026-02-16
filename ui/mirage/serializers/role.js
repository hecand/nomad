/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  serializeIds: 'always',

  serialize() {
    var json = ApplicationSerializer.prototype.serialize.apply(this, arguments);
    if (json instanceof Array) {
      json.forEach(serializeRole);
    } else {
      serializeRole(json);
    }
    return json;
  },
});

function serializeRole(role) {
  role.Policies = (role.Policies || []).map((policy) => {
    return { ID: policy, Name: policy };
  });
  delete role.PolicyIDs;
  return role;
}
