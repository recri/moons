/**
@license
Copyright (c) 2018 Roger E Critchlow Jr.  All rights reserved.
This code may only be used under the BSD style license found at http://recri.github.io/change/LICENSE.txt
*/

export const MONTH = 'MONTH';
export const DAY = 'DAY';
export const YEAR = 'YEAR';
export const MONTHS = 'MONTHS';
export const PHASES = 'PHASES';
export const SHOW_DAYS = 'SHOW_DAYS';
export const SHOW_MONDAYS = 'SHOW_MONDAYS';
export const SHOW_MONTHS = 'SHOW_MONTHS';
export const SHOW_YEARS = 'SHOW_YEARS';
export const SHOW_NODES = 'SHOW_NODES';
export const SHOW_PLANETS = 'SHOW_PLANETS';
export const SHOW_ARIES = 'SHOW_ARIES';
export const SHOW_ZODIAC = 'SHOW_ZODIAC';
export const SHOW_STARS = 'SHOW_STARS';
export const START = 'START';

export const newMonth = (month) => (dispatch) => dispatch({ type: MONTH, month });
export const newDay = (day) => (dispatch) => dispatch({ type: DAY, day });
export const newYear = (year) => (dispatch) => dispatch({ type: YEAR, year });
export const newMonths = (months) => (dispatch) => dispatch({ type: MONTHS, months });
export const newPhases = (phases) => (dispatch) => dispatch({ type: PHASES, phases });
export const newShowDays = (showDays) => (dispatch) => dispatch({ type: SHOW_DAYS, showDays });
export const newShowMondays = (showMondays) => (dispatch) => dispatch({ type: SHOW_MONDAYS, showMondays });
export const newShowMonths = (showMonths) => (dispatch) => dispatch({ type: SHOW_MONTHS, showMonths });
export const newShowYears = (showYears) => (dispatch) => dispatch({ type: SHOW_YEARS, showYears });
export const newShowNodes = (showNodes) => (dispatch) => dispatch({ type: SHOW_NODES, showNodes });
export const newShowPlanets = (showPlanets) => (dispatch) => dispatch({ type: SHOW_PLANETS, showPlanets });
export const newShowAries = (showAries) => (dispatch) => dispatch({ type: SHOW_ARIES, showAries });
export const newShowZodiac = (showZodiac) => (dispatch) => dispatch({ type: SHOW_ZODIAC, showZodiac });
export const newShowStars = (showStars) => (dispatch) => dispatch({ type: SHOW_STARS, showStars });
export const start = (start) => (dispatch) => dispatch({ type: START, start });

