// requires:
// - doT
// - tablesorter

var opt_ins_table = (function() {

    function init(selector, options) {
        var url_opt = '/report/daily_opt_in_report?type=opt-in-total&limit=1&from=' + options.from + '&to=' + options.to;

        $.ajax({
            type: 'GET',
            url: url_opt
        }).success(function(opt_in_data) {

            var url_brand = '/report/daily_opt_in_report?type=opt-in-totals-by-brand&limit=1&from=' + options.from + '&to=' + options.to;
            if(options.brand) {
                url_brand += '&brand=' + options.brand;
            }

            $.ajax({
                type: 'GET',
                url: url_brand
            }).success(function(data) {
                _onData(selector, opt_in_data, data, options);
            });
        });

        function _onData(selector, opt_in_data, data, options) {
            var html_string = '<div class="text-center"><button class="btn btn-xs btn-primary btn-export">Export</button></div>' +
                '<table class="table table-bordered table-striped tablesorter-hover favorites-table">' +
                '<thead><tr><th>Optable Party</th><th>Opt In Count</th></tr></thead>' +
                '<tbody>';

            if(!opt_in_data || opt_in_data.length == 0) {
                html_string += '</tbody></table>';
                selector.html(html_string);
                return;
            }

            var latest_action_opt = opt_in_data[0];

            html_string += '<tr><td>Action</td>' + '<td>' + latest_action_opt.count + '</td>' + '</tr>';

            if(data && data.length > 0) {
                var results = data[0].values, value;

                Object.keys(results).forEach(function(key) {
                    value = results[key];

                    // brand, brand_name, counts = {}
                    html_string +='<tr><td>' + value.name + '</td>';
                    html_string += '<td>' + value.count + '</td>';
                    //html_string += '<td>' + out_total + '</td></tr>';
                });
            }

            html_string += '</tbody></table><div class="pager-container"></div>';
            selector.html(html_string);

            table_pager.init(selector.find('.pager-container'));
            selector.find('table').tablesorter( {
                sortList: typeof(table_sort_order) != 'undefined' ? table_sort_order : [[1,1]],

                widgets: [],
                widgetOptions : {
                    filter_childRows : false,
                    filter_columnFilters : true,
                    filter_cssFilter : '',
                    filter_filteredRow   : 'filtered',
                    filter_formatter : null,
                    filter_functions : null,
                    filter_hideFilters : true,
                    filter_ignoreCase : true,
                    filter_liveSearch : true,
                    filter_reset : 'button.reset',
                    filter_searchDelay : 300,
                    filter_serversideFiltering: false,
                    filter_startsWith : false,
                    filter_useParsedData : false
                }

            }).tablesorterPager({
                container: selector.find('.pager-container').find('.pager'),
                savePages: false,
                size: 15
            });

            selector.find('button.btn-export').click(function() {
                _csvHandler(opt_in_data, data, options);
            });
        }
    }

    function _csvHandler(opt_in_data, data, options) {
        var csv_string = '"Target","Opt-ins"\n';
        csv_string += '"Action",' + opt_in_data[0].count + '\n';

        if(data && data.length > 0) {
            var results = data[0].values, value;

            Object.keys(results).forEach(function(key) {
                value = results[key];

                csv_string += '"' + value.name + '",';
                csv_string += value.count;
                csv_string += '\n';
            });
        }

        var csv_contents = 'data:text/csv;charset=utf-8,' + csv_string;
        window.open(encodeURI(csv_contents));
    }

    return {
        init: init
    }
}());