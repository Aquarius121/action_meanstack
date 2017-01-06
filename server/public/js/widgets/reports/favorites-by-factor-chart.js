var favorites_by_factor_chart = (function() {

    // options:
    // path: root report path
    // title:
    // from: starting timeframe
    // to: ending timeframe
    // type: "percent", etc
    // drilldowns: {type: {report_type: string, data_handler: function, title: string} }
    // data_handler: function(data, options)
    function init(container, options) {
        if(!options.drilldown) {
            return;
        }

        var drilldown_provider = options.drilldowns[options.drilldown];
        if(!drilldown_provider) {
            return;
        }

        // path = /report/daily_logins_report
        // report_type = logins-by-platform
        var url = options.path + '?type=' + drilldown_provider.report_type + '&from=' + options.from + '&to=' + options.to; // 1401336000000, 1401422399999;

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) { // , text, jqXHR

            var series = drilldown_provider.data_handler(data, options);
            if(series.length == 0) {
                container.html('<div style="margin-top: 50px;">No data found for the supplied period</div>');
                return;
            }

            container.html('<div class="clearfix">' + drilldown_provider.title + (options.type === 'percent' ? ' (%)' : '') + '</div><button class="btn-xs btn-primary btn-export-logins-by-platform">Export</button><div class="chart" style="width: 100%; height: 100%;"></div>');
            var chart_container = container.find('.chart');

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
                            format: (options.type === 'percent' ? '<b>{point.name}</b>: {point.percentage:.1f} %' : '<b>{point.name}</b>: {point.y}'),
                            style: {
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                            },
                            distance: 20
                        }
                    }
                },
                series: [{
                    type: 'pie',
                    name: options.unit,
                    data: series
                }]
            });

            container.find('button.btn-export').click(function() {
                drilldown_provider.csv_handler(data, options);
                return false;
            });

        }).error(function(data, text) {
            alert_modal.showFromXHR('Error', data);
        });
    }

    return {
        init: init
    }
}());
