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

// where do I apply timezone so the days come out localtime?

const params = {
    proto: {			// the names allowed in the search string and their canonical form
	start: 'start',		// start date (find nearest new moon to start_date)
	s: 'start',		// synonym for start
	months: 'months',	// number of months to draw
	m: 'months',		// synonym for months
	phases: 'phases',
	p: 'phases',

	// these are pretty much fixed by the designer's taste
	days: 'days',		// width of frame in days
	d: 'days',
	border: 'border',      // border in days width == month height
	b: 'border',
	moon_per_cent: 'moon_per_cent',     // per cent of month height for moon diameter
	mpc: 'moon_per_cent',
	// these are as yet to be done, all the draw{sub} fields
    },
    defaults: {			// the default values
	start: new Date(),	// today
	months: 13,		// one years
	phases: 8,		// eighths of month
	days: 40,
	border: 2.5,
	moon_per_cent: 80
    },
    validations: {		// how to validate values
	start: (x) => new Date(x),
	months: (x) => x > 0 && new Number(x),
	phases: (x) => (x&(x-1))===0 && new Number(x), // power of two
	days: (x) =>  x > 30 && new Number(x),
	border: (x) => new Number(x),
	moon_per_cent: (x) => x > 0 && x <= 100 && new Number(x)
    },
    params: {			// the default values merged with values from search string
    },
    values: {			// the other values needed
	// search string
	search: "",                         // document search contents
	// constants
	planets: ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'],
	// variations
	draw: {
            frame: true,
            moons: true,
            day_ticks: true,
            day_numbers: true,
            planets: true,
            orbital_gees: false,
            orbital_nodes: true,
            new_moon_dates: true,
            title: true,
            copyright: true
	},
    }
};

const millis_per_day = 24*60*60*1000;      // milliseconds in a day

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
	    moon_per_cent: Number, // moon diameter as percent of day square edge
	}
    }
    _render({start,months,phases,days,border,moon_per_cent,month_data,draw}) {
	const scale = 1000;	// day cells are drawn 1000 units square
	const dwidth = border+days+border, width = dwidth*scale;
	const dheight = border+months+border, height = dheight*scale;
	// moon phases
	const pfull = phases/2, pnew0 = 0, pnew1 = phases;
	// compute the frame coordinates, centered
	const fwidth = days*scale, fheight = months*scale;
	const fx = 0.5 * (width - fwidth), fy = 0.5 * (height - fheight);
	// console.log(`_render width=${width} height=${height}`);
	// console.log(`_render pnew0=${pnew0} pfull=${pfull} pnew1=${pnew1}`);
	// console.log(`_render start=${start} months=${months} phases=${phases} days=${days} border=${border} millis_per_day=${millis_per_day}`);
	// console.log(`_render ${month_data && month_data.length} months, draw.moons ${draw.moons}`);

	// return svg templates
	const draw_nil = () => 
	      svg``;
	const line_node_vertical = (x, y1, y2) => 
	      svg`<line x1$="${x}" y1$="${y1}" x2$="${x}" y2$="${y2}" />`;
	const triangle_node = (x1,y1, x2,y2, x3,y3, className) => 
	      svg`<path d$="M${x1},${y1}L${x2},${y2} ${x3},${y3}Z" class$="${className}" />`;
	const text_node = (x, y, className, text) => 
	      svg`<text x$="${x}" y$="${y}" class$="${className}">${text}</text>`
	const top_tick_node = (x, h, className) => triangle_node(x,0.1*h, x,0, x-0.1*h,0, className);
	const btm_tick_node = (x, h, className) => triangle_node(x,0.9*h, x,h, x-0.1*h,h, className);
	const top_text_node = (x, h, className, t) => text_node(x-100, 250, className, t);
	const btm_text_node = (x, h, className, t) => text_node(x-100, h-100, className, t);

	// returns a string formatted date
	const format_date = (d) => 
	      `${d.getUTCFullYear()}.${1+d.getUTCMonth()}.${d.getUTCDate()}`;

	// return svg templates
	const generate_title = () => 
	      text_node(width/2, fy - scale/2, "calendartitle", `${format_date(this.min_date)} - Moons - ${format_date(this.max_date)}`);
	const generate_month = (month, index) => {
	    const mnew0 = month.m_date[pnew0], mfull = month.m_date[pfull], mnew1 = month.m_date[pnew1];
	    const tnew0 = mnew0.getTime(), tfull = mfull.getTime(), tnew1 = mnew1.getTime();
	    const x_for_time = (t) => Math.round(
		width/2 +		// the x coordinate of the full moon
		((tfull -		// the time of the full moon
                  t) /			// minus the time of interest
		 millis_per_day) *	// convert to day.fraction_of_day
		scale			// times the width of the day
	    );
	    const draw_frame = () => {
		const x1 = x_for_time(millis_per_day*Math.floor(1+tnew1/millis_per_day));
		const x2 = x_for_time(millis_per_day*Math.floor(tnew0/millis_per_day));
		return svg`<rect class="frame" x$=${x1} y=0 width$=${x2-x1} height$=${scale-1} />`;
 	    }
	    const draw_moons = () => {
		const cy = scale/2;
		const r = (moon_per_cent/100.0)*scale/2;
		return month.m_date.map((date, index) => {
		    const phase = index*(360/phases)%360;
		    const cx = x_for_time(date.getTime());
		    const d = phase_path_points(phase,r,36);
		    const className = `moon${phase===0?' new':''}`
		    return svg`<path class$="${className}" transform$="translate(${cx},${cy})" d$="${d}" />`
		});
	    }
	    const draw_day_ticks_and_numbers = () => {
		const day_vertical_line = (x, h) => line_node_vertical(x, 0, h);
		const day_tick_node = (x, h, d) => btm_tick_node(x, h, "daytick");
		const day_number_node = (x, h, d) => btm_text_node(x, h, "daynumber", `${d}`);
		const f_t = tfull / millis_per_day;                   // fractional date of full moon
		const n1_d = Math.floor(tnew0 / millis_per_day);      // day of 1st new moon        
		const n2_d = Math.floor(tnew1 / millis_per_day);      // day of 2nd new moon
		const day_markers = [];
		for (let d = n1_d; d <= n2_d+1; d += 1) {
		    const t = d*millis_per_day;
		    const x = x_for_time(t);
		    const h = scale;
		    const day = new Date(t).getUTCDate();   // day of month, UTC
		    if (draw.day_ticks)
			day_markers.push(day_tick_node(x, h));
		    if (draw.day_numbers && d != n2_d+1)
			day_markers.push(day_number_node(x, h, day));
		    if (d == n1_d || d == n2_d+1)
			day_markers.push(day_vertical_line(x, h));	
		}
		return svg`${day_markers}`
	    }
	    const draw_new_moon_dates = () => {
		const new_moon_date = (x, y, w, h, fill, date, className) =>
		      text_node(x,y,`newmoondate ${className}`,format_date(date));
		const new_moon_date_left = (x, y, w, h, fill, date) =>
		      new_moon_date(x-4, y-(h/3), w, h, fill, date, "left");
		const new_moon_date_right = (x, y, w, h, fill, date) => 
		      new_moon_date(x+4, y-(h/3), w, h, fill, date, "right");
		const w = scale;
		const x0 = x_for_time(tnew0-millis_per_day);
		const x1 = x_for_time(tnew1+millis_per_day); 
		return svg`
			${new_moon_date_right(x0, w, w, w, "white", mnew0)}
			${new_moon_date_left(x1, w, w, w, "white", mnew1)}
		`;
	    }
	    const draw_planets = () => {
		const planet_map = { Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '⛢', Neptune: '♆', Pluto: '♇' }; 
		const planet_markers = [];
		month.p_date.forEach(([planet,d]) => {
		    const x = x_for_time(d.getTime())
		    planet_markers.push(top_text_node(x, scale, `planet ${planet}`, planet_map[planet]), top_tick_node(x, scale, "planettick"));
		});
		return svg`${planet_markers}`
	    }
	    const draw_gees = () => draw_nil();
	    const draw_nodes = () => {
		const node_map = { ascending: '☊', descending: '☋', conjunction: '☌', opposition: '☍' }; 
		const node_markers = [];
		month.n_date.forEach(([node,d]) => {
		    const x = x_for_time(d.getTime());
		    // console.log(`drawing ${node} node ${node_map[node]} at ${x}`);
		    node_markers.push(top_text_node(x, scale, "node", node_map[node]), top_tick_node(x, scale, "nodetick"));
		});
		return svg`${node_markers}`;
	    }
	    const draw_zodiac = () => draw_nil();
	    const draw_mondays = () => draw_nil();
	    return svg`
<g id$=m${index} transform$=translate(0,${fy+index*scale}) width$=${width} height=${scale}px>
  <title>this is moonth ${index}</title>
  ${draw.frame ? draw_frame() : draw_nil()}
  ${draw.moons ? draw_moons() : draw_nil()}
  ${draw.day_ticks || draw.day_numbers ? draw_day_ticks_and_numbers() : draw_nil()}
  ${draw.new_moon_dates ? draw_new_moon_dates() : draw_nil()}
  ${draw.planets ? draw_planets() : draw_nil()}
  ${draw.orbital_gees ? draw_gees() : draw_nil()}
  ${draw.orbital_nodes ? draw_nodes() : draw_nil()} 
  ${draw.aries || draw.zodiac ? draw_zodiac() : draw_nil()}
  ${draw.mondays ? draw_mondays() : draw_nil()}
</g>`
	}

	const generate_copyright = () =>
	      text_node(width/2, fy+(months+1)*scale, "copyright",
			`${format_date(this.min_date)} - Moons - ${format_date(this.max_date)}, `+
			     "Copyright \xa9 2018 by Roger E Critchlow Jr, Charlestown, MA, USA, "+
			     "http://elf.org/moons");

	// console.log(`draw.title = ${draw.title}, draw.copyright = ${draw.copyright}, month_data = ${month_data}`);
	// if (month_data) console.log(`month_data.length = ${month_data.length}, months = ${months}`);
	// console.log(`min_date ${this.min_date}, max_date ${this.max_date}`);
	 
	return html`
<style>
  .view{position:fixed;top:0px;left:0px;width:100%;background-color:black;}
  svg {stroke-width:10;stroke:white;fill:white}
  .frame{fill:none}
  .moon{}
  .moon.new{fill:none}
  text{}
  .planettick,.nodetick{stroke:none;stroke-width:0}
  .planet,.node{text-anchor:end;font-size:250px}
  .planet.Mars,.planet.Venus{font-size:375px}
  .daytick{stroke:none;stroke-width:0}
  .daynumber{text-anchor:end;font-size:250px}
  .newmoondate{font-size:500px}
  .newmoondate.left{text-anchor:end}
  .newmoondate.right{text-anchor:start}
  .calendartitle{font-size:500px;text-anchor:middle}
  .copyright{font-size:333px;text-anchor:middle}
  .slot{position:fixed;top:25px;left:25px;z-index:2;}
</style>
<div class="view">
  <svg viewBox="0 0 45000 83000" width="100%">
    <rect width="100%" height="100%" fill="black" />
    ${month_data && month_data.length == months && draw.title ? generate_title() : ''}
    ${month_data ? month_data.map((month, index) => generate_month(month, index)) : ''}
    ${month_data && month_data.length == months && draw.copyright ? generate_copyright() : ''}
  </svg>
</div>
<slot class="slot">
</slot>
    `
    }
    get min_date() {
	const md = this.month_data;
	return (md && md.length > 0) ? md[0].min_date : undefined;
    }
    get max_date() {
	const md = this.month_data;
	return (md && md.length > 0) ? md[md.length-1].max_date : undefined;
    }
    _stateChanged(state) {
	if (this.search !== state.moons.search) {
	    // console.log(`_stateChanged search: '${state.moons.search}' from '${this.search}'`);
	    this.search = state.moons.search;
	    for (let [name, value] of Object.entries(params.values)) {
		if (name === 'search') continue;
		if ( ! this.hasOwnProperty(name)) {
		    this[name] = value;
		    // console.log(`did copy values[${name}] to this`);
		} else {
		    // console.log(`did not copy values[${name} to this`);
		}
	    }
	    for (let [name, value] of Object.entries(parse_search(this.search, params)))
		this[name] = value;
	    // start new computations
	    store.dispatch(newMonthData([]));
	}
	if (this.month_data !== state.moons.monthData) {
	    // console.log(`_stateChanged month_data: length = ${state.moons.monthData.length}`);
	    this.month_data = state.moons.monthData;
	    if ( ! this.month_data) {
		this._endworker();
	    } else if (this.month_data.length === 0) {
		this._newworker();
		this._startworker(this.start);
	    } else if (this.month_data.length < this.months) {
		this._startworker(this.max_date);
	    } else {
		// console.log(`finished computing months`);
		this._endworker;
	    }
	}
    }
    _newworker() {
	// start a web worker
	// console.log('_newworker');
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
	    // console.log('_endworker');
	    this.worker.terminate();
	    this.worker = undefined;
	}
    }
    _postmessage(data) {
	// console.log(`posting ${data.start.toDateString()} to worker`);
	this.worker.postMessage(data);
    }
    _onmessage(e) {
	if (typeof e.data === 'string') {
	    console.log(e.data);
	} else {
	    // console.log(`received ${e.data.min_date} from worker`);
	    store.dispatch(newMonthData([...this.month_data, e.data]));
	    // console.log(`setting newMonthData of length ${month_data.length} items`);
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
