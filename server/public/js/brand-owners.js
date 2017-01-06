
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    $('.pager').css('position', '');

    var table_selector = '.brand-owners-table';
    $(table_selector).css('display', '');
    brand_owners_table_widget.initAjax(table_selector, [[0,0]]);
});
