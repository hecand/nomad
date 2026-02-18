/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/template';

export default class GlobalHeader extends Component {
  @service config;
  @service system;

  get labelStyles() {
    return htmlSafe(
      `
        color: ${this.system.agent.get('config')?.UI?.Label?.TextColor};
        background-color: ${
          this.system.agent.get('config')?.UI?.Label?.BackgroundColor
        };
      `
    );
  }
}
