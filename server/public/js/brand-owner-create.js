var brand_owner_create_page = (function() {

    function init() {
        $('button.btn-create-brand-owner').click(function() {
            loading_modal.show();
            $.ajax({
                type: 'PUT',
                url: '/brand-owner',
                data: {
                    name: $('input.brand-owner-name').val()
                }
            }).error(function(jqXHR) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', jqXHR);
            }).success(function(result) {
                window.location.href = '/brand-owners/view';
            });
        });

	 // add cancel button handler
        $('button.btn-cancel-brand-owner').click(function() {
	    // get the value to determine if a new brand owner has been added
            var b_name = $('input.brand-owner-name').val();

            if(b_name.trim().length != 0) {
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Your changes have not been saved.', function() {
                        window.location.href = '/brand-owners/view/';
                });
            } else {
                window.location.href = '/brand-owners/view/';
           }
        });
    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
    brand_owner_create_page.init();
});
