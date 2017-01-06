var sortable_table = (function () {
    return {
        init: function(selector, table_sort_order, pager_selector) {
            if(typeof(selector) == 'string') {
                selector = $(selector);
            }

            if(typeof(pager_selector) == 'string') {
                pager_selector = $(pager_selector);
            }

            selector.tablesorter( {
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
                    filter_searchDelay : 300,
                    filter_serversideFiltering: false,
                    filter_startsWith : false,
                    filter_useParsedData : false
                }

            }).tablesorterPager({
                container: typeof(pager_selector) != 'undefined' ? $(pager_selector) : $(".pager"),
                savePages: false,
                size: 15
            });
        }
    };
}(sortable_table));