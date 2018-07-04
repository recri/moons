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

import { html, svg } from 'lit-html/lib/lit-extended.js'
import { PageViewElement } from './page-view-element.js';
import { generateSVG } from './js/generate.js';

class MoonsCalendar extends PageViewElement {
    static get properties() {
	return {
	    search: String,
	}
    }
  _render(props) {
    return html`
      <style>
	.slot{position:fixed;top:25px;left:25px}
      </style>
      <div class="slot"><slot></slot></div>
    `
  }
}

window.customElements.define('moons-calendar', MoonsCalendar);
