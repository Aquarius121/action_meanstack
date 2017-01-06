var factor_by_factor_chart = (function() {

    // options:
    // path: root report path
    // title:
    // primary_property: "platform", etc
    // from: starting timeframe
    // to: ending timeframe
    // type: "percent", etc
    // data_handler: function(data, options),
    // disable_export: export button disabled
    // csv_handler: callback for when csv export is requested
    // on_drilldown: function called when a drilldown is requested
    function init(container, options) {
        var url = options.path + '?type=' + options.report_type + '&from=' + options.from + '&to=' + options.to; // 1401336000000, 1401422399999;

        if(typeof(options.filters) != 'undefined') {
            Object.keys(options.filters).forEach(function(filter_key) {
                if(typeof(options.filters[filter_key]) != 'undefined') {
                    url += '&' + filter_key + '=' + options.filters[filter_key];
                }
            });
        }

        // path = /report/daily_logins_report
        // report_type = logins-by-platform
        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) { // , text, jqXHR

            var series = options.data_handler(data, options);
            if(series.length == 0) {
                container.html('<div style="margin-top: 50px;">No data found for the supplied period</div>');
                return;
            }

            // build exports, etc row as well as chart contents
            var html_contents = '<div class="clearfix chart-title">' + options.title + (options.type === 'percent' ? ' (%)' : '') + '</div>';
            if(typeof(options.disabled_export) == 'undefined' || options.disabled_export != true) {
                html_contents += '<button class="btn btn-xs btn-primary btn-export">Export</button>';
            }
            html_contents += '<div class="chart" style="width: 100%; height: 100%;"></div>';
            container.html(html_contents);

            // actually do the charting
            var chart_container = container.find('.chart');
            chart_container.highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    margin: typeof(options.chart_margin) != 'undefined' ? options.chart_margin : 0
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
                            formatter: function() {
                                if(this.series.data.length > 5 && this.point.percentage < 5) {
                                    return null;
                                }
                                var cleaned_name = this.point.name;
                                //var cleaned_name = general_util.renderLabelTrimCenter(this.point, 40);
                                if(options.type === 'percent') {
                                    return '<b>' + cleaned_name + '</b>: ' + this.point.percentage.toFixed(1) + ' %';
                                }
                                return '<b>' + cleaned_name + '</b>: ' + this.point.y;
                            },
                            //format: (options.type === 'percent' ?  : '<b>{point.name}</b>: {point.y}'),
                            style: {
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                                fontSize: '10px',
                                width: '120px'
                            },
                            distance: typeof(options.chart_label_distance) != 'undefined' ? options.chart_label_distance : 20
                        },
                        events: {
                            click: function(e) {
                                if(typeof(options.on_drilldown) != 'undefined') {
                                    options.on_drilldown(e);
                                }
                            }
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
                if(typeof(options.csv_handler) != 'undefined') {
                    options.csv_handler(data, options);
                    return;
                }
                window.location.href = options.path + '?type=' + options.report_type + '&format=csv&from=' +
                    options.from + '&to=' + options.to;
                return false;
            });

        }).error(function(data, text) {
            alert_modal.showFromXHR('Error', data);
        });
    }

    function hcLabelRender(point, lineMaxChars){
        var s = point.name;
        var r = "";
        var lastAppended = 0;
        var lastSpace = -1;
        for (var i = 0; i < s.length; i++) {
            if (s.charAt(i) == ' ') lastSpace = i;
            if (i - lastAppended > lineMaxChars) {
                if (lastSpace == -1) lastSpace = i;
                r += s.substring(lastAppended, lastSpace);
                lastAppended = lastSpace;
                lastSpace = -1;
                r += "<br>";
            }
        }
        r += s.substring(lastAppended, s.length);
        return r;
    }

    return {
        init: init
    }
}());
