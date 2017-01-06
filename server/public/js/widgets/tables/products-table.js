var products_table_widget = (function() {

    var properties = ['name', 'brand_name', 'ean'];

    var product_table_template_def =
        '<table class="table table-bordered table-striped tablesorter-hover products-table">' +
            '<thead>' +
                '<tr>' +

                    '<th class="{{?it.hide_filters}}filter-false{{?}}">Name</th>' +
                    '<th class="{{?it.hide_filters}}filter-false{{?}}">Brand</th>' +
                    '{{?it.is_admin}}' +
                        '<th style="width: 75px;" class="{{?it.hide_filters}}filter-false{{?}}">Active</th>' +
                        '<th style="width: 75px;" class="{{?it.hide_filters}}filter-false{{?}}">Images</th>' +
                        '<th style="width: 75px;" class="{{?it.hide_filters}}filter-false{{?}}">Videos</th>' +
                    '{{?}}' +
                    '<th style="width: 120px;" class="{{?it.hide_filters}}filter-false{{?}}">EAN</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                '{{?it.product_list}}' +
                    '{{~it.product_list :value:index}}<tr>' +
                        '<td>{{=value.name}}</td>' +
                        '<td>{{=value.brand_name ? value.brand_name : ""}}</td>' +
                        '<td>{{=value.feature_weight ? value.feature_weight : ""}}</td>' +
                        '<td>{{=value.images ? value.images.length : ""}}</td>' +
                        '<td>{{=value.promo_videos ? value.promo_videos.length : ""}}</td>' +
                        '<td>{{=value.ean}}</td>' +
                    '</tr>{{~}}' +
                '{{?}}' +
            '</tbody>' +
        '</table>';

    var product_table_template = doT.template(product_table_template_def);

    function init(options_in) {

        var default_options = {
            selector: null,
            hide_filters: false,
            is_admin: false,
            product_list: null,
            onSelected: function(ean) {}
        };

        var options = $.extend(default_options, options_in, true);

        options.selector.html(product_table_template({
            hide_filters: options.hide_filters,
            product_list: options.product_list,
            is_admin: options.is_admin
        }));

        sortable_table.init(options.selector.find('table'));
        options.selector.css('display', '');

        _rebindRowSelectEvent(options.selector.find('table'), options.onSelected);
    }

    function initAdmin(selector, brand_id, table_sort_order, onSelected, onData) {
        var table = selector;

        var columns = [
            'name',
            'brand_name',
            'feature_weight',
            'images',
            'promo_videos',
            'ean'
        ];

        table.bind('filterEnd', function(){
            _rebindRowSelectEvent(selector, onSelected);
        });

        table.tablesorter( {
            sortList: typeof(table_sort_order) != 'undefined' ? table_sort_order : [], // [[0,0]]

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
            ajaxUrl : '/products?{filterList:filter}&{sortList:column}&page={page}&pageSize={size}',
            size: 100,
            removeRows: true,
            savePages: false,

            customAjaxUrl: function(table, url) {
                var url_parsed = $.url(url);
                var params = url_parsed.param();

                var new_query = 'pageSize=' + params['pageSize'] + '&page=' + params['page'];
                // column[]
                if(Array.isArray(params.filter)) {
                    params.filter.forEach(function(filter_value, index) {
                        new_query += '&filter[' + columns[index] + ']=' + filter_value;
                    });
                }
                if(brand_id) {
                    new_query += '&filter[brand]=' + brand_id;
                }

                if(Array.isArray(params.column)) {
                    params.column.forEach(function(sort_value, index) {
                        new_query += '&sort[' + columns[index] + ']=' + sort_value;
                    });
                }

                //new_query += '&fields=' + columns;

                return url_parsed.attr('path') + '?' + new_query;
            },

            ajaxProcessing: function(data){
                if (data && data.hasOwnProperty('rows')) {

                    if(onData) {
                        onData(data.rows);
                    }

                    var r, row, c, d = data.rows,

                    // total number of rows (required)
                    total = data.total_records,

                    // array of header names (optional)
                    headers = data.headers,

                    // all rows: array of arrays; each internal array has the table cell data for that row
                    rows = [],

                    // len should match pager set size (c.size)
                    len = d.length;

                    for ( r=0; r < len; r++ ) {
                        row = [];

                        var item = d[r];
                        row.push(_getSafeValue(item, 'name'));
                        row.push(_getSafeValue(item,'brand_name'));
                        row.push(_getSafeValue(item,'feature_weight'));

                        if(typeof(item['images']) != 'undefined') {
                            row.push(item['images'].length);
                        } else {
                            row.push('');
                        }

                        if(typeof(item['promo_videos']) != 'undefined') {
                            row.push(item['promo_videos'].length);
                        } else {
                            row.push('');
                        }

                        row.push(_getSafeValue(item,'ean'));

                        rows.push(row); // add new row array to rows array
                    }
                    // in version 2.10, you can optionally return $(rows) a set of table rows within a jQuery object
                    return [ total, rows, headers ];
                }
            }
        }).bind('pagerComplete', function(event, options) {
            _rebindRowSelectEvent(selector, onSelected);
        });
    }

    function initAjax(selector, table_sort_order, onSelected, onData) {
        var table = selector;

        table.bind('filterEnd', function(){
            _rebindRowSelectEvent(selector, onSelected);
        });

        table.tablesorter( {
            sortList: typeof(table_sort_order) != 'undefined' ? table_sort_order : [[3,0]],

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
            ajaxUrl : '/products?{filterList:filter}&{sortList:column}&page={page}&pageSize={size}',
            size: 100,
            removeRows: true,
            savePages: false,

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

                    if(onData) {
                        onData(data.rows);
                    }

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

                        properties.forEach(function(column_item, column_index) {
                            row.push(_getSafeValue(d[r], properties[column_index]));
                        });

                        rows.push(row); // add new row array to rows array
                    }
                    // in version 2.10, you can optionally return $(rows) a set of table rows within a jQuery object
                    return [ total, rows, headers ];
                }
            }
        }).bind('pagerComplete', function(event, options) {
            _rebindRowSelectEvent(selector, onSelected);
        });
    }

    function _getSafeValue(val, key) {
        if(typeof(val[key]) == 'undefined' || val[key] == null) {
            return "";
        }
        return val[key];
    }

    function _rebindRowSelectEvent(parent_container, onSelected) {
        var table_selector = parent_container;
        var row_selector = table_selector.find('tbody tr td');

        row_selector.unbind('click');
        row_selector.on('click', function(evt) {
            // yuck.  tablesorter's ajaxProcessing makes this part into an ugly thing
            var ean = $(evt.target).parent().children().last().text();

            if(onSelected) {
                onSelected(ean);
                return;
            }
            var settings = settings_manager.get();
            settings.cache_product = undefined;
            settings_manager.save(settings);
            window.location.href = '/product/view/' + ean + '?mode=edit';
        });
    }

    function _getColumnNameFromIndex(index) {
        return index >= 0 && index < properties.length ? properties[index] : null;
    }

    return {
        init: init,
        initAdmin: initAdmin,
        initAjax: initAjax
    }
}());
