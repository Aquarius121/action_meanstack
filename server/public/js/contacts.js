
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    $('.pager').css('position', '');
    $('.contacts-table').css('display', '');

    $('table.contacts-table').tablesorter( {
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
            ajaxUrl : '../contacts?{filterList:filter}&{sortList:column}&page={page}&pageSize={size}',
            size: 15,
            savePages: false,
            removeRows: true,

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
                        row.push(getSafeValue(d[r], 'name'));
                        row.push(getSafeValue(d[r], 'address1'));
                        row.push(getSafeValue(d[r], 'city'));
                        row.push(getSafeValue(d[r], 'country'));

                        var tools_cell = "";

                        tools_cell += '<a href="/contact/view/' + d[r]._id + '">';
                        tools_cell += '<i class="icon-search ui-tooltip" data-placement="bottom" data-original-title="View" style="background-color: rgba(0,0,0,0); color: #00aa00;"></i></a>';

                        /*
                         if(canDelete) {
                         tools_cell += '<a onclick=deletePOS("' + d[r]._id + '") style="margin-left: 5px; color: #aa0000; cursor: pointer;">';
                         tools_cell += '<i class="icon-remove ui-tooltip" data-placement="bottom" data-original-title="Delete POS"></i></a>';
                         }
                         */
                        row.push(tools_cell);

                        rows.push(row); // add new row array to rows array
                    }
                    // in version 2.10, you can optionally return $(rows) a set of table rows within a jQuery object
                    return [ total, rows, headers ];
                }
            }
        });

    function getSafeValue(val, key) {
        if(typeof(val) == 'undefined' || val == null) {
            return "";
        }
        return val[key];
    }
});
