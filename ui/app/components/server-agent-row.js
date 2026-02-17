/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { lazyClick } from '../helpers/lazy-click';

export default class ServerAgentRow extends Component {
  // TODO Switch back to the router service once the service behaves more like Route
  // https://github.com/emberjs/ember.js/issues/15801
  // router: inject.service('router'),
  // eslint-disable-next-line ember/no-private-routing-service
  @service('-routing') _router;
  @alias('_router.router') router;

  get isActive() {
    // TODO Switch back to the router service once the service behaves more like Route
    // https://github.com/emberjs/ember.js/issues/15801
    // const targetURL = this.get('router').urlFor('servers.server', this.get('agent'));
    // const currentURL = `${this.get('router.rootURL').slice(0, -1)}${this.get('router.currentURL')}`;

    const router = this.router;
    const targetURL = router.generate('servers.server', this.args.agent);
    const currentURL = `${router.get('rootURL').slice(0, -1)}${
      router.get('currentURL').split('?')[0]
    }`;

    // Account for potential URI encoding
    return currentURL.replace(/%40/g, '@') === targetURL.replace(/%40/g, '@');
  }

  @action
  handleClick() {
    this.goToAgent();
  }

  @action
  goToAgent() {
    const transition = () =>
      this.router.transitionTo('servers.server', this.args.agent);
    lazyClick([transition, event]);
  }

  get agentStatusColor() {
    let agentStatus = this.args.agent?.get('status') ?? this.args.agent?.status;
    if (agentStatus === 'alive') {
      return 'success';
    } else if (agentStatus === 'failed') {
      return 'critical';
    } else if (agentStatus === 'leaving') {
      return 'neutral';
    } else if (agentStatus === 'left') {
      return 'neutral';
    } else {
      return '';
    }
  }
}
