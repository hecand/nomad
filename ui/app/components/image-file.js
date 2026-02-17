/**
 * Copyright IBM Corp. 2015, 2025
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ImageFile extends Component {
  // Set by updateImageMeta
  @tracked width = 0;
  @tracked height = 0;

  get fileName() {
    if (!this.args.src) return undefined;
    return this.args.src.includes('/')
      ? this.args.src.match(/^.*\/(.*)$/)[1]
      : this.args.src;
  }

  @action
  handleImageLoad(event) {
    this.updateImageMeta(event);
  }

  updateImageMeta(event) {
    const img = event.target;
    this.width = img.naturalWidth;
    this.height = img.naturalHeight;
  }
}
