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
// generate the <path> for a polygon that represents
// a moon with elongation from the sun: phase; centered
// at: cx, cy; with radius: r; and using n points.
//
export function phase_path_points(phase, cx, cy, r, n) {
    var xy = "";
    var cosphase = Math.cos((180-phase)*2*3.14159/360);
    var cmd = "M";
    for (var i = 0; i < n; i += 1) {
        var radians = 2*3.14159*(i%n)/n;
        var x = r*Math.sin(radians);
        var y = -r*Math.cos(radians);
        if (phase != 0 && ((phase < 180 && i > n/2) || (phase > 180 && i < n/2)))
            x *= cosphase;
        x += cx;
        y += cy;
        xy += ""+cmd+""+x+","+y;
        cmd = "L";
    }
    xy += "Z";
    return xy;
}
