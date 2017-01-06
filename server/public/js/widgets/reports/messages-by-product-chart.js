// requires:
// - factor_by_factor_drilldown_chart
// - factor_by_factor_chart

var messages_by_product_chart = (function() {

    function init(container, external_options) {
        var options = {
            from: external_options.from,
            to: external_options.to,
            type: external_options.type,
            drilldown: external_options.drilldown,
            title: 'Contacts by Product',
            path: '/report/daily_messages_report',
            report_type: 'messages-by-product',
            unit: 'contacts',
            primary_property: 'product',
            chart_margin: 30,
            chart_label_distance: 40,
            csv_handler: _messagesByProductCsvHandler,
            //disable_back: false,
            //apply_drilldown_as: external_options.apply_drilldown_as,
            filters: {
                brand: external_options.brand
            },

            on_drilldown: function(e) {
                if(typeof(e.point.key) != 'undefined') {
                    options[options.primary_property] = e.point.key;
                    options.drilldown_display_property = e.point.name;
                } else {
                    options[options.primary_property] = e.point.name;
                }

                factor_by_factor_drilldown_chart.init(container.find('.chart-container'), options);
            },

            data_handler: function(data, options) {
                var series = [], values = {};
                data.forEach(function(record) {
                    // record represents one day of data
                    record.values.forEach(function(value) {
                        if(typeof(values[value.ean]) == 'undefined') {
                            values[value.ean] = {
                                ean: value.ean,
                                brand: value.brand,
                                name: value.name ? value.name : '?',
                                count: 0
                            };
                        }
                        values[value.ean].count += value.count;
                    });
                });
                Object.keys(values).forEach(function(product_key) {
                    series.push({name: values[product_key].name, y: values[product_key].count, key: product_key});
                });
                series = general_util.limitChartSeries(series, 10, function(val) { return val.y; });
                return series;
            },

            drilldowns: {
                'age': {
                    title: 'Messages by Age',
                    report_type: 'messages-by-product-and-age',
                    data_handler: _messagesByProductAndAgeHandler,
                    csv_handler: _messagesByProductAndAgeCsvHandler
                },
                'gender': {
                    title: 'Messages by Gender',
                    report_type: 'messages-by-product-and-gender',
                    data_handler: _messagesByProductAndGenderHandler,
                    csv_handler: _messagesByProductAndGenderCsvHandler
                },
                'state':  {
                    title: 'Messages by State',
                    report_type: 'messages-by-product-and-state',
                    data_handler: _messagesByProductAndStateHandler,
                    csv_handler: _messagesByProductAndStateCsvHandler
                },
                'zip':  {
                    title: 'Messages by Zip',
                    report_type: 'messages-by-product-and-zip',
                    data_handler: _messagesByProductAndZipHandler,
                    csv_handler: _messagesByProductAndZipCsvHandler
                }
            }
        };

        factor_by_factor_chart.init(container.find('.chart-container'), options);
    }

    function _messagesByProductAndAgeHandler(data, options) {
        var series = [], values = {}, product = options.product;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.ean == product) {
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

    function _messagesByProductAndStateHandler(data, options) {
        var series = [], values = {}, product = options.product;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.ean == product) {
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

    function _messagesByProductAndGenderHandler(data, options) {
        var series = [], values = {}, product = options.product;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{gender: "1", count: 1}]

                if(platform_record.ean == product) {
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

    function _messagesByProductAndZipHandler(data, options) {
        var series = [], values = {}, product = options.product;
        data.forEach(function(day_record) {
            // record represents one day of data
            day_record.values.forEach(function(platform_record) {
                // platform: 'web', counts: [{age_range: "1", count: 1}]

                if(platform_record.ean == product) {
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

    function _messagesByProductCsvHandler(data, options) {
        options.keyGetter = function(value) {
            return value.ean;
        };
        options.nameGetter = function(value) {
            return value.name;
        };
        var csv_contents = 'data:text/csv;charset=utf-8,' + general_util.buildCsvFromReportRecord(data, options);

        window.open(encodeURI(csv_contents));
    }

    function _messagesByProductAndAgeCsvHandler(data, options) {
        options.filterFunction = function(value) {
            return value.ean == options.product;
        };
        options.keyGetter = function(value) {
            return value.ean;
        };
        options.nameGetter = function(value) {
            return value.product_name;
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

    function _messagesByProductAndGenderCsvHandler(data, options) {
        options.filterFunction = function(value) {
            return value.ean == options.product;
        };
        options.keyGetter = function(value) {
            return value.ean;
        };
        options.nameGetter = function(value) {
            return value.product_name;
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

    function _messagesByProductAndStateCsvHandler(data, options) {
        options.filterFunction = function(value) {
            return value.ean == options.product;
        };
        options.keyGetter = function(value) {
            return value.ean;
        };
        options.nameGetter = function(value) {
            return value.product_name;
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

    function _messagesByProductAndZipCsvHandler(data, options) {
        options.filterFunction = function(value) {
            return value.ean == options.product;
        };
        options.keyGetter = function(value) {
            return value.ean;
        };
        options.nameGetter = function(value) {
            return value.product_name;
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
