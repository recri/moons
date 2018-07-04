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

export function parse_search(search, proto, defaults, validations) {
    var params = new Object();

    //
    // merge default values into the params arrays
    //
    function merge_defaults() {
        if (defaults != null) {
            for (var i in defaults) {
                if (params[i] == null) {
                    if (defaults[i] == null)
                        alert("default for "+i+" is null?");
                    params[i] = defaults[i];
                }
            }
        }
        return params;
    }
    //
    // validate values in params
    //
    function validate_values() {
        if (validations != null) {
            for (var i in params) {
                if (params[i] == null)
                    alert("param for "+i+" is null?");
                else if (validations[i] == null)
                    alert("validation function for "+i+" is null?");
                else
                    params[i] = validations[i](params[i]);
                
            }
        }
        return params;
    }
    
    var vals = unescape(search.substr(1).replace(/\+/g, ' ')).split('&');
    // alert("decoding params from: "+search);
    // alert("split into "+vals.length+" values");
    for (var i in vals) {
        var nv = vals[i].split('=');
        var name = nv[0];
        var value = nv[1];
        // alert("parsing parameter "+i+" from string: "+vals[i]+", decoded name='"+name+"' and value='"+value+"'");
        if (proto[name] != null) {
            if (proto[name] != name)
                name = proto[name];
            params[name] = value;
        } else {
            alert("unrecognized parameter: '"+name+"' with value '"+value+"'");
        }
    }
    params = merge_defaults();
    params = validate_values();
    return params;
}
