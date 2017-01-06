// requires:
// - doT
// - tablesorter
// - sortable_table JADE mixin

var messages_by_brand_summary_table = (function() {

    function init(selector, options) {
        var url = '/report/daily_messages_report?type=messages-by-brand&limit=10&from=' + options.from + '&to=' + options.to;

        if(options.brand) {
            url += '&brand=' + options.brand;
        }

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) {
            var html_string =
                '<div class="text-center"><button class="btn btn-xs btn-primary btn-export">Export</button></div>' +
                '<table class="table table-bordered table-striped tablesorter-hover messages-by-brand-summary-table">' +
                '<thead><tr><th>Brand</th><th style="width: 40px;">#</th><th style="width: 80px;">Resolved</th><th style="width: 120px;">Resolved on 1st contact</th></tr></thead>' +
                '<tbody>';

            // NOTE: we're only using the most recent result
            if(data.length > 0) {
                var totals = {};

                data.forEach(function(day_values) {
                    day_values.values.forEach(function(value) {
                        if(typeof(totals[value['brand']]) == 'undefined') {
                            totals[value['brand']] = {
                                count: 0,
                                resolved: 0,
                                resolved_on_first: 0,
                                name: value.name
                            };
                        }
                        totals[value['brand']].count += value.count;
                        totals[value['brand']].resolved += value.resolved;
                        totals[value['brand']].resolved_on_first += value.resolved_on_first;
                    });
                });

                Object.keys(totals).forEach(function(brand) {
                    html_string += '<tr data-id="' + brand + '">';
                    html_string += '<td>' + totals[brand]['name'] + '</td>';
                    html_string += '<td style="text-align: right;">' + totals[brand]['count'] + '</td>';
                    html_string += '<td style="text-align: right;">' + totals[brand]['resolved'] + '</td>';
                    html_string += '<td style="text-align: right;">' + totals[brand]['resolved_on_first'] + '</td>';
                    html_string += '</tr>';
                });
            }
            html_string += '</tbody></table>';
            selector.html(html_string);

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

            });
            selector.find('.btn-export').click(function() {
                 _handleCsv(data, options);
            });
            _rebindRowSelectEvent();
        });

        function _rebindRowSelectEvent() {
            $('table.tablesorter tbody tr td').unbind('click');
            $('table.tablesorter tbody tr td').on('click', function(evt) {
                // (this) is a td element in a given row
                var id = $(evt.target).parent().data('id');
                window.location.href = '/brand/view/' + id;
            });
        }

        function _handleCsv(data, options) {
            if(data.length == 0) {
                window.alert('no data');
                return;
            }
            var csv_contents = '"Brand","#","Resolved","Resolved on first contact"\n';

            var totals = {};

            data.forEach(function(day_values) {
                day_values.values.forEach(function(value) {
                    if(typeof(totals[value['brand']]) == 'undefined') {
                        totals[value['brand']] = {
                            count: 0,
                            resolved: 0,
                            resolved_on_first: 0,
                            name: value.name
                        };
                    }
                    totals[value['brand']].count += value.count;
                    totals[value['brand']].resolved += value.resolved;
                    totals[value['brand']].resolved_on_first += value.resolved_on_first;
                });
            });

            Object.keys(totals).forEach(function(brand) {
                csv_contents += '"' + totals[brand]['name'] + '"';
                csv_contents += ',"' + totals[brand]['count'] + '"';
                csv_contents += ',"' + totals[brand]['resolved'] + '"';
                csv_contents += ',"' + totals[brand]['resolved_on_first'] + '"\n';
            });
            var url = 'data:text/csv;charset=utf-8,' + csv_contents;
            window.open(encodeURI(url));
        }
    }

    return {
        init: init
    }
}());