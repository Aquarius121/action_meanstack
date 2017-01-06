var users_table_widget = (function() {

    var properties = ['last_name', 'first_name', 'email', 'role', 'resolved_survey'];

    function init(selector_string, product_list) {
        if(typeof(product_list) != 'undefined') {
            var html_string = '';
            product_list.forEach(function(row) {
                html_string += '<tr>';
                properties.forEach(function(property) {
                    html_string += '<td>' + row[property] + '</td>';
                });
                html_string += '</tr>';
            });
            $(selector_string).find('tbody').html(html_string);
        }
        sortable_table.init(selector_string);
        $(selector_string).css('display', '');
        _rebindRowSelectEvent();
    }

    function initAjax(selector_string, table_sort_order) {
        var table = $(selector_string);

        table.bind('filterEnd', function(){
            _rebindRowSelectEvent();
        });

        table.tablesorter( {
            sortList: typeof(table_sort_order) != 'undefined' ? table_sort_order : [[0,0]],

            widgets: ["filter"],
            widgetOptions : {
                filter_childRows : false,
                filter_columnFilters : true,
                filter_cssFilter : '',
                filter_filteredRow   : 'filtered',
                filter_formatter : null,
                filter_functions : null,
                filter_hideFilters : false,
                filter_ignoreCase : true,
                filter_liveSearch : true,
                filter_reset : 'button.reset',
                filter_searchDelay : 500,
                filter_serversideFiltering: true,
                filter_startsWith : false,
                filter_useParsedData : false
            }

        }).tablesorterPager({
                container: $(".pager"),
                ajaxUrl : '/user?{filterList:filter}&{sortList:column}&page={page}&pageSize={size}',
                size: 100,
                savePages: false,
                removeRows: true,

                customAjaxUrl: function(table, url) {
                    var url_parsed = $.url(url);
                    var params = url_parsed.param();

                    var new_query = 'pageSize=' + params['pageSize'] + '&page=' + params['page'];
                    // column[]
                    if(Array.isArray(params.filter)) {
                        params.filter.forEach(function(filter_value, index) {
                            new_query += '&filter[' + _getColumnNameFromIndex(index) + ']=' + filter_value;
                        });
                    }
                    if(Array.isArray(params.column)) {
                        params.column.forEach(function(sort_value, index) {
                            new_query += '&sort[' + _getColumnNameFromIndex(index) + ']=' + sort_value;
                        });
                    }

                    return url_parsed.attr('path') + '?' + new_query;
                },

                ajaxProcessing: function(data){
                    if (data && data.hasOwnProperty('rows')) {
                        var r, row, c, d = data.rows,

                        // total number of rows (required)
                        total = data.total_records,

                        // array of header names (optional)
                        headers = data.headers,

                        // all rows: array of arrays; each internal array has the table cell data for that row
                        rows = [],

                        // len should match pager set size (c.size)
                        len = d.length;

                        // rows
                        var default_value;
                        for ( r=0; r < len; r++ ) {
                            row = [];

                            // cells
                            row.push('<div data-id="' + d[r]._id + '">' + _getSafeValue(d[r], properties[0]) + '</div>');
                            for (var i=1; i<properties.length; i++) {
                                default_value = (i == properties.length - 1 ? "false" : "");
                                row.push(_getSafeValue(d[r], properties[i], default_value));
                            }

                            rows.push(row); // add new row array to rows array
                        }
                        // in version 2.10, you can optionally return $(rows) a set of table rows within a jQuery object
                        return [ total, rows, headers ];
                    }
                }
            }).bind('pagerComplete', function(event, options) {
                _rebindRowSelectEvent();
            });
    }

    function _getSafeValue(val, key, default_val) {
        var default_to_use = (default_val ? default_val : '');

        if(typeof(val) == 'undefined' || val == null) {
            return default_to_use;
        }
        if(typeof(val[key]) == 'undefined' || val[key] == null) {
            return default_to_use;
        }
        return val[key];
    }

    function _rebindRowSelectEvent() {
        $('table.tablesorter tbody tr td').unbind('click');
        $('table.tablesorter tbody tr td').on('click', function(evt) {
            // (this) is a td element in a given row
            var id = $(evt.target).parent().find('[data-id]').data('id');
            window.location.href = '/user/view/' + id;
        });
    }

    function _getColumnNameFromIndex(index) {
        return index >= 0 && index < properties.length ? properties[index] : null;
    }

    return {
        init: init,
        initAjax: initAjax
    }
}());