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
// parse a window.location.search string into an object.
// use the proto object to supply aliases
// and the set of allowed parameters.
// optionally merge defaults
// optionally validate values
//

export const parse_search = (search, {proto, defaults, validations, params}) => {

    //
    // merge default values into the params arrays
    //
    const merge_defaults = () => {
        if (defaults) {
            for (var i in defaults) {
                if (typeof params[i] === 'undefined') {
                    if (typeof defaults[i] === 'undefined')
                        alert("no default for "+i+"?");
		    else
			params[i] = defaults[i];
                }
            }
        }
    }
    //
    // validate values in params
    //
    const validate_values = () => {
        if (validations) {
            for (var i in params) {
                if (typeof params[i] === 'undefined')
                    alert("no param for "+i+"?");
                else if (typeof validations[i] === 'undefined')
                    alert("no validation function for "+i+"?");
                else
                    params[i] = validations[i](params[i]);
            }
        }
    }
    
    for (let [name, value] of new URLSearchParams(search)) {
        if (proto[name]) {
            if (proto[name] != name)
                name = proto[name];
            params[name] = value;
        } else {
            alert("unrecognized parameter: '"+name+"' with value '"+value+"'");
        }
    }

    merge_defaults();
    validate_values();

    return params;
}
