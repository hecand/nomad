/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import { classNames } from '@ember-decorators/component';

@classNames('page-layout')
export default class PageLayout extends Component {
  isGutterOpen = false;
}
