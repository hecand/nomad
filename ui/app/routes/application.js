/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

/* eslint-disable ember/no-controller-access-in-routes */
import { inject as service } from '@ember/service';
import { later, next } from '@ember/runloop';
import Route from '@ember/routing/route';
import { AbortError } from '@ember-data/adapter/error';
import RSVP from 'rsvp';
import { action, get, set } from '@ember/object';

import { handleRouteRedirects } from '../utils/route-redirector';

export default class ApplicationRoute extends Route {
  @service config;
  @service system;
  @service store;
  @service token;
  @service router;

  queryParams = {
    region: {
      refreshModel: true,
    },
  };

  resetController(controller, isExiting) {
    if (isExiting) {
      controller.set('error', null);
    }
  }

  async beforeModel(transition) {
    if (handleRouteRedirects(transition, this.router)) {
      return;
    }

    let promises;

    // service:router#transitionTo can cause this to rerun because of refreshModel on
    // the region query parameter, this skips rerunning the detection/loading queries.
    if (transition.queryParamsOnly) {
      promises = Promise.resolve(true);
    } else {
      let exchangeOneTimeToken;

      if (transition.to.queryParams.ott) {
        exchangeOneTimeToken = this.token.exchangeOneTimeToken(
          transition.to.queryParams.ott
        );
      } else {
        exchangeOneTimeToken = Promise.resolve(true);
      }

      try {
        await exchangeOneTimeToken;
      } catch (e) {
        this.controllerFor('application').set('error', e);
      }

      const fetchSelfTokenAndPolicies = await get(
        this,
        'token.fetchSelfTokenAndPolicies'
      )
        .perform()
        .catch();

      const fetchLicense = get(this, 'system.fetchLicense').perform().catch();

      const checkFuzzySearchPresence = get(
        this,
        'system.checkFuzzySearchPresence'
      )
        .perform()
        .catch();

      promises = await RSVP.all([
        get(this, 'system.regions'),
        get(this, 'system.defaultRegion'),
        fetchLicense,
        fetchSelfTokenAndPolicies,
        checkFuzzySearchPresence,
      ]);
    }

    if (!get(this, 'system.shouldShowRegions')) return promises;

    const queryParam = transition.to.queryParams.region;
    const defaultRegion = get(this, 'system.defaultRegion.region');
    const currentRegion = get(this, 'system.activeRegion') || defaultRegion;

    // Only reset the store if the region actually changed
    if (
      (queryParam && queryParam !== currentRegion) ||
      (!queryParam && currentRegion !== defaultRegion)
    ) {
      this.store.unloadAll();
    }

    set(this, 'system.activeRegion', queryParam || defaultRegion);

    return promises;
  }

  // Model is being used as a way to propagate the region and
  // one time token query parameters for use in setupController.
  model(
    { region },
    {
      to: {
        queryParams: { ott },
      },
    }
  ) {
    return {
      region,
      hasOneTimeToken: ott,
    };
  }

  setupController(controller, { region, hasOneTimeToken }) {
    if (region === get(this, 'system.defaultRegion.region')) {
      next(() => {
        controller.set('region', null);
      });
    }

    super.setupController(...arguments);

    if (hasOneTimeToken) {
      // Hack to force clear the OTT query parameter
      later(() => {
        controller.set('oneTimeToken', '');
      }, 500);
    }
  }

  @action
  didTransition() {
    if (!get(this, 'config.isTest')) {
      window.scrollTo(0, 0);
    }
  }

  @action
  willTransition() {
    this.controllerFor('application').set('error', null);
  }

  @action
  error(error) {
    if (!(error instanceof AbortError)) {
      if (
        error.errors?.any(
          (e) =>
            e.detail === 'ACL token expired' ||
            e.detail === 'ACL token not found'
        )
      ) {
        this.token.postExpiryPath = this.router.currentURL;
        this.router.transitionTo('settings.tokens');
      } else {
        this.controllerFor('application').set('error', error);
      }
    }
  }
}
