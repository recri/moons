/**
@license
Copyright (c) 2018 Roger E Critchlow Jr.  All rights reserved.
This code may only be used under the BSD style license found at http://recri.github.io/change/LICENSE.txt
*/

export const SEARCH = 'SEARCH';
export const MONTH_DATA = 'MONTH_DATA';

export const newSearch = (search) => (dispatch) => dispatch({ type: SEARCH, search });
export const newMonthData = (monthData) => (dispatch) => dispatch({ type: MONTH_DATA, monthData });
