// requires:
// - factor_by_factor_drilldown_chart
// - factor_by_factor_chart

var logins_by_platform_chart = (function() {

    function init(container, external_options) {
        var options = {
            from: external_options.from,
            to: external_options.to,
            type: external_options.type,
            drilldown: external_options.drilldown,
            title: 'Activity by Platform',
            path: '/report/daily_logins_report',
            report_type: 'logins-by-platform',
            unit: 'activity',
            primary_property: 'platform',

            on_drilldown: function(e) {
                options[options.primary_property] = e.point.name;
                factor_by_factor_drilldown_chart.init(container, options);
            },

            data_handler: function(data, options) {
                var series = [], values = {};
                data.forEach(function(record) {
                    // record represents one day of data
                    Object.keys(record.values).forEach(function(key) {
                        values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                        values[key] += record.values[key];
                    });
                });
                Object.keys(values).forEach(function(platform) {
                    series.push([platform, values[platform]]);
                });
                series = general_util.limitChartSeries(series, 10);
                return series;
            },

            drilldowns: {
                'age':  {
                    title: 'Activity by Age',
                    report_type: 'logins-by-platform-and-age',
                    data_handler: _handleLoginsByPlatformAndAge,
                    csv_handler: _loginsByPlatformAndAgeCsv
                },
                'gender':  {
                    title: 'Activity by Gender',
                    report_type: 'logins-by-platform-and-gender',
                    data_handler: _handleLoginsByPlatformAndGender,
                    csv_handler: _loginsByPlatformAndGenderCsv
                },
                'state':  {
                    title: 'Activity by State',
                    report_type: 'logins-by-platform-and-state',
                    data_handler: _handleLoginsByPlatformAndState,
                    csv_handler: _loginsByPlatformAndStateCsv
                },
                'zip':  {
                    title: 'Logins by Zip',
                    report_type: 'logins-by-platform-and-zip',
                    data_handler: _handleLoginsByPlatformAndZip,
                    csv_handler: _loginsByPlatformAndZipCsv
                }
            }
        };

        factor_by_factor_chart.init(container, options);
    }

    function _handleLoginsByPlatformAndAge(data, options) {
        var series = [], values = {}, platform = options.platform;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.platform == platform) {
                    platform_record.counts.forEach(function(age_record) {
                        // {age_range: "1", count: 1}
                        var key = age_record.age_range.trim();
                        key = key.length > 0 ? key : '?';

                        values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                        values[key] += age_record.count;
                    });
                }
            });
        });
        Object.keys(values).forEach(function(inner_key) {
            series.push([inner_key == '?' ? '?' : general_util.getAgeTextFromGroupNumber(inner_key), values[inner_key]]);
        });
        series = general_util.limitChartSeries(series, 10);
        return series;
    }

    function _handleLoginsByPlatformAndGender(data, options) {
        var series = [], values = {}, platform = options.platform;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.platform == platform) {
                    platform_record.counts.forEach(function(gender_record) {
                        // {age_range: "1", count: 1}
                        var key = gender_record.gender.trim();
                        key = key.length > 0 ? key : '?';

                        values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                        values[key] += gender_record.count;
                    });
                }
            });
        });
        Object.keys(values).forEach(function(inner_key) {
            series.push([inner_key == '?' ? '?' : general_util.getGenderTextFromNumber(inner_key), values[inner_key]]);
        });
        series = general_util.limitChartSeries(series, 10);
        return series;
    }

    function _handleLoginsByPlatformAndState(data, options) {
        var series = [], values = {}, platform = options.platform;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.platform == platform) {
                    platform_record.counts.forEach(function(state_record) {
                        // {age_range: "1", count: 1}
                        var key = state_record.state.trim();
                        key = key.length > 0 ? key : '?';

                        values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                        values[key] += state_record.count;
                    });
                }
            });
        });
        Object.keys(values).forEach(function(inner_key) {
            series.push([inner_key == '?' ? '?' : inner_key, values[inner_key]]);
        });
        series = general_util.limitChartSeries(series, 10);
        return series;
    }

    function _handleLoginsByPlatformAndZip(data, options) {
        var series = [], values = {}, platform = options.platform;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.platform == platform) {
                    platform_record.counts.forEach(function(zip_record) {
                        // {age_range: "1", count: 1}
                        var key = zip_record.zip.trim();
                        key = key.length > 0 ? key : '?';

                        values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                        values[key] += zip_record.count;
                    });
                }
            });
        });
        Object.keys(values).forEach(function(inner_key) {
            series.push([inner_key == '?' ? '?' : inner_key, values[inner_key]]);
        });
        series = general_util.limitChartSeries(series, 10);
        return series;
    }

    function _loginsByPlatformAndAgeCsv(data, options) {
        options.filterFunction = function(value) {
            return value.platform == options.platform;
        };
        options.keyGetter = function(value) {
            return value.platform;
        };
        options.nameGetter = function(value) {
            return value.platform;
        };
        options.secondaryValueGetter = function(value) {
            var text = general_util.getAgeTextFromGroupNumber(value);
            return text.length > 0 ? text : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.age_range;
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _loginsByPlatformAndStateCsv(data, options) {
        options.filterFunction = function(value) {
            return value.platform == options.platform;
        };
        options.keyGetter = function(value) {
            return value.platform;
        };
        options.nameGetter = function(value) {
            return value.platform;
        };
        options.secondaryValueGetter = function(value) {
            return value.length > 0 ? value : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.state;
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _loginsByPlatformAndGenderCsv(data, options) {
        options.filterFunction = function(value) {
            return value.platform == options.platform;
        };
        options.keyGetter = function(value) {
            return value.platform;
        };
        options.nameGetter = function(value) {
            return value.platform;
        };
        options.secondaryValueGetter = function(value) {
            var text = general_util.getGenderTextFromNumber(value);
            return text.length > 0 ? text : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.gender;
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _loginsByPlatformAndZipCsv(data, options) {
        options.filterFunction = function(value) {
            return value.platform == options.platform;
        };
        options.keyGetter = function(value) {
            return value.platform;
        };
        options.nameGetter = function(value) {
            return value.platform;
        };
        options.secondaryValueGetter = function(value) {
            return value.length > 0 ? value : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.zip;
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    return {
        init: init
    }
}());
