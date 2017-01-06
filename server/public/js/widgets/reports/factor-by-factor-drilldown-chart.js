var factor_by_factor_drilldown_chart = (function() {

    // disable_back: back button disabled when drilldown active
    // drilldowns: {type (e.g. "age"): {report_type: string, data_handler: function, title: string, chart_type: string (e.g. "pie")} }
    // drilldown_display_property: the name of the property in the series object to display when drilling down (primary_property used if this is not given),
    // csv_handler: callback for when csv export is requested,
    // title
    // report_type
    // path
    function init(container, options) {
        if(!options.drilldown) {
            return;
        }

        var drilldown_provider = options.drilldowns[options.drilldown];
        if(!drilldown_provider) {
            return;
        }

        $.ajax({
            type: 'GET',
            url: options.path + '?type=' + drilldown_provider.report_type + '&from=' + options.from + '&to=' + options.to // 1401336000000, 1401422399999
        }).success(function(data) { // , text, jqXHR

            var series = drilldown_provider.data_handler(data, options);
            if(series.length == 0) {
                var html_contents = '';
                if(typeof(options.disable_back) == 'undefined' || !options.disable_back) {
                    html_contents += '<button class="btn btn-xs btn-primary btn-back" style="margin-right: 10px;">Back</button>';
                }
                html_contents += '<div class="clearfix"></div><div style="margin-top: 50px;">No data found for the supplied period</div>';
                container.html(html_contents);
                return;
            }

            var display_name = options[options.primary_property];

            if(typeof(options.drilldown_display_property) != 'undefined') {
                display_name = options.drilldown_display_property;
            }

            container.html('<div class="clearfix chart-title">' + drilldown_provider.title + ' for ' + display_name + (drilldown_provider.type == "percent" ? ' (%)' : '') + '</div>' +
                '<button class="btn btn-xs btn-primary btn-back" style="margin-right: 10px;">Back</button>' +
                '<button class="btn btn-xs btn-primary btn-export">Export</button>' +
                '<div class="chart" style="width: 100%; height: 100%;"></div>');
            var chart_container = container.find('.chart');

            if(typeof(options.chart_type) == 'undefined' || options.chart_type == 'pie') {
                chart_container.highcharts({
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        margin: 0
                    },
                    credits: {
                        enabled: false
                    },
                    title: {
                        text: ''
                    },
                    tooltip: {
                        pointFormat: (options.type === 'percent' ? '{series.name}: <b>{point.percentage:.1f}%</b>' : '{series.name}: <b>{point.y}</b>')
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                //format: (options.type === 'percent' ? '<b>{point.name}</b>: {point.percentage:.1f} %' : '<b>{point.name}</b>: {point.y}'),
                                formatter: function() {
                                    if(this.series.data.length > 5 && this.point.percentage < 5) {
                                        return null;
                                    }
                                    var cleaned_name = this.point.name;
                                    //var cleaned_name = general_util.renderLabelTrimCenter(this.point, 25);
                                    if(options.type === 'percent') {
                                        return '<b>' + cleaned_name + '</b>: ' + this.point.percentage.toFixed(1) + ' %';
                                    }
                                    return '<b>' + cleaned_name + '</b>: ' + this.point.y;
                                },
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                                    fontSize: '10px'
                                },
                                distance: typeof(drilldown_provider.chart_label_distance) != 'undefined' ? drilldown_provider.chart_label_distance : 20
                            }
                        }
                    },
                    series: [{
                        type: 'pie',
                        name: options.unit,
                        data: series
                    }]
                });
            }

            container.find('button.btn-export').click(function() {
                if(typeof(drilldown_provider.csv_handler) != 'undefined') {
                    drilldown_provider.csv_handler(data, options);
                    return;
                }
                window.location.href = options.path + '?type=' + drilldown_provider.report_type + '&format=csv&from=' +
                    options.from + '&to=' + options.to;
                return false;
            });

            $('button.btn-back').click(function() {
                factor_by_factor_chart.init(container, options);
            });

        }).error(function(data) { // , text
            alert_modal.showFromXHR('Error', data);
        });
    }

    return {
        init: init
    }
}());
