/**
@license
Copyright (c) 2018 Roger E Critchlow Jr.  All rights reserved.
This code may only be used under the BSD style license found at http://recri.github.io/change/LICENSE.txt
*/

import { 
    MONTH, DAY, YEAR, MONTHS, PHASES,
    SHOW_DAYS, SHOW_MONDAYS, 
    SHOW_MONTHS, SHOW_YEARS, 
    SHOW_NODES, SHOW_PLANETS,
    SHOW_ARIES, SHOW_ZODIAC,
    SHOW_STARS,
    START
} from '../actions/moons.js';

import { store } from '../store.js';

const moons = (state = { 
    month: 6,
    day: 15,
    year: 1951,
    months: 37,
    phases: 8,
    showDays: true,
    showMondays: true,
    showMonths: true,
    showYears: true,
    showNodes: false,
    showPlanets: false,
    showAries: false,
    showZodiac: false,
    showStars: false,
    start: false
}, action) => {
    switch (action.type) {
    case MONTH: return { ...state, month: action.month };
    case DAY: return {...state, day: action.day };
    case YEAR: return {...state, year: action.year };
    case MONTHS: return {...state, months: action.months };
    case PHASES: return {...state, phases: action.phases };
    case SHOW_DAYS: return {...state, showDays: action.showDays };
    case SHOW_MONDAYS: return {...state, showMondays: action.showMondays };
    case SHOW_MONTHS: return {...state, showMonths: action.showMonths };
    case SHOW_YEARS: return {...state, showYears: action.showYears };
    case SHOW_NODES: return {...state, showNodes: action.showNodes };
    case SHOW_PLANETS: return {...state, showPlanets: action.showPlanets };
    case SHOW_ARIES: return {...state, showAries: action.showAries };
    case SHOW_ZODIAC: return {...state, showZodiac: action.showZodiac };
    case SHOW_STARS: return {...state, showStars: action.showStars };
    case START: return {...state, start: action.start };
    default: return state;
    }
}

export default moons;
