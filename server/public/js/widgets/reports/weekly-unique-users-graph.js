// requires:
// - moment.js

var weekly_unique_users_graph = (function() {

    var chart_template_def = '<div class="chart-title">Weekly Unique Users</div>' +
        '<button class="btn btn-xs btn-primary btn-export">Export</button>' +
        '<div class="graph-container"></div>';

    // options:
    // path: '/report/unique_users'
    // report_type: 'unique-users-by-week',
    function init(container, options) {
        var min_date = moment(options.to).day(-7).subtract('weeks', 3);
        min_date.set('hour', 0);
        min_date.set('minute', 0);
        min_date.set('second', 0);
        min_date.set('millisecond', 0);

        var start_date = options.from;
        if(min_date.valueOf() < options.from) {
            start_date = min_date.valueOf();
        }

        var url = options.path + '?type=' + options.report_type + '&from=' + start_date + '&to=' + options.to; // 1401336000000, 1401422399999;

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) { // , text, jqXHR

            var series = _dataHandler(data, options);
            if (series.length == 0) {
                container.html('<div class="text-center" style="margin-top: 50px; margin-bottom: 50px;">No data found for the supplied period</div>');
                return;
            }

            container.html(chart_template_def);

            /*
            // compute tick positions (week starts)
            var tickPositions = [], tickTimeIterator = moment(start_date);
            while(tickTimeIterator.valueOf() < options.to) {
                tickPositions.push(tickTimeIterator.valueOf());
                tickTimeIterator = tickTimeIterator.week(tickTimeIterator.week() + 1);
                tickTimeIterator.set('date', 1);
                tickTimeIterator.set('hour', 0);
                tickTimeIterator.set('minute', 0);
                tickTimeIterator.set('second', 0);
                tickTimeIterator.set('millisecond', 0);
            }
            */

            container.find('.graph-container').highcharts({
                title: {
                    text: ''
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        return '<b>' + moment(this.x).format('MMMM DD') + '</b>: ' + this.y + ' unique user' + (this.y != 1 ? 's' : '');
                    }
                },
                xAxis: {
                    min: start_date,
                    max: options.to_time,
                    startOnTick: true,
                    labels: {
                        formatter: function() {
                            return moment(this.value + 1).format('MMM DD');
                        }
                    }
                    //tickPositions: tickPositions
                    //categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                },
                yAxis: {
                    title: {
                        text: 'users'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle',
                    borderWidth: 0
                },
                series: series
            });

            container.find('button.btn-export').click(function() {
                _csvHandler(data, options);
            });
        });
    }

    function _dataHandler(data, options) {
        var values = {};

        data.forEach(function(week_record) {
            week_record.values.forEach(function(platform_record) {
                //platform, count
                if(typeof(values[platform_record.platform]) == 'undefined') {
                    values[platform_record.platform] = [];
                }
                values[platform_record.platform].push([week_record.to_time, platform_record.count]);
            });
        });

        var series = [];
        Object.keys(values).forEach(function(inner_key) {
            // TODO: for each inner_key, we need to make sure each week in the range has a record (even if we must add a 0)

            var final_data = values[inner_key];
            final_data.sort(function(a, b) {
                return a[0] - b[0];
            });

            series.push({
                name: inner_key,
                data: final_data
            });
        });

        return series;
    }

    function _csvHandler(data, options) {
        var values = {}, day_values = {};

        data.forEach(function(week_record) {
            week_record.values.forEach(function(platform_record) {
                //platform, count
                if(typeof(values[platform_record.platform]) == 'undefined') {
                    values[platform_record.platform] = {};
                }
                day_values[week_record.to_time] = 1;
                values[platform_record.platform][week_record.to_time] = platform_record.count;
            });
        });

        var platforms = Object.keys(values);
        var csv_contents = '"Week End Date"';
        platforms.forEach(function(inner_key) {
            csv_contents += ',' + '"' + inner_key + '"';
        });
        csv_contents += '\n';

        var series = [];
        Object.keys(day_values).forEach(function(day_key) {
            csv_contents += '"' + moment(parseInt(day_key)).format('MMM DD') + '"';
            platforms.forEach(function(platform) {
                var final_data = values[platform][day_key];
                if(typeof(final_data) != 'undefined') {
                    csv_contents += ',"' + final_data + '"';
                } else {
                    csv_contents += ',"0"';
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