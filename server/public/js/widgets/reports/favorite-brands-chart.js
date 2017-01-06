var favorites_by_brand_chart = (function() {

    // uses favorites-by-factor-chart
    // this does not use the factor-by-factor-chart because that chart assumes that it is summing
    // results for the specified period, but this report only uses the most recent data-point
    // TODO: investigate to see if this is entirely true ^^

    // options:
    // path: root report path
    // title:
    // from: starting timeframe
    // to: ending timeframe
    // type: "percent", etc
    // drilldowns: {type: {report_type: string, data_handler: function, title: string} }
    // data_handler: function(data, options)
    function init(container, options) {
        var report_favorites_by_factor_options = {
            path: '/report/daily_favorites_report',
            from: options.from,
            to: options.to,
            brand: options.brand,
            brand_name: options.brand_name,
            unit: 'favorites',
            drilldown: $('select.drilldown').val(),
            drilldowns: {
                'age': {
                    report_type: 'favorites-by-brand-and-age',
                    title: 'Favorites by Age for ' + options.brand_name,
                    csv_handler: _handleFavoritesByAgeCsv,
                    data_handler: function(data, options) {
                        var most_recent_day = _getMostRecentDay(data);

                        if(typeof(most_recent_day) == 'undefined') {
                            return [];
                        }

                        var series = [], values = {};
                        most_recent_day.values.forEach(function(favorites_record) {
                            if(favorites_record.brand == options.brand) {
                                favorites_record.age.forEach(function(data_record) {
                                    var key = data_record.age.trim();
                                    key = key.length > 0 ? key : '?';

                                    values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                                    values[key] += data_record.count;
                                });
                            }
                        });

                        Object.keys(values).forEach(function(inner_key) {
                            series.push([inner_key == '?' ? '?' : general_util.getAgeTextFromGroupNumber(inner_key), values[inner_key]]);
                        });
                        series = general_util.limitChartSeries(series, 10);
                        return series;
                    }
                },
                'gender': {
                    report_type: 'favorites-by-brand-and-gender',
                    title: 'Favorites by Gender for ' + options.brand_name,
                    csv_handler: _handleFavoritesByGenderCsv,
                    data_handler: function(data, options) {
                        var most_recent_day = _getMostRecentDay(data);

                        if(typeof(most_recent_day) == 'undefined') {
                            return [];
                        }

                        var series = [], values = {};
                        most_recent_day.values.forEach(function(favorites_record) {
                            if(favorites_record.brand == options.brand) {
                                favorites_record.gender.forEach(function(data_record) {
                                    var key = data_record.gender ? data_record.gender.trim() : '?';
                                    key = key.length > 0 ? key : '?';

                                    values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                                    values[key] += data_record.count;
                                });
                            }
                        });

                        Object.keys(values).forEach(function(inner_key) {
                            series.push([inner_key == '?' ? '?' : general_util.getGenderTextFromNumber(inner_key), values[inner_key]]);
                        });
                        series = general_util.limitChartSeries(series, 10);
                        return series;
                    }
                },
                'state': {
                    report_type: 'favorites-by-brand-and-state',
                    title: 'Favorites by State for ' + options.brand_name,
                    csv_handler: _handleFavoritesByStateCsv,
                    data_handler: function(data, options) {
                        var most_recent_day = _getMostRecentDay(data);

                        if(typeof(most_recent_day) == 'undefined') {
                            return [];
                        }

                        var series = [], values = {};
                        most_recent_day.values.forEach(function(favorites_record) {
                            if(favorites_record.brand == options.brand) {
                                favorites_record.state.forEach(function(data_record) {
                                    var key = data_record.state.trim();
                                    key = key.length > 0 ? key : '?';

                                    values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                                    values[key] += data_record.count;
                                });
                            }
                        });

                        Object.keys(values).forEach(function(inner_key) {
                            series.push([inner_key == '?' ? '?' : inner_key, values[inner_key]]);
                        });
                        series = general_util.limitChartSeries(series, 10);
                        return series;
                    }
                },
                'zip': {
                    report_type: 'favorites-by-brand-and-zip',
                    title: 'Favorites by Zip for ' + options.brand_name,
                    csv_handler: _handleFavoritesByZipCsv,
                    data_handler: function(data, options) {
                        var most_recent_day = _getMostRecentDay(data);

                        if(typeof(most_recent_day) == 'undefined') {
                            return [];
                        }

                        var series = [], values = {};
                        most_recent_day.values.forEach(function(favorites_record) {
                            if(favorites_record.brand == options.brand) {
                                favorites_record.zip.forEach(function(data_record) {
                                    var key = data_record.zip.trim();
                                    key = key.length > 0 ? key : '?';

                                    values[key] = typeof(values[key]) != 'undefined' ? values[key] : 0;
                                    values[key] += data_record.count;
                                });
                            }
                        });

                        Object.keys(values).forEach(function(inner_key) {
                            series.push([inner_key == '?' ? '?' : inner_key, values[inner_key]]);
                        });
                        series = general_util.limitChartSeries(series, 10);
                        return series;
                    }
                }
            }
        };
        favorites_by_factor_chart.init(container, report_favorites_by_factor_options);
    }

    function _getMostRecentDay(data) {
        var most_recent_day, most_recent_day_timestamp = 0;
        data.forEach(function(day_record) {
            if(day_record.to_time > most_recent_day_timestamp) {
                most_recent_day = day_record;
                most_recent_day_timestamp = day_record.to_time;
            }
        });
        return most_recent_day;
    }

    function _handleFavoritesByAgeCsv(data, options) {
        _handleFavoritesByFactorCsv(data, options, 'age', function(age) {
            return general_util.getAgeTextFromGroupNumber(age);
        });
    }

    function _handleFavoritesByGenderCsv(data, options) {
        _handleFavoritesByFactorCsv(data, options, 'gender', function(gender) {
            return general_util.getGenderTextFromNumber(gender);
        });
    }

    function _handleFavoritesByStateCsv(data, options) {
        _handleFavoritesByFactorCsv(data, options, 'state', function(state) {
            return state;
        });
    }

    function _handleFavoritesByZipCsv(data, options) {
        _handleFavoritesByFactorCsv(data, options, 'zip', function(zip) {
            return zip;
        });
    }

    function _handleFavoritesByFactorCsv(data, options, factor, factorPrettyPrint) {
        var values = {}, factor_values = {};

        var day_record = _getMostRecentDay(data);

        day_record.values.forEach(function(brand_day_record) {
            if(brand_day_record.brand != options.brand) {
                return;
            }
            values[brand_day_record.brand] = {
                name: brand_day_record.brand_name,
                values: {}
            };
            brand_day_record[factor].forEach(function(factor_record) {
                factor_values[factor_record[factor]] = 1;
                values[brand_day_record.brand].values[factor_record[factor]] = factor_record.count;
            });
        });

        var factors = Object.keys(factor_values);
        var csv_contents = '"Brand"';
        factors.forEach(function(factor) {
            csv_contents += ',"' + factorPrettyPrint(factor) + '"';
        });
        csv_contents += '\n';

        Object.keys(values).forEach(function(brand) {
            var brand_record = values[brand];
            csv_contents += '"' + brand_record.name + '"';

            factors.forEach(function(factor) {
                csv_contents += ',"';
                if(typeof(brand_record.values[factor]) == 'undefined') {
                    csv_contents += '0"';
                } else {
                    csv_contents += brand_record.values[factor] + '"';
                }
            });
            csv_contents += '\n';
        });

        var url = 'data:text/csv;charset=utf-8,' + csv_contents;
        window.open(encodeURI(url));
    }

    return {
        init: init
    }
}());
