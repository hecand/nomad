/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import generateExecUrl from 'nomad-ui/utils/generate-exec-url';
import openExecUrl from 'nomad-ui/utils/open-exec-url';

export default class OpenButton extends Component {
  @service router;

  @action
  open() {
    openExecUrl(this.generateUrl());
  }

  generateUrl() {
    return generateExecUrl(this.router, {
      job: this.args.job,
      taskGroup: this.args.taskGroup,
      task: this.args.task,
      allocation: this.args.allocation,
    });
  }
}
