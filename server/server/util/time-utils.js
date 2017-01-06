var moment = require('moment');

module.exports = {
    getStartOfDay: _getStartOfDay,
    getEndOfDay: _getEndOfDay,

    getStartOfToday: _getStartOfToday,
    getStartOfTodayUTC: _getStartOfTodayUTC,
    getStartOfMonth: _getStartOfMonth,
    getStartOfCurrentMonthUTC: _getStartOfCurrentMonthUTC,
    getEndOfMonth: _getEndOfMonth,
    subtractDay: _subtractDay,
    subtractMonth: _subtractMonth
};

function _getStartOfDay(moment_to_use) {
    var to_return = moment_to_use.clone();
    to_return.set('hour', 0);
    to_return.set('minute', 0);
    to_return.set('second', 0);
    to_return.set('millisecond', 0);
    return to_return;
}

function _getEndOfDay(moment_to_use) {
    return _getStartOfDay(moment_to_use).add({'day': 1, 'milliseconds': -1});
}

function _getStartOfToday() {
    return moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0})
}

function _getStartOfTodayUTC() {
    return moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).utc();
}

function _getStartOfMonth(moment_to_use) {
    var to_return = moment_to_use.clone();
    to_return.set('date', 1);
    to_return.set('hour', 0);
    to_return.set('minute', 0);
    to_return.set('second', 0);
    to_return.set('millisecond', 0);
    return to_return;
}

function _getStartOfCurrentMonthUTC() {
    var today_start = _getStartOfTodayUTC();
    today_start.date(1);
    return today_start;
}

function _getEndOfMonth(day_as_moment) {
    return day_as_moment.add({'month': 1, 'milliseconds': -1});
}

function _subtractDay(day_as_moment) {
    return day_as_moment.add({'day': -1});
}

function _subtractMonth(day_as_moment) {
    return day_as_moment.add({'months': -1});
}
