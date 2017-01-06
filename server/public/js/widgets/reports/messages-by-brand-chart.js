// requires:
// - factor_by_factor_drilldown_chart
// - factor_by_factor_chart

var messages_by_brand_chart = (function() {

    function init(container, external_options) {
        var options = {
            from: external_options.from,
            to: external_options.to,
            type: external_options.type,
            drilldown: external_options.drilldown,
            title: 'Contacts by Brand',
            path: '/report/daily_messages_report',
            report_type: 'messages-by-brand',
            unit: 'contacts',
            primary_property: 'brand',
            disable_back: false,
            csv_handler: _messagesByBrandCsvHandler,

            on_drilldown: function(e) {
                if(typeof(e.point.key) != 'undefined') {
                    options.brand = e.point.key;
                    options.drilldown_display_property = e.point.name;
                } else {
                    options.brand = e.point.name;
                }

                factor_by_factor_drilldown_chart.init(container.find('.chart-container'), options);
            },

            data_handler: _messagesByBrandHandler,

            drilldowns: {
                'age':  {
                    title: 'Messages by Age',
                    report_type: 'messages-by-brand-and-age',
                    data_handler: _messagesByBrandAndAgeHandler,
                    csv_handler: _messagesByBrandAndAgeCsvHandler
                },
                'gender':  {
                    title: 'Messages by Gender',
                    report_type: 'messages-by-brand-and-gender',
                    data_handler: _messagesByBrandAndGenderHandler,
                    csv_handler: _messagesByBrandAndGenderCsvHandler
                },
                'state':  {
                    title: 'Messages by State',
                    report_type: 'messages-by-brand-and-state',
                    data_handler: _messagesByBrandAndStateHandler,
                    csv_handler: _messagesByBrandAndStateCsvHandler
                },
                'zip':  {
                    title: 'Messages by Zip',
                    report_type: 'messages-by-brand-and-zip',
                    data_handler: _messagesByBrandAndZipHandler,
                    csv_handler: _messagesByBrandAndZipCsvHandler
                }
            }
        };

        factor_by_factor_chart.init(container.find('.chart-container'), options);
    }

    // handlers, etc

    function _messagesByBrandHandler(data, options) {
        var series = [], values = {};
        data.forEach(function(record) {
            // record represents one day of data
            record.values.forEach(function(value) {
                if(typeof(values[value.brand]) == 'undefined') {
                    values[value.brand] = {
                        brand: value.brand,
                        name: value.name,
                        count: 0
                    };
                }
                values[value.brand].count += value.count;
            });
        });
        Object.keys(values).forEach(function(brand_key) {
            series.push({name: values[brand_key].name, y: values[brand_key].count, key: brand_key});
        });
        series = general_util.limitChartSeries(series, 10, function(val) { return val.y; });
        return series;
    }

    function _messagesByBrandAndAgeHandler(data, options) {
        var series = [], values = {}, brand = options.brand;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.brand == brand) {
                    platform_record.counts.forEach(function(age_record) {
                        // {age_range: "1", count: 1}
                        var key = (age_record.age_range + '').trim();
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

    function _messagesByBrandAndGenderHandler(data, options) {
        var series = [], values = {}, brand = options.brand;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.brand == brand) {
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

    function _messagesByBrandAndStateHandler(data, options) {
        var series = [], values = {}, brand = options.brand;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.brand == brand) {
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

    function _messagesByBrandAndZipHandler(data, options) {
        var series = [], values = {}, brand = options.brand;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.brand == brand) {
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

    function _messagesByBrandCsvHandler(data, options) {
        options.keyGetter = function(value) {
            return value.brand;
        };
        options.nameGetter = function(value) {
            return value.name;
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _messagesByBrandAndAgeCsvHandler(data, options) {
        options.filterFunction = function(value) {
            return value.brand == options.brand;
        };
        options.keyGetter = function(value) {
            return value.brand;
        };
        options.nameGetter = function(value) {
            return value.brand_name;
        };
        options.secondaryValueGetter = function(value) {
            var text = general_util.getAgeTextFromGroupNumber(value);
            return text.length > 0 ? text : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.age_range
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _messagesByBrandAndGenderCsvHandler(data, options) {

        options.filterFunction = function(value) {
            return value.brand == options.brand;
        };
        options.keyGetter = function(value) {
            return value.brand;
        };
        options.nameGetter = function(value) {
            return value.brand_name;
        };
        options.secondaryValueGetter = function(value) {
            var text = general_util.getGenderTextFromNumber(value);
            return text.length > 0 ? text : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.gender
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _messagesByBrandAndStateCsvHandler(data, options) {

        options.filterFunction = function(value) {
            return value.brand == options.brand;
        };
        options.keyGetter = function(value) {
            return value.brand;
        };
        options.nameGetter = function(value) {
            return value.brand_name;
        };
        options.secondaryValueGetter = function(value) {
            return value.length > 0 ? value : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.state
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _messagesByBrandAndZipCsvHandler(data, options) {

        options.filterFunction = function(value) {
            return value.brand == options.brand;
        };
        options.keyGetter = function(value) {
            return value.brand;
        };
        options.nameGetter = function(value) {
            return value.brand_name;
        };
        options.secondaryValueGetter = function(value) {
            return value.length > 0 ? value : '?';
        };
        options.secondaryKeyGetter = function(value) {
            return value.zip
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromMultiFactorReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    return {
        init: init
    }
}());
