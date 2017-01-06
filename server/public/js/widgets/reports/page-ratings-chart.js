// requires:
// - highcharts
// - moment.js

var page_ratings_chart = (function() {

    var chart_template_def = '<div class="chart-title">Page Ratings</div>' +
        '<button class="btn btn-xs btn-primary btn-export">Export</button>' +
        '<div class="graph-container"></div>';

    // options:
    // path: '/report/unique_users'
    // report_type: 'unique-users-by-week',
    function init(container, options) {
        var start_date = options.from;

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

            container.find('.graph-container').highcharts({
                title: {
                    text: ''
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        return '<b>' + moment(this.x).format('MMMM DD') + '</b>: ' + this.y + ' average rating';
                    }
                },
                xAxis: {
                    startOnTick: true,
                    labels: {
                        formatter: function() {
                            return moment(this.value + 1).format('MMM DD');
                        }
                    },
                    tickInterval: 86400000
                    //tickPositions: tickPositions
                    //categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                },
                yAxis: {
                    title: {
                        text: 'rating'
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

            $(window).trigger('resize');

            container.find('button.btn-export').click(function() {
                _csvHandler(data, options);
            });
        });
    }

    function _dataHandler(data, options) {
        var values = {};

        data.forEach(function(day_record) {
            day_record.values.forEach(function(page_record) {
                if(typeof(values[page_record.page]) == 'undefined') {
                    values[page_record.page] = [];
                }

                var sum = 0, count = 0;
                page_record.ratings.forEach(function(rating) {
                    count += rating.count;
                    sum += (rating.count * rating.value);
                });

                var avg = Math.floor(sum * 10 / count) / 10;
                values[page_record.page].push([day_record.to_time, avg]);
            });
        });

        var series = [];
        Object.keys(values).forEach(function(inner_key) {
            // TODO: for each inner_key, we need to make sure each day in the range has a record (even if we must add a 0)

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
        var values = {}, day_values = {}, pages = {};

        data.forEach(function(day_record) {
            day_values[day_record.to_time] = {};
            var day_value = day_values[day_record.to_time];

            day_record.values.forEach(function(page_record) {
                pages[page_record.page] = 1;

                day_value[page_record.page] = {};

                var sum = 0, count = 0;
                page_record.ratings.forEach(function(rating) {
                    values[rating.value] = 1;

                    count += rating.count;
                    sum += (rating.count * rating.value);
                });
                day_value[page_record.page] = Math.floor(sum * 10 / count) / 10;
            });
        });

        var page_list = Object.keys(pages);
        var csv_contents = '"Date"';
        page_list.forEach(function(inner_key) {
            csv_contents += ',' + '"' + inner_key + '"';
        });
        csv_contents += '\n';

        var series = [];
        Object.keys(day_values).forEach(function(day_key) {
            csv_contents += '"' + moment(parseInt(day_key)).format('MMM DD') + '"';
            page_list.forEach(function(platform) {
                var final_data = day_values[day_key][platform];
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