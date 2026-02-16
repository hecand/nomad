/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

/* eslint-disable ember-a11y-testing/a11y-audit-called */
/* eslint-disable qunit/require-expect */
import { module, test } from 'qunit';
import { currentURL, triggerEvent, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import Layout from 'nomad-ui/tests/pages/layout';
import JobsList from 'nomad-ui/tests/pages/jobs/list';
import { selectSearch } from 'ember-power-select/test-support';
import { Response } from 'miragejs';

module('Acceptance | search', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('search exposes and navigates to results from the fuzzy search endpoint', async function (assert) {
    server.create('node-pool');
    server.create('node', { name: 'xyz' });
    const otherNode = server.create('node', { name: 'ghi' });

    server.create('namespace');
    server.create('namespace', { id: 'dev' });

    server.create('job', {
      id: 'vwxyz',
      namespaceId: 'default',
      groupsCount: 1,
      groupAllocCount: 1,
    });
    server.create('job', {
      id: 'xyz',
      name: 'xyz job',
      namespaceId: 'default',
      groupsCount: 1,
      groupAllocCount: 1,
    });
    server.create('job', {
      id: 'xyzw',
      name: 'xyzw job',
      namespaceId: 'dev',
      groupsCount: 1,
      groupAllocCount: 1,
    });
    server.create('job', {
      id: 'abc',
      namespaceId: 'default',
      groupsCount: 1,
      groupAllocCount: 1,
    });

    const firstAllocation = server.schema.allocations.all().models[0];
    const firstTaskGroup = server.schema.taskGroups.all().models[0];
    const namespacedTaskGroup = server.schema.taskGroups.all().models[2];

    server.create('csi-plugin', { id: 'xyz-plugin', createVolumes: false });

    await visit('/');

    await selectSearch(Layout.navbar.search.scope, 'xy');

    Layout.navbar.search.as((search) => {
      assert.strictEqual(search.groups.length, 5);

      search.groups[0].as((jobs) => {
        assert.strictEqual(jobs.name, 'Jobs (3)');
        assert.strictEqual(jobs.options.length, 3);
        assert.strictEqual(jobs.options[0].text, 'default > vwxyz');
        assert.strictEqual(jobs.options[1].text, 'default > xyz job');
        assert.strictEqual(jobs.options[2].text, 'dev > xyzw job');
      });

      search.groups[1].as((clients) => {
        assert.strictEqual(clients.name, 'Clients (1)');
        assert.strictEqual(clients.options.length, 1);
        assert.strictEqual(clients.options[0].text, 'xyz');
      });

      search.groups[2].as((allocs) => {
        assert.strictEqual(allocs.name, 'Allocations (0)');
        assert.strictEqual(allocs.options.length, 0);
      });

      search.groups[3].as((groups) => {
        assert.strictEqual(groups.name, 'Task Groups (0)');
        assert.strictEqual(groups.options.length, 0);
      });

      search.groups[4].as((plugins) => {
        assert.strictEqual(plugins.name, 'CSI Plugins (1)');
        assert.strictEqual(plugins.options.length, 1);
        assert.strictEqual(plugins.options[0].text, 'xyz-plugin');
      });
    });

    await Layout.navbar.search.groups[0].options[1].click();
    assert.strictEqual(currentURL(), '/jobs/xyz@default');

    await selectSearch(Layout.navbar.search.scope, 'xy');
    await Layout.navbar.search.groups[0].options[2].click();
    assert.strictEqual(currentURL(), '/jobs/xyzw@dev');

    await selectSearch(Layout.navbar.search.scope, otherNode.name);
    await Layout.navbar.search.groups[1].options[0].click();
    assert.strictEqual(currentURL(), `/clients/${otherNode.id}`);

    await selectSearch(Layout.navbar.search.scope, firstAllocation.name);
    assert.strictEqual(
      Layout.navbar.search.groups[2].options[0].text,
      `${firstAllocation.namespace} > ${firstAllocation.name}`
    );
    await Layout.navbar.search.groups[2].options[0].click();
    assert.strictEqual(currentURL(), `/allocations/${firstAllocation.id}`);

    await selectSearch(Layout.navbar.search.scope, firstTaskGroup.name);
    assert.strictEqual(
      Layout.navbar.search.groups[3].options[0].text,
      `default > vwxyz > ${firstTaskGroup.name}`
    );
    await Layout.navbar.search.groups[3].options[0].click();
    assert.strictEqual(
      currentURL(),
      `/jobs/vwxyz@default/${firstTaskGroup.name}`
    );

    await selectSearch(Layout.navbar.search.scope, namespacedTaskGroup.name);
    assert.strictEqual(
      Layout.navbar.search.groups[3].options[0].text,
      `dev > xyzw > ${namespacedTaskGroup.name}`
    );
    await Layout.navbar.search.groups[3].options[0].click();
    assert.strictEqual(
      currentURL(),
      `/jobs/xyzw@dev/${namespacedTaskGroup.name}`
    );

    await selectSearch(Layout.navbar.search.scope, 'xy');
    await Layout.navbar.search.groups[4].options[0].click();
    assert.strictEqual(currentURL(), '/storage/plugins/xyz-plugin');

    const fuzzySearchQueries = server.pretender.handledRequests.filterBy(
      'url',
      '/v1/search/fuzzy'
    );

    const featureDetectionQueries = fuzzySearchQueries.filter((request) =>
      request.requestBody.includes('feature-detection-query')
    );

    assert.strictEqual(
      featureDetectionQueries.length,
      1,
      'expect the feature detection query to only run once'
    );

    const realFuzzySearchQuery = fuzzySearchQueries[1];

    assert.deepEqual(JSON.parse(realFuzzySearchQuery.requestBody), {
      Context: 'all',
      Namespace: '*',
      Text: 'xy',
    });
  });

  test('search does not perform a request when only one character has been entered', async function (assert) {
    await visit('/');

    await selectSearch(Layout.navbar.search.scope, 'q');

    assert.ok(Layout.navbar.search.noOptionsShown);
    assert.strictEqual(
      server.pretender.handledRequests.filterBy('url', '/v1/search/fuzzy')
        .length,
      1,
      'expect the feature detection query'
    );
  });

  test('when fuzzy search is disabled on the server, the search control is hidden', async function (assert) {
    server.post('/search/fuzzy', function () {
      return new Response(500, {}, '');
    });

    await visit('/');

    assert.ok(Layout.navbar.search.isHidden);
  });

  test('results are truncated at 10 per group', async function (assert) {
    server.create('node-pool');
    server.create('node', { name: 'xyz' });

    for (let i = 0; i < 11; i++) {
      server.create('job', { id: `job-${i}`, namespaceId: 'default' });
    }

    await visit('/');

    await selectSearch(Layout.navbar.search.scope, 'job');

    Layout.navbar.search.as((search) => {
      search.groups[0].as((jobs) => {
        assert.strictEqual(jobs.name, 'Jobs (showing 10 of 11)');
        assert.strictEqual(jobs.options.length, 10);
      });
    });
  });

  test('server-side truncation is indicated in the group label', async function (assert) {
    server.create('node-pool');
    server.create('node', { name: 'xyz' });

    for (let i = 0; i < 21; i++) {
      server.create('job', { id: `job-${i}`, namespaceId: 'default' });
    }

    await visit('/');

    await selectSearch(Layout.navbar.search.scope, 'job');

    Layout.navbar.search.as((search) => {
      search.groups[0].as((jobs) => {
        assert.strictEqual(jobs.name, 'Jobs (showing 10 of 20+)');
      });
    });
  });

  test('clicking the search field starts search immediately', async function (assert) {
    await visit('/');

    assert.notOk(Layout.navbar.search.field.isPresent);

    await Layout.navbar.search.click();

    assert.ok(Layout.navbar.search.field.isPresent);
  });

  test('pressing slash starts a search', async function (assert) {
    await visit('/');

    assert.notOk(Layout.navbar.search.field.isPresent);

    await triggerEvent('.page-layout', 'keydown', { key: '/' });

    assert.ok(Layout.navbar.search.field.isPresent);
  });

  test('pressing slash when an input element is focused does not start a search', async function (assert) {
    server.create('node-pool');
    server.create('node');
    server.create('job');

    await visit('/');

    assert.notOk(Layout.navbar.search.field.isPresent);

    await JobsList.search.click();
    await JobsList.search.keydown({ key: '/' });

    assert.notOk(Layout.navbar.search.field.isPresent);
  });
});
