var brand_owners_table_widget = (function() {

    var properties = ['name', 'link'];

    var brand_owners_template_def =
        '{{~it :value:index}}<tr>' +
            '<td>{{=value.name}}</td>' +
            '<td>{{=value.link ? value.link : ""}}</td>' +
        '</tr>{{~}}';

    var brand_owners_template = doT.template(brand_owners_template_def);

    function init(selector_string, owner_list) {
        $(selector_string).find('tbody').html(brand_owners_template(owner_list));
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
            sortList: typeof(table_sort_order) != 'undefined' ? table_sort_order : [[2,0]],

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
            ajaxUrl : '/brand-owner?{filterList:filter}&{sortList:column}&page={page}&pageSize={size}',
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

                    // this will depend on how the json is set up - see City0.json
                    // rows
                    for ( r=0; r < len; r++ ) {
                        row = [];

                        // cells
                        row.push('<div data-id="' + d[r]._id + '">' + _getSafeValue(d[r], properties[0]) + '</div>');
                        row.push(_getSafeValue(d[r], properties[1]));

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

    function _getSafeValue(val, key) {
        if(typeof(val) == 'undefined' || val == null) {
            return "";
        }
        if(typeof(val[key]) == 'undefined' || val[key] == null) {
            return "";
        }
        return val[key];
    }

    function _rebindRowSelectEvent() {
        $('table.tablesorter tbody tr td').unbind('click');
        $('table.tablesorter tbody tr td').on('click', function(evt) {
            // (this) is a td element in a given row
            var id = $(evt.target).parent().find('[data-id]').data('id');
            window.location.href = '/brand-owner/view/' + id;
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