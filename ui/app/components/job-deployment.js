/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { classNames } from '@ember-decorators/component';

@classNames('job-deployment', 'boxed-section')
export default class JobDeployment extends Component {
  deployment = null;
  isOpen = false;
}
