// DEPRECATED - DELETE WHEN NO LONGER A USEFUL REFERENCE

var where_to_buys_by_platform_chart = (function() {

    function init(container, from, to, brand, type) {
        var url = '/report/where_to_buys?type=requests-by-platform&from=' + from + '&to=' + to; // 1401336000000, 1401422399999
        if(typeof(brand) != 'undefined') {
            url = '/report/where_to_buys/' + brand + '?type=requests-by-platform-for-brand&from=' + from + '&to=' + to; // 1401336000000, 1401422399999
        }

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) { // , text, jqXHR

            var series = [], counts_by_platform = {};
            data.forEach(function(record) {
                // record represents one day of data
                Object.keys(record.values).forEach(function(key) {
                    counts_by_platform[key] = typeof(counts_by_platform[key]) != 'undefined' ? counts_by_platform[key] : 0;
                    counts_by_platform[key] += record.values[key].count;
                });
            });
            Object.keys(counts_by_platform).forEach(function(platform) {
                series.push({name: platform, data: [counts_by_platform[platform]]});
            });

            if(Object.keys(counts_by_platform).length == 0) {
                container.html('<div style="margin-top: 50px;">No data found for the supplied period</div>');
                return;
            }

            container.html('<button class="btn-xs btn-primary btn-export-where-to-buy-by-platform">Export</button><div class="chart" style="width: 100%; height: 100%;"></div>');
            var chart_container = container.find('.chart');

            chart_container.highcharts({
                chart: {
                    type: 'column'
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                tooltip: {
                    pointFormat: (type === 'percent' ? '{series.name}: <b>{point.percentage:.1f}%</b>' : '{series.name}: <b>{point.y}</b>')
                },
                plotOptions: {
                    column: {
                        dataLabels: {
                            enabled: true
                        }
                    }
                },
                xAxis: {
                    labels: {
                        enabled: false
                    }
                },
                yAxis: {
                    allowDecimals: false,
                    labels: {
                        enabled: false
                    }
                },
                series: series
            });

            container.find('button.btn-export-where-to-buy-by-platform').click(function() {
                window.location.href = url + '&format=csv';
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
