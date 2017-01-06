// requires:
// - doT
// - tablesorter
// - sortable_table JADE mixin

var report_favorites_table = (function() {

    function init(selector, options) {
        var url = '/report/daily_favorites_report?type=favorite-brands-as-product-favorites&limit=10&from=' + options.from + '&to=' + options.to;
        if(options.brand) {
            url += '&brand=' + options.brand;
        }

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) {
            var html_string = '<div class="text-center"><button class="btn btn-xs btn-primary btn-export">Export</button></div>' +
                '<table class="table table-bordered table-striped tablesorter-hover favorites-table">' +
                '<thead><tr><th>Brand</th><th>Favorites</th></tr></thead>' +
                '<tbody>';

            //TODO: sort by date desc

            // NOTE: we're only using the most recent result
            if(data.length > 0) {
                var row = data[0];
                row.values.forEach(function(value) {
                    html_string += '<tr data-id="' + value['brand'] + '">';
                    html_string += '<td>' + value['name'] + '</td>';
                    html_string += '<td style="text-align: right;">' + value['count'] + '</td>';
                    html_string += '</tr>';
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
            _rebindRowSelectEvent();

            selector.find('.btn-export').click(function() {
                // data -> csv
                var row = data[0];
                var csv_string = '"Brand","Favorites"\n';
                row.values.forEach(function(value) {
                    csv_string += '"' + value['name'] + '"';
                    csv_string += ',"' + value['count'] + '"';
                    csv_string += '\n';
                });
                var url = 'data:text/csv;charset=utf-8,' + csv_string;
                window.open(encodeURI(url));
            });
        });

        function _rebindRowSelectEvent() {
            $('table.tablesorter tbody tr td').unbind('click');
            $('table.tablesorter tbody tr td').on('click', function(evt) {
                // (this) is a td element in a given row
                var id = $(evt.target).parent().data('id');
                window.location.href = '/brand/view/' + id;
            });
        }
    }

    return {
        init: init
    }
}());