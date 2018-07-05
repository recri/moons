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

import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { newMonthData } from '../actions/moons.js';

import { parse_search } from './js/parse_search.js';

const params = {
    proto: {
	start: 'start',                     // start date (find nearest new moon to start_date)
	s: 'start',			    // synonym for start
	months: 'months',                   // number of months to draw
	m: 'months',			    // synonym for months

	// these are pretty much fixed by the designer's taste
	days: 'days',                       // width of frame in days
	d: 'days',
	border: 'border',                   // border in days width == month height
	b: 'border',
	moon_per_cent: 'moon_per_cent',     // per cent of month height for moon diameter
	mpc: 'moon_per_cent',

	// these are all presentation issues
	// covered by top, left, width, and height assigned to the image as a whole
	// so they shouldn't be issues at all.
	offset_right: 'offset_right',       // displacement of calendar center from width/2
	or: 'offset_right',
	offset_down: 'offset_down',         // displacement of calendar center from height/2
	od: 'offset_down',
	view_width: 'view_width',           // width of parent frame
	vw: 'view_width',
	view_height: 'view_height',         // height of parent frame
	vh: 'view_height',

	// these are as yet to be done, all the draw{sub} fields
    },
    defaults: {
	start: new Date(),                  // today
	months: 13,                         // one years
	days: 40,
	border: 2.5,
	view_width: 880,
	view_height: 366,
	offset_right: 0,
	offset_down: 0,
	moon_per_cent: 80
    },
    validations: {
	start: (x) => new Date(x),
	months: (x) => new Number(x),
	days: (x) => new Number(x),
	view_width: (x) => new Number(x),
	view_height: (x) => new Number(x),
	moon_per_cent: (x) => new Number(x),
	border: (x) => new Number(x),
	offset_right: (x) => new Number(x),
	offset_down: (x) => new Number(x)
    },
    params: {
    },
    values: {
	// search string
	search: "",                         // document search contents
	// constants
	millis_per_day: 24*60*60*1000,      // milliseconds in a day
	planets: ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'],
	scale: 4,
	// variations
	draw: {
            frame: true,
            moons: true,
            day_ticks: true,
            day_numbers: true,
            planets: false,
            orbital_gees: false,
            orbital_nodes: false,
            new_moon_dates: true,
            title: true,
            copyright: true
	},
	// functions    
	next_step: function(step) { step(); }      // default continuation
    }
};

// graphics support
import { phase_path_points } from './js/ephemimages.js';

class MoonsCalendar extends connect(store)(PageViewElement) {
    static get properties() {
	return {
	    // the source of all the parameters
	    search: String,
	    // the outcome of all the parameters
	    month_data: Array,
	    // basic parameters of calendar
	    start: Object,	// start Date
	    months: Number,	// number of months
	    phases: Number,	// number of phases in months: 2, 4, 8, 16, 32 crowded
	    // stuff to include in computations and drawing
	    draw: Object,	// stuff to be drawn
	    // drawing parameters
	    days: Number,	// width of calendar frame in days
	    border: Number,	// margin of calendar frame in days
	}
    }
    _render({start,months,phases,days,border,month_data,draw}) {
	const scale = 1000;	// day cells are drawn 1000 units square
	const dwidth = border+days+border;
	const width = dwidth*scale;
	const dheight = border+months+border
	const height = dheight*scale;
	const viewBox = `0 0 ${height} ${width}`
	console.log(`_render width=${width} height=${height}`);
	const generate_title = () => {
	    return svg``;
	}
	const generate_month = (month, index) => {
	    return svg``
	}
	const generate_copyright = () => {
	    return svg``;
	}
/*

*/
	return html`
<style>
  .slot{position:fixed;top:25px;left:25px;color:white;}
  .view{position:fixed;top:0px;left:0px;width:100%;background-color:black;}
</style>
<div class="view">
  <svg viewBox="0 0 45000 44000" width="100%">
    <rect width="100%" height="100%" fill="black" />
    ${month_data ? month_data.map((month, index) => generate_month(month, index)) : ''}
    ${month_data && month_data.length === months && draw.title ? generate_title() : ''}
    ${month_data && month_data.length === months && draw.copyright ? generate_copyright() : ''}
  </svg>
</div>
<slot class="slot">
</slot>
    `
    }
    _stateChanged(state) {
	if (this.search !== state.moons.search) {
	    console.log(`_stateChanged search: '${state.moons.search}' from '${this.search}'`);
	    this.search = state.moons.search;
	    for (let [name, value] of Object.entries(parse_search(this.search, params)))
		this[name] = value;
	    // start new computations
	    this._newworker();
	    store.dispatch(newMonthData([]));
	}
	if (this.month_data !== state.moons.monthData) {
	    console.log(`_stateChanged month_data: length = ${state.moons.monthData.length}`);
	    this.month_data = state.moons.monthData;
	    if (this.month_data.length === 0)
		this._startworker(this.start);
	    else if (this.month_data.length < this.months)
		this._startworker(this.month_data[this.month_data.length-1].max_date);
	    else
		this._endworker;
	}
    }
    _newworker() {
	// start a web worker
	console.log('_newworker');
	this._endworker();
	this.worker = new Worker('src/components/js/generate.js'); // , { type: 'module' }
	this.worker.onmessage = (result) => this._onmessage(result);
	this.worker.onerror = (error) => this._onerror(error);
	this.worker.onmessageerror = (error) => this._onmessageerror(error);
    }
    _startworker(start) {
	const {phases, draw, planets} = this;
	this._postmessage({start, phases, draw, planets});
    }
    _endworker() {
	// stop previous computations
	if (this.worker) {
	    console.log('_endworker');
	    this.worker.terminate();
	    this.worker = undefined;
	}
    }
    _postmessage(data) {
	console.log(`posting ${data.start.toDateString()} to worker`);
	this.worker.postMessage(data);
    }
    _onmessage(e) {
	if (typeof e.data === 'string') {
	    console.log(e.data);
	} else {
	    const month_datum = e.data
	    const month_data = Array(this.month_data);
	    month_data.push(month_datum);
	    console.log(`received ${month_datum.start.toDateString()} from worker`);
	    store.dispatch(newMonthData(month_data));
	}
    }
    _onerror(e) {
	console.log(`_onerror: ${e}`);
    }
    _onmessageerror(e) {
	console.log(`_onmessageerror: ${e}`);
    }
}

window.customElements.define('moons-calendar', MoonsCalendar);
