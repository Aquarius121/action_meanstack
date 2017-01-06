
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    $('.pager').css('position', '');
    $('.users-table').css('display', '');
    users_table_widget.initAjax('.users-table', [[0,0]]);

    $('.btn-clear-completed').click(function() {
        loading_modal.show('Clearing...');
        $.ajax({
            type: 'POST',
            url: '/admin/user?action=surveys-clear'
        }).error(function(e) {
            loading_modal.hide();
            alert_modal.show('Error', e.responseText);
        }).success(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Survey Completion Cleared', function() {
                window.location.reload();
            });
        });
    });
});
