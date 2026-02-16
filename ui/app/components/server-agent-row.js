/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import { get } from '@ember/object';
import { computed } from '@ember/object';
import { lazyClick } from '../helpers/lazy-click';
import {
  classNames,
  classNameBindings,
  tagName,
} from '@ember-decorators/component';

@tagName('tr')
@classNames('server-agent-row', 'is-interactive')
@classNameBindings('isActive:is-active')
export default class ServerAgentRow extends Component {
  // TODO Switch back to the router service once the service behaves more like Route
  // https://github.com/emberjs/ember.js/issues/15801
  // router: inject.service('router'),
  // eslint-disable-next-line ember/no-private-routing-service
  @service('-routing') _router;
  @alias('_router.router') router;

  agent = null;

  @computed('agent', 'router.currentURL')
  get isActive() {
    // TODO Switch back to the router service once the service behaves more like Route
    // https://github.com/emberjs/ember.js/issues/15801
    // const targetURL = get(this, 'router').urlFor('servers.server', get(this, 'agent'));
    // const currentURL = `${get(this, 'router.rootURL').slice(0, -1)}${get(this, 'router.currentURL')}`;

    const router = this.router;
    const targetURL = router.generate('servers.server', this.agent);
    const currentURL = `${router.get('rootURL').slice(0, -1)}${
      router.get('currentURL').split('?')[0]
    }`;

    // Account for potential URI encoding
    return currentURL.replace(/%40/g, '@') === targetURL.replace(/%40/g, '@');
  }

  goToAgent() {
    const transition = () =>
      this.router.transitionTo('servers.server', this.agent);
    lazyClick([transition, event]);
  }

  click() {
    this.goToAgent();
  }

  @computed('agent.status')
  get agentStatusColor() {
    let agentStatus = get(this, 'agent.status');
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
