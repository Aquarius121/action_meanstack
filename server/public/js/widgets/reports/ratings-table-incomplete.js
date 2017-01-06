// requires:
// - doT
// - tablesorter
// - sortable_table JADE mixin

var ratings_table = (function() {

    function init(selector, options) {
        var url = '/report/daily_page_ratings_report?type=ratings-totals&from=' + options.from + '&to=' + options.to;
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

            if(data.length == 0) {
                html_string += '</tbody></table>';
                selector.html(html_string);
                return;
            }

            // get distinct values
            var pages = {}, ratings = {}, days = {};
            data.forEach(function(day_value) {
                days[day_value.to_time] = 1;
                day_value.values.forEach(function(page_value) {
                    pages[page_value.page] = 1;

                    page_value.ratings.forEach(function(rating_for_page) {
                        ratings[rating_for_page.value] = 1;
                    });
                });
            });

            /*
            var ratings_as_array = Object.keys(ratings);
            data.forEach(function(day_value) {
                day_value.values.forEach(function(page_value) {
                    var day_record = {};
                    ratings_as_array.forEach(function(master_rating) {
                        day_record[master_rating] = 0;
                    });

                    page_value.ratings.forEach(function(rating_for_page) {
                        day_record[rating_for_page.value] = rating_for_page.count;
                    });
                    page_values[page_value.page].days.push(day_record);
                });
            });

            // NOTE: we're only using the most recent result
            page_values.forEach(function(page_value_key) {
                page_values[page_value_key].days.forEach(function)
                html_string += '<tr data-id="' + value['brand'] + '">';
                html_string += '<td>' + value['brand_name'] + '</td>';
                html_string += '<td style="text-align: right;">' + value['count'] + '</td>';
                html_string += '</tr>';
            });
            */

            html_string += '</tbody></table><div class="pager-container"></div>';
            selector.html(html_string);
            //table_pager.init(selector.find('.pager-container'));

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
                /*
                .tablesorterPager({
                container: selector.find('.pager-container').find('.pager'),
                savePages: false,
                size: 15
            });
            */
            selector.css('display', '');
            _rebindRowSelectEvent();

            selector.find('.btn-export').click(function() {
                // data -> csv
                var row = data[0];
                var csv_string = '"Brand","Favorites"\n';
                row.values.forEach(function(value) {
                    csv_string += '"' + value['brand_name'] + '"';
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