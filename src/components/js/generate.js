/*
** Copyright (C) 2006 by Roger E Critchlow Jr,
** Santa Fe, New Mexico, USA
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
// generate header content
// instantiate dynamic elements
//

import { Ephemerides } from './ephemerides.js';
import { parse_search } from './parse_search.js';
import { phase_path_points } from './ephemimages.js';

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

const proto = {
    start: 'start',                     // start date (find nearest new moon to start_date)
    s: 'start',
    months: 'months',                   // number of months to draw
    m: 'months',

    // these are pretty much fixed by the designer's taste
    days: 'days',                       // width of frame in days
    d: 'days',
    border: 'border',                   // border in days width == month height
    b: 'border',
    moon_per_cent: 'moon_per_cent',     // per cent of month height for moon diameter
    mpc: 'moon_per_cent'

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
};

const defaults = {
    start: new Date(),                  // today
    months: 13,                         // one years
    days: 40,
    border: 2.5,
    view_width: 880,
    view_height: 366,
    offset_right: 0,
    offset_down: 0,
    moon_per_cent: 80
};

const validations = {
    start: (x) => new Date(x),
    months: (x) => new Number(x),
    days: (x) => new Number(x),
    view_width: (x) => new Number(x),
    view_height: (x) => new Number(x),
    moon_per_cent: (x) => new Number(x),
    border: (x) => new Number(x),
    offset_right: (x) => new Number(x),
    offset_down: (x) => new Number(x)
};

var c = {
    // search string
    search: "",                         // document search contents
    // constants
    millis_per_day: 24*60*60*1000,      // milliseconds in a day
    planets: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
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
};

export function generateSVG(search) {
    var search;
    if (window.location.search != '') {
        search = window.location.search;
        // alert("search from window.location.search: "+search);
    } else if (window.parent.location.search != '') {
        search = window.parent.location.search;
        // alert("taking search from window.parent.location.search: "+search);
    } else {
        search = '?vw=880&vh=366&m=13&b=2';       // default image
        // alert("taking search from default: "+search);
    }

    c.search = search;
    var params = parse_search(search, proto, defaults, validations);

    // copy params
    for (var i in params) {
        c[i] = params[i];
    }

    // set a handler to timeout
    // avoid by using a Web Worker
    c.next_step = function(func) { setTimeout(func, 50); };     // continuation to avoid browser time out

    // compute the overall height and width
    // this might be wrong if the height and width are actual page size
    var cell_height = c.border+c.months+c.border;
    var cell_width = c.border+c.days+c.border;
    var month_height = 100; // c.view_height / cell_height;
    var day_width = 100; // c.view_width / cell_width;
    // c.month_height = c.scale*Math.floor(Math.min(month_height, day_width));
    c.height = c.scale*c.view_height;
    c.width = c.scale*c.view_width;

    // resize the parent embedded object
    // ie7 forbids this, firefox ends up with scrolling
    // try {
    //     window.resizeTo(c.view_width, c.view_height);
    // } catch(e) { }
    // ie7 forbids this, firefox gets a reasonable frame
    try {
        if (window && window.parent && window.parent.document) {
            if (window.parent.document.getElementById("calendar")) {
                var obj = window.parent.document.getElementById("calendar");
                // alert("window.parent.document.getElementById('calendar') returned: "+obj);
                obj.setAttribute("width", ""+c.view_width);
                obj.setAttribute("height", ""+c.view_height);
            }
        }
    } catch(e) {
        // ignore it
        // alert("caught access to parent.document");
    }
    // get the view svg document
    // alert("setting view width="+c.view_width+" and height="+c.view_height);
    var view = document.getElementById("view");
    view.setAttribute("width", ""+c.view_width);
    view.setAttribute("height", ""+c.view_height);
    view.setAttribute("viewBox", "0 0 "+c.width+" "+c.height);

    // get the root svg document    
    var root = document.getElementById("root");
    root.setAttribute("width", ""+c.width);
    root.setAttribute("height", ""+c.height);

    // get the background rectangle
    var bgrect = document.getElementById("bgrect");
    bgrect.setAttribute("width", ""+c.width);
    bgrect.setAttribute("height", ""+c.height);

    generate();
}

function generate() {

    // compute the frame coordinates, centered
    c.fwidth = c.days*c.month_height;
    c.fheight = c.months*c.month_height;
    c.fx = 0.5 * (c.width - c.fwidth) + c.scale*c.offset_right;
    c.fy = 0.5 * (c.height - c.fheight) + c.scale*c.offset_down;
    
    // get the root svg document    
    var root = document.getElementById("root");
    // append a rectangle framing the entire calendar
    // root.appendChild(rect_node(c.fx, c.fy, c.fwidth, c.fheight, "none", "white", "frame"));

    // make a <g> for each month and put the month in it
    for (var i = 0; i < c.months; i += 1) {
        // generate <g>
        var g = g_node();
        // set the g id
        g.setAttribute("id", "m"+i);
        // translate g to correct y position
        g.setAttribute("transform", "translate(0,"+(c.fy+i*c.month_height)+")");
        // set height and width of g
        g.setAttribute("width", ""+c.width);
        g.setAttribute("height", ""+c.month_height+"px");
        // append a title node with information
        g.appendChild(title_node("this is month "+i));
        // create rectangle node
        // g.appendChild(rect_node(c.fx, 0, c.fwidth, c.month_height, "none", "white", "r"+i));
        // append g to root
        root.appendChild(g);
    }
    // draw the first month, starting a the nearest new moon
    generate_month(0, moon_at_phase(c.start, 0).getTime());
}

function generate_month(i, t) {
    // compute the month
    var m_date = compute_month(new Date(t), 8);

    // store the maximum and minimum
    if (c.min_date == null || c.min_date.getTime() > m_date[0].getTime())
        c.min_date = m_date[0];
    if (c.max_date == null || c.max_date.getTime() < m_date[8].getTime())
        c.max_date = m_date[8];

    // how to compute the x coordinate from the time
    function x_for_time(t) {
        return c.width/2                // the x coordinate of the full moon
            + (m_date[4].getTime()      // the time of the full moon
                - t)                    // minus the time of interest
                                        // milliseconds before full moon
            / c.millis_per_day          // convert to day.fraction_of_day
            * c.month_height;           // times the width of the day
    }
    // get the <g> node
    var g = document.getElementById("m"+i);

    // draw the frame for this month
    if (c.draw.frame) {
        var x1 = x_for_time(c.millis_per_day*Math.floor(1+m_date[8].getTime()/c.millis_per_day));
        var x2 = x_for_time(c.millis_per_day*Math.floor(m_date[0].getTime()/c.millis_per_day));
        g.appendChild(rect_node(x1, 0, x2-x1, c.month_height-1, "none", "white", "f"+i));
    }

    // put the moons in it
    if (c.draw.moons) {
        var y = 0.5*c.month_height;
        var r = (c.moon_per_cent/100.0)*c.month_height/2;
        for (var j = 0; j <= 8; j += 1) {
            var d = (j*45)%360;
            var x = x_for_time(m_date[j].getTime());
            g.appendChild(moon_node(d, x, y, r, "m"+d+"_"+i));        
        }
    }

    // mark the days
    if (c.draw.day_ticks || c.draw.day_numbers) {
        var f_t = m_date[4].getTime() / c.millis_per_day;                   // fractional date of full moon
        var n1_d = Math.floor(m_date[0].getTime() / c.millis_per_day);      // day of 1st new moon        
        var n2_d = Math.floor(m_date[8].getTime() / c.millis_per_day);      // day of 2nd new moon
        for (var d = n1_d; d <= n2_d+1; d += 1) {
            var t = d*c.millis_per_day;
            var x = x_for_time(t);
            var h = c.month_height;
            var day = new Date(t).getUTCDate();   // day of month
            if (c.draw.day_ticks)
                g.appendChild(day_tick_node(x, h, day));
            if (c.draw.day_numbers && d != n2_d+1)
                g.appendChild(day_number_node(x, h, day));
            if (d == n1_d || d == n2_d+1)
                g.appendChild(day_vertical_line(x, h));
        }
    }

    // note the start and end dates
    if (c.draw.new_moon_dates) {
        var w = c.month_height
        var x0 = x_for_time(m_date[0].getTime()-c.millis_per_day);
        var x8 = x_for_time(m_date[8].getTime()+c.millis_per_day); 
        g.appendChild(new_moon_date_right_node(x0, w, w, w, "white", m_date[0]));
        g.appendChild(new_moon_date_left_node(x8, w, w, w, "white", m_date[8]));
    }

    // mark the visible planet conjunctions
    if (c.draw.planets) {
        var p_date = compute_planets(m_date[0], m_date[1]);
        for (var j in p_date) {
            var x = x_for_time(p_date[j].getTime());
            var p = p_date[j].planet;
            g.appendChild(planet_node(x, c.moon_height/2, p, "grey"));
        }
    }
    // mark the lunar apogee and perigee
    if (c.draw.orbital_gees) {
    }
    // mark the ascending and descending nodes
    if (c.draw.nodes) {
    }
    // clear the cache
    clear_ephemerides_cache();
    // queue the next month or the end
    var step;
    if (++i < c.months) {
        // step to the next month
        // step = function() { generate_month(i, m_date[8].getTime()); };
        step = "generate_month("+i+","+m_date[8].getTime()+")";
    } else {
        // setTimeout(generate_finish, 50);
        // step = generate_finish;
        step = "generate_finish()";
    }
    c.next_step(step);
}

function generate_finish() {
    var root = document.getElementById("root");
    function time_format(d) {
        return ""+d.getUTCFullYear()+"."+(1+d.getUTCMonth())+"."+d.getUTCDate();
    }
    if (c.draw.title) {
        var start = time_format(c.min_date);
        var end = time_format(c.max_date);
        var x = c.width/2;
        var y = c.fy - 0.5*c.month_height;
        var fs = c.month_height/2;
        root.appendChild(calendar_title_node(x, y, fs, ""+start+" - Moons - "+end))
    }
    if (c.draw.copyright) {
        var start = time_format(c.min_date);
        var end = time_format(c.max_date);
        var x = c.width/2;
        var y = c.fy+(c.months+1)*c.month_height;
        var fs = c.month_height/3;
        root.appendChild(calendar_copyright_node(x, y, fs,
            start+" - "+"Moons - "+end+", Copyright \xa9 2006 by Roger E Critchlow Jr, Santa Fe, New Mexico, USA, http://elf.org/moons"));
    }
//    alert("set view width="+c.view_width+" and height="+c.view_height);
//    alert("setting root width="+c.width+" and height="+c.height);
//    alert("received window.location.search="+c.search);
}

//    failed test for useful unicode 
//    root.appendChild(calendar_copyright_node(x, y+c.month_height, fs,
//        "\u2640 - \u2641 - \u2642 - \u2643 - \u2644 - "+  // venus, earth, mars, jupiter, saturn
//        "\u2648 - \u2649 - \u264a - \u264b - \u264c - \u264d - \u264e - \u264f - \u2650 - \u2651 - \u2652 - \u2653 - "+  // zodiac signs
//        "\u260a - \u260b - \u260c - \u260d"));            // ascending and descending nodes, conjunction and opposition

//
// compute the n phases of the moon
//
function compute_month(date, n) {
    var month_date = new Array(n+1);
    month_date[0] = date;
    var dt = (29.5 / (n-1))*c.millis_per_day;
    for (var i = 1; i <= n; i += 1) {
        var from_date = new Date(month_date[i-1].getTime()+dt);
        month_date[i] = moon_at_phase(from_date, (i*(360/n))%360);
    }
    return month_date;
}

//
// find the conjunctions of the moon with planets from
// start date to end date
//
function compute_planets(start, end) {
    var planet_date = new Array();
    for (i in c.planets) {
        var p = c.planets[i];
        var d = moon_planet_conjunction(start, p);
        while (d != null && d.getTime() < end.getTime()) {
            d.planet = p;
            planet_date.push(d);
            d = moon_planet_conjunction(new Date(d.getTime()+c.millis_per_day), p);
        }
    }
    return planet_date;
}

//
// make elements
//
function calendar_title_node(x, y, fs, t) {
    var text = text_node(x, y, "white", t, "calendartitle");
    text.setAttribute("font-size", ""+fs);
    text.setAttribute("style", "text-anchor: middle");
    return text;
}
function calendar_copyright_node(x, y, fs, t) {
    var text = text_node(x, y, "white", t, "copyright");
    text.setAttribute("font-size", ""+fs);
    text.setAttribute("style", "text-anchor: middle");
    return text;
}
function day_tick_node(x, h, d) {
    if (d == 1) {
        var g = g_node();
        g.appendChild(day_vertical_line(x, h));
        g.appendChild(day_triangular_tick(x, h));
        return g;
    } else {
        return day_triangular_tick(x, h);
    }
}
function day_vertical_line(x, h) {
    return line_node_vertical(x, 0, h, "white");
}
function day_triangular_tick(x, h) {
    return triangle_node(x, 0.95*h, x-0.05*h, h, x, h, "white", "white");
}
function day_number_node(x, h, d) {
    var text = text_node(x-3, h-3, "white", ""+d, "daynumber");
    text.setAttribute("font-size", ""+(h/4)+"px");
    text.setAttribute("style", "text-anchor: end");
    return text;
}
function new_moon_date_left_node(x, y, w, h, fill, date) {
    var text = new_moon_date_node(x-4, y-(h/3), w, h, fill, date);
    text.setAttribute("style", "text-anchor: end");
    return text;
}
function new_moon_date_right_node(x, y, w, h, fill, date) {
    var text = new_moon_date_node(x+4, y-(h/3), w, h, fill, date);
    text.setAttribute("style", "text-anchor: start");
    return text;
}
function new_moon_date_node(x, y, w, h, fill, date) {
    // var d = date.getUTCFullYear()+"."+(1+date.getUTCMonth())+"."+date.getUTCDate();
    var d = date.getUTCFullYear()+"."+(1+date.getUTCMonth());
    var text = text_node(x, y, "white", d, "newmoondate")
    text.setAttribute("font-size", ""+(h/2)+"px");
    return text;
}
function planet_node(x, y, p, fill) {
    return g_node();
}
function moon_node(phase, cx, cy, r, id) {
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", phase_path_points(phase, cx, cy, r, 36));        
    path.setAttribute("fill", (phase != 0) ? "white" : "none");
    path.setAttribute("stroke", "white");
    path.setAttribute("id", id);
    return path;    
}
function title_node(text) {
    var title = document.createElementNS(SVG_NS, "title");
    title.appendChild(document.createTextNode(text));
    return title;
}
function g_node() {
    return document.createElementNS(SVG_NS, "g");
}
function text_node(x, y, fill, text, class_string) {
    var elt = document.createElementNS(SVG_NS, "text");
    elt.setAttribute("x", ""+x);
    elt.setAttribute("y", ""+y);
    elt.setAttribute("fill", ""+fill);
    elt.setAttribute("class", ""+class_string);
    elt.appendChild(document.createTextNode(""+text));
    return elt;
}
function rect_node(x, y, width, height, fill, stroke, id) {
    var rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", ""+width);
    rect.setAttribute("height", ""+height);
    rect.setAttribute("x", ""+x);
    rect.setAttribute("y", ""+y);
    rect.setAttribute("fill", ""+fill);
    rect.setAttribute("stroke", ""+stroke);
    rect.setAttribute("id", ""+id);
    return rect;
}
function line_node_vertical(x, y1, y2, stroke) {
    var line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", ""+x);
    line.setAttribute("y1", ""+y1);
    line.setAttribute("x2", ""+x);
    line.setAttribute("y2", ""+y2);
    line.setAttribute("stroke", ""+stroke);
    return line;
}
function triangle_node(x1, y1, x2,y2, x3,y3, fill, stroke) {
    var poly = document.createElementNS(SVG_NS, "path");
    poly.setAttribute("d", "M"+x1+","+y1+"L"+x2+","+y2+" "+x3+","+y3+"Z");
    poly.setAttribute("fill", ""+fill);
    poly.setAttribute("stroke", ""+stroke);
    return poly;
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
        var millis_per_degree = (27.3*24*60*60*1000) / 360;
        var x0 = time0;
        var y0 = error_in_moon_phase(x0);
        var x1 = x0 + 1.25 * y0 * millis_per_degree;
        var y1 = error_in_moon_phase(x1);
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
        
    // Verify bracketing
    if (y0 * y1 >= 0) {
        throw  "Function values at endpoints do not have different signs." +
                    "  Endpoints: [" + min + "," + max + "]" + 
                    "  Values: [" + y0 + "," + y1 + "]";       
    }   

    var x2 = x0;
    var y2 = y0;
    var delta = x1 - x0;
    var oldDelta = delta;

    var i = 0;
    while (i < maximalIterationCount) {
        // System.out.print("brent at i "+i+" x0 "+x0+" y0 "+y0+" x1 "+x1+" y1 "+y1+" x2 "+x2+" y2 "+y2+"\n");
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
            // alert("brent found "+y1+" in "+i+" iterations");
            return x1;
        }
        var dx = (x2 - x1);
        var tolerance =
            Math.max(relativeAccuracy * Math.abs(x1), absoluteAccuracy);
        if (Math.abs(dx) <= tolerance) {
            // alert("brent found "+y1+" in "+i+" iterations");
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
function ephemerides_at_time(t) {
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
