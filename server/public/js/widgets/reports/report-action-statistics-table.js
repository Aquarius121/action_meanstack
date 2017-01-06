// requires:
// - doT
// - tablesorter
// - sortable_table JADE mixin

var report_action_statistics_table_widget = (function() {

    var table_template_def =
        '<table class="table table-bordered table-striped tablesorter-hover">' +
            '<thead>' +
                '<tr>' +
                    '<th>Brand</th>' +
                    '<th>Product</th>' +
                    '<th>Scanned</th>' +
                    '<th>Searched</th>' +
                    '<th>Status</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                '{{~it :value:index}}<tr data-id="{{=value.code}}">' +
                    '<td>{{=value.brand_name ? value.brand_name : "Unknown"}}</td>' +
                    '<td>{{=value.product_name ? value.product_name : value.code}}</td>' +
                    '<td>{{=value.scanned}}</td>' +
                    '<td>{{=value.searched}}</td>' +
                    '<td>{{=value.participates ? "Participating" : "Not Participating"}}</td>' +
                '</tr>{{~}}' +
            '</tbody>' +
        '</table>';

    var table_template = doT.template(table_template_def);

    function init(container, values) {
        container.html(table_template(values));
        var table = container.find('table');

        sortable_table.init(table, [[3, 1]]);
        _rebindRowSelectEvent();
    }

    function _rebindRowSelectEvent() {
        $('table.tablesorter tbody tr td').unbind('click');
        $('table.tablesorter tbody tr td').on('click', function(evt) {
            // yuck.  tablesorter's ajaxProcessing makes this part into an ugly thing
            var ean = $(evt.target).parent().data('id');
            window.location.href = '/product/view/' + ean; // + '?mode=edit';
        });
    }

    return {
        init: init
    }
}());
