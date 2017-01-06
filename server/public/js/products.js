

$(function() {
    $( ".ui-tooltip" ).tooltip({});

    $('.pager').css('position', '');
    $('.products-table').css('display', '');

    products_table_widget.initAjax($('table.products-table'));
});
