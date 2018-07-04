/**
@license
Copyright (c) 2018 Roger E Critchlow Jr.  All rights reserved.
This code may only be used under the BSD style license found at http://recri.github.io/change/LICENSE.txt
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html } from '@polymer/lit-element';
import { PageViewElement } from './page-view-element.js';
import { SharedStyles } from './shared-styles.js';

class MoonsAbout extends PageViewElement {
  _render(props) {
    return html`
      ${SharedStyles}
      <style>
	.slot{position:fixed;top:25px;left:25px}
      </style>
      <section>
        <h2>About</h2>
	  <p>
	    <i>Moon &amp; sun are passing figures of countless generations, and
	      years coming or going wanderers too.  Drifting life away on a
	      boat or meeting age leading a horse by the mouth, each day is a
	      journey and the journey itself home.</i>
	  </p><p>
	    <small>Basho, <i>Back Roads To Far Towns</i>,
	      translated by Cid Corman and Kamaike Susumu.</small>
	  </p>
        <p>
	This app draws a moon calendar one month per row, 
	days increasing from right to left,
	months increasing from top to bottom,
	the moon phases are drawn for each month
	at the time they occur in Boston.
	</p>
	<div class="slot"><slot></slot></div>
      </section>
    `
  }
}

window.customElements.define('moons-about', MoonsAbout);
