const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";


export function generateSVG(c) {

    // set a handler to timeout
    // avoid by using a Web Worker
    c.next_step = function(func) { setTimeout(func, 50); };     // continuation to avoid browser time out

    // compute the overall height and width
    // this might be wrong if the height and width are actual page size
    var cell_height = c.border+c.months+c.border;
    var cell_width = c.border+c.days+c.border;
    var month_height = 1000; // c.view_height / cell_height;
    var day_width = 1000; // c.view_width / cell_width;
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
            start+" - "+"Moons - "+end+", Copyright \xa9 2018 by Roger E Critchlow Jr, Charlestown, MA, USA, http://elf.org/moons"));
    }
//    alert("set view width="+c.view_width+" and height="+c.view_height);
//    alert("setting root width="+c.width+" and height="+c.height);
//    alert("received window.location.search="+c.search);
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
