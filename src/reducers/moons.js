/**
@license
Copyright (c) 2018 Roger E Critchlow Jr.  All rights reserved.
This code may only be used under the BSD style license found at http://recri.github.io/change/LICENSE.txt
*/

import { 
    SEARCH, MONTH_DATA
} from '../actions/moons.js';

import { store } from '../store.js';

const moons = (state = { 
    search: ''
}, action) => {
    switch (action.type) {
    case SEARCH: return {...state, search: action.search };
    case MONTH_DATA: return {...state, monthData: action.monthData };
    default: return state;
    }
}

export default moons;
