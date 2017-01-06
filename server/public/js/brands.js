
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    $('.pager').css('position', '');
    $('.brands-table').css('display', '');
    brands_table_widget.initAjax('.brands-table', [[0,0]]);
});
