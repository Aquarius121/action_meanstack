var brand_owner_page = (function() {

    function init(brand_owner) {
        select_brand_modal.init();

        var details_container = $('.details-container');

        loading_modal.show();
        $.ajax({
            type: 'GET',
            url: '/brand?filter[brand_owner]=' + brand_owner._id
        }).error(function(jqXHR) {
            loading_modal.hide();
            alert_modal.showFromXHR('Error', jqXHR);
        }).success(function(result) {
            brands_table_widget.init('table.brands-table', result);
            loading_modal.hide();
        });

        $('button.add-brand-button').click(function() {
            select_brand_modal.show('Add Brand', 'Choose a brand to add to this brand owner', function() {
                var brand = select_brand_modal.getSelection();

                loading_modal.show();
                $.ajax({
                    type: 'POST',
                    url: '/brand/'+ brand + '?brand_owner=true',
                    data: {
                        brand_owner: brand_owner._id
                    }
                }).error(function(jqXHR) {
                    loading_modal.hide();
                    alert_modal.showFromXHR('Error', jqXHR);
                }).success(function(result) {
                    window.location.reload();
                });
            });
        });

        $('button.delete-brand-owner-button').click(function() {
            confirm_modal.setButtonClasses('btn-warning', 'btn-danger');
            confirm_modal.setButtonText('No', 'Yes');
            confirm_modal.show('Confirm Deletion', 'Are you sure you want to delete this brand owner?<BR>This cannot be undone!', function() {
                loading_modal.show('Deleting');
                $.ajax({
                    type: 'DELETE',
                    url: '/brand-owner/' + brand_owner._id
                }).error(function(jqXHR) {
                    loading_modal.hide();
                    alert_modal.showFromXHR('Error', jqXHR);
                }).success(function(result) {
                    window.location.href = '/brand-owners/view';
                });
            });
        });

        // save the old values
	var old_name = details_container.find('input.brand-owner-name').val();
	var old_link = details_container.find('input.brand-owner-link').val();

        $('button.edit-brand-owner').click(function() {
            details_container.removeClass('hidden');
        });

        $('button.btn-save-brand-owner').click(function() {
            var data = {
                name: details_container.find('input.brand-owner-name').val(),
                link: details_container.find('input.brand-owner-link').val()
            };
            loading_modal.show('Updating');
            $.ajax({
                type: 'POST',
                url: '/brand-owner/' + brand_owner._id,
                data: data
            }).error(function(jqXHR) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', jqXHR);
            }).success(function(result) {
                window.location.reload();
            });
        });

	$('button.btn-cancel-brand-owner').click(function() {
	    // get the current field values for comparison
	    var name = details_container.find('input.brand-owner-name').val();
	    var link = details_container.find('input.brand-owner-link').val();
	    if(old_name != name || old_link != link) {
            	confirm_modal.setButtonClasses('btn-success', 'btn-danger');
            	confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
		window.location.reload();
            	});
	    }
        });
    }

    return {
        init: init
    }

}());
