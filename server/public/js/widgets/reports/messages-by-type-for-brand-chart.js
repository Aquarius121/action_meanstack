// requires:
// - factor_by_factor_drilldown_chart
// - factor_by_factor_chart

var messages_by_type_for_brand_chart = (function() {

    function init(container, external_options) {
        var options = {
            from: external_options.from,
            to: external_options.to,
            type: external_options.type,
            drilldown: external_options.drilldown,
            title: 'Contacts by Type for ' + external_options.brand_name,
            path: '/report/daily_messages_report',
            report_type: 'messages-by-brand-and-type',
            unit: 'contacts',
            primary_property: 'brand',
            disable_back: true,
            brand: external_options.brand,

            on_drilldown: function(e) {
                if(typeof(e.point.key) != 'undefined') {
                    options[options.primary_property] = e.point.key;
                    options.drilldown_display_property = e.point.name;
                } else {
                    options[options.primary_property] = e.point.name;
                }

                factor_by_factor_drilldown_chart.init(container, options);
            },

            data_handler: function(data, options) {
                var series = [], values = {};
                data.forEach(function(record) {

                    // record represents one day of data
                    record.values.forEach(function(value) {

                        if(value.brand == external_options.brand) {
                            value.counts.forEach(function(count) {
                                if(typeof(values[count.type]) == 'undefined') {
                                    values[count.type] = {
                                        brand: value.brand,
                                        name: value.name,
                                        count: 0
                                    };
                                }
                                values[count.type].count += count.count;
                            });
                        }
                    });
                });
                Object.keys(values).forEach(function(brand_key) {
                    series.push({name: brand_key, y: values[brand_key].count, key: brand_key});
                });
                series = general_util.limitChartSeries(series, 10, function(val) { return val.y; });
                return series;
            },

            csv_handler: _handleCsv
        };

        factor_by_factor_chart.init(container.find('.chart-container'), options);
    }

    function _handleCsv(data, options) {
        var series = [], values = {}, day_data = [];
        data.forEach(function(record) {
            var day_record = {
                from_time: record.from_time,
                values: {}
            };

            record.values.forEach(function(value) {
                if(value.brand == options.brand) {
                    value.counts.forEach(function(count) {
                        values[count.type] = 1;
                        day_record.values[count.type] = count.count;
                    });
                }
            });
            day_data.push(day_record);
        });

        var value_list = Object.keys(values);
        var csv_string = '"Date"';
        value_list.forEach(function(value) {
            csv_string += ',"' + value + '"';
        });
        csv_string += '\n';

        day_data.forEach(function(day) {
            csv_string += '"' + moment(day.from_time).format('MM/DD/YYYY') + '"';
            value_list.forEach(function(value_type) {
                if(typeof(day.values[value_type]) != 'undefined') {
                    csv_string += ',"' + day.values[value_type] + '"';
                } else {
                    csv_string += ',0';
                }
            });
            csv_string += '\n';
        });

        var csv_contents = 'data:text/csv;charset=utf-8,' + csv_string;
        window.open(encodeURI(csv_contents));
    }

    return {
        init: init
    }
}());
