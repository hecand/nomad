/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AccessControlRolesNewRoute extends Route {
  @service abilities;
  @service router;
  @service store;

  beforeModel() {
    if (this.abilities.cannot('write role')) {
      this.router.transitionTo('/administration/roles');
    }
  }

  async model() {
    let role = await this.store.createRecord('role', {
      name: '',
    });
    return {
      role,
      policies: await this.store.findAll('policy'),
    };
  }

  resetController(controller, isExiting) {
    if (isExiting) {
      // If user didn't save, delete the freshly created model
      if (controller.model.role.isNew) {
        controller.model.role.destroyRecord();
      }
    }
  }
}
