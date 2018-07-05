/*
** Copyright (C) 2018 by Roger E Critchlow Jr,
** Charlestown, MA, USA
** rec@elf.org
**
** This program is free software; you can redistribute it and/or
** modify it under the terms of the GNU General Public License
** as published by the Free Software Foundation; either version 2
** of the License, or (at your option) any later version.
** 
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
** GNU General Public License for more details.
** 
** You should have received a copy of the GNU General Public License
** along with this program; if not, write to the Free Software
** Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
**
** The home page for this calendar is
**	http://www.elf.org/moons/
** a copy of the GNU GPL may be found at
**	http://www.gnu.org/copyleft/gpl.html,
*/

//
// web worker to compute the values required for a month of calendar
//
// import { Ephemerides } from './ephemerides.js';
importScripts('./ephemerides.js');
//    failed test for useful unicode 
//    root.appendChild(calendar_copyright_node(x, y+c.month_height, fs,
//        "\u2640 - \u2641 - \u2642 - \u2643 - \u2644 - "+  // venus, earth, mars, jupiter, saturn
//        "\u2648 - \u2649 - \u264a - \u264b - \u264c - \u264d - \u264e - \u264f - \u2650 - \u2651 - \u2652 - \u2653 - "+  // zodiac signs
//        "\u260a - \u260b - \u260c - \u260d"));            // ascending and descending nodes, conjunction and opposition

const millis_per_day = 24*60*60*1000;      // milliseconds in a day
const millis_per_degree = (27.3*24*60*60*1000) / 360; // milliarcseconds per degree???

//
// compute the n phases of the moon
// starting from the nearest new moon to date
// and working forward in time
//
const compute_month = (c, date, n) => {
    // console.log(`compute_month(..., ${date.toString()}, ${n})`);
    c.month_date = new Array(n+1);
    c.month_date[0] = date;
    const dt = (29.5 / (n-1))*millis_per_day;
    for (let i = 1; i <= n; i += 1) {
        const from_date = new Date(c.month_date[i-1].getTime()+dt);
        c.month_date[i] = moon_at_phase(from_date, (i*(360/n))%360);
    }
    return c.month_date;
}

//
// find the conjunctions of the moon with planets 
// from start date to end date
//
const compute_planets = (c) => {
    c.planet_date = new Array();
    for (i in c.planets) {
        var p = c.planets[i];
        var d = moon_planet_conjunction(c.min_date, p);
        while (d != null && d.getTime() < c.max_date.getTime()) {
            d.planet = p;
            c.planet_date.push(d);
            d = moon_planet_conjunction(new Date(d.getTime()+millis_per_day), p);
        }
    }
    return c.planet_date;
}

//
// find the ascending and descending nodes of the moon
// from start date to end date
//
const compute_nodes = (c) => {
    var nodes = [];
    return nodes;
}

//
// find the perigee and apogee of the moon
// from start date to end date
//
const compute_gees = (c) => {
    var gees = [];
    return gees;
}

const compute_zodiac = (c) => {
    const zodiac = [];
    return zodiac;
}

const compute = (c) => {    
    c.start0 = moon_at_phase(c.start, 0);
    // console.log(`moon_at_phase(${c.start}, 0) returned ${c.start0}`);
    c.m_date = compute_month(c, c.start0, c.phases)
    // console.log(`compute_month returned ${c.m_date.map((d) => d).join(', ')}`);
    c.min_date = c.m_date[0];
    c.max_date = c.m_date[c.phases];
    if (c.draw.planets)
        c.p_date = compute_planets(c);
    if (c.draw.orbital_gees)
	c.g_date = compute_gees(c);
    // mark the ascending and descending nodes
    if (c.draw.nodes)
	c.n_date = compute_nodes(c);
    // mark the zodiac or first point of aries
    if (c.draw.zodiac || c.draw.aries)
	c.z_date = compute_zodiac(c);
    return c;
}
////////////////////////////////////////////////////////////////////////
//
// here down we're more generic ephemeris computations.
// no references to c.*
//
////////////////////////////////////////////////////////////////////////

//
// find the next date of moon planet conjunction
// in ecliptic longitude
// forward from the given date.
//
function moon_planet_conjunction(date0, planet) {
    //
    // compute how many degrees the moon is away from the planet
    // this function is positive from 180 degrees behind down
    // to conjunction, and negative from conjunction up to
    // -180 degrees behind (ie, ahead).
    //
    function degrees_from_conjunction(t) {
        var eph = ephemerides_at_time(t);
        var moonlon = eph.Moon.lonecl;
        var planetlon = eph[planet].lonecl;
        var d = moonlon - planetlon;
        return (d > 180) ? (d - 360) : (d < -180) ? (d + 360) : d;
    }        
    function moon_planet_conjunction_time(time0) {
        var times = ephemerides_cached_times();
        var t0;
        var d0;
        for (var i in times) {
            var t1 = new Number(times[i]);
            var d1 = degrees_from_conjunction(times[i]);
            if (t1 < time0) {
                ;
            } else if (d1 == 0) {
                return t1;
            } else if (t0 == null) {
                t0 = t1;
                d0 = d1;
            } else if (d1 * d0 < 0 && d0 < 0) {
                return find_zero_by_brents_method(degrees_from_conjunction, t0, d0, t1, d1);
            } else {
                t0 = t1;
                d0 = d1;
            }
        }
        return null;
    }

    var t = moon_planet_conjunction_time(date0.getTime());
    return t == null ? null : new Date(t);
}

//
// find the date nearest the given date when the moon's elongation is elong
//
function moon_at_phase(date0, phase) {
    //
    // fetch moon phase at date
    // note that the "elongation" includes separation in latitude
    // so it only goes to zero at new moons which are total eclipses
    // we're only concerned with elongation in longitude.
    //
    function moon_phase_at_time(t) {
        var eph = ephemerides_at_time(t);
        var phase = eph.Moon.lonecl - eph.Sun.lonecl;
        // System.out.print("moon_phase_at_time("+t+") is "+(phase < 0 ? phase + 360 : phase));
        return phase < 0 ? phase + 360 : phase;
    }
    //
    // compute the error in phase where e1 is current and e2 is desired
    // phase starts at zero, increases to 359.9999..., and jumps back to 0
    // so when approaching 0 from below, be careful
    //
    function error_in_moon_phase(t) {
        var de = phase-moon_phase_at_time(t);
        return (de > 180) ? (de - 360) : (de < -180) ? (de + 360) : de;
    }
    function moon_at_phase_time(time0) {
        const x0 = time0;
        const y0 = error_in_moon_phase(x0);
        const x1 = x0 + 1.25 * y0 * millis_per_degree;
        const y1 = error_in_moon_phase(x1);
        return find_zero_by_brents_method(error_in_moon_phase, x0, y0, x1, y1);
    }
    return new Date(moon_at_phase_time(date0.getTime()));
}

//
// find a zero of a function via Brent's method
// this is ripped off from the apache commons-math-1.1 package
//
function find_zero_by_brents_method(f, x0, y0, x1, y1) {
    var maximalIterationCount = 100;
    var relativeAccuracy = 1e-14;
    var absoluteAccuracy = 1e-6;
    var functionValueAccuracy = 5e-3;
    // Index 0 is the old approximation for the root.
    // Index 1 is the last calculated approximation  for the root.
    // Index 2 is a bracket for the root with respect to x1.

    // See if we're already there
    if (Math.abs(y1) <= functionValueAccuracy) {
	return x1;
    }

    // Verify bracketing
    if (y0 * y1 >= 0) {
        throw  `Function values [${y0},${y1}] at endpoints [${x0},${x1}] do not have different signs.`;       
    }   

    var x2 = x0;
    var y2 = y0;
    var delta = x1 - x0;
    var oldDelta = delta;

    var i = 0;
    while (i < maximalIterationCount) {
        // console.log(`brent at i ${i} x0 ${x0} y0 ${y0} x1 ${x1} y1 ${y1} x2 ${x2} y2 ${y2}`);
        if (Math.abs(y2) < Math.abs(y1)) {
            x0 = x1;
            x1 = x2;
            x2 = x0;
            y0 = y1;
            y1 = y2;
            y2 = y0;
        }
        if (Math.abs(y1) <= functionValueAccuracy) {
            // Avoid division by very small values. Assume
            // the iteration has converged (the problem may
            // still be ill conditioned)
            // console.log(`brent found ${y1} in ${i} iterations`);
            return x1;
        }
        var dx = (x2 - x1);
        var tolerance =
            Math.max(relativeAccuracy * Math.abs(x1), absoluteAccuracy);
        if (Math.abs(dx) <= tolerance) {
            // console.log("brent found "+y1+" in "+i+" iterations");
            return x1;
        }
        if ((Math.abs(oldDelta) < tolerance) || (Math.abs(y0) <= Math.abs(y1))) {
            // Force bisection.
            delta = 0.5 * dx;
            oldDelta = delta;
        } else {
            var r3 = y1 / y0;
            var p;
            var p1;
            if (x0 == x2) {
                // Linear interpolation.
                p = dx * r3;
                p1 = 1.0 - r3;
            } else {
                // Inverse quadratic interpolation.
                var r1 = y0 / y2;
                var r2 = y1 / y2;
                p = r3 * (dx * r1 * (r1 - r2) - (x1 - x0) * (r2 - 1.0));
                p1 = (r1 - 1.0) * (r2 - 1.0) * (r3 - 1.0);
            }
            if (p > 0.0) {
                p1 = -p1;
            } else {
                p = -p;
            }
            if (2.0 * p >= 1.5 * dx * p1 - Math.abs(tolerance * p1) ||
                    p >= Math.abs(0.5 * oldDelta * p1)) {
                // Inverse quadratic interpolation gives a value
                // in the wrong direction, or progress is slow.
                // Fall back to bisection.
                delta = 0.5 * dx;
                oldDelta = delta;
            } else {
                oldDelta = delta;
                delta = p / p1;
            }
        }
        // Save old X1, Y1 
        x0 = x1;
        y0 = y1;
        // Compute new X1, Y1
        if (Math.abs(delta) > tolerance) {
            x1 = x1 + delta;
        } else if (dx > 0.0) {
            x1 = x1 + 0.5 * tolerance;
        } else if (dx <= 0.0) {
            x1 = x1 - 0.5 * tolerance;
        }
        y1 = f(x1);
        if ((y1 > 0) == (y2 > 0)) {
            x2 = x0;
            y2 = y0;
            delta = x1 - x0;
            oldDelta = delta;
        }
        i++;
    }
    throw "Maximum number of iterations exceeded.";
}

//
// cache ephemerides computations
// 
var ephemerides_cache = new Object();

//
// fetch ephemerides for date (maybe) with caching
// restrict the cache to +/- 30 days from the start date of the moon we're working on
//
function clear_ephemerides_cache() {
    if (ephemerides_cache)
        ephemerides_cache = new Object();
}
function ephemerides_cached_times() {
    var times = new Array();
    for (var t in ephemerides_cache) times.push(t);
    return times.sort();
}
const ephemerides_at_time = (t) => {
    function ephemerides(t) {
        var date = new Date(t);
        return new Ephemerides(date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate(),
                               date.getUTCHours() + ((date.getUTCMinutes() + date.getUTCSeconds()/60) / 60));
    }
    if (ephemerides_cache) {
        if ( ! ephemerides_cache[t]) {
            ephemerides_cache[t] = ephemerides(t);
        }
        return ephemerides_cache[t];
    } else {
        return ephemerides(t);
    }
}

//
// handle worker interface
//
onmessage = (e) => {
    // console.log(`worker in generate.js received ${e.data}`);
    let result = compute(e.data);
    // console.log(`worker in generate.js computed ${result}`);
    postMessage(result);
}

onerror = (e) => {
    console.log(`worker in generate.js received error ${e}`);
}
// console.log('reached the end of generate.js');
// postMessage('reached the real end of generate.js');
