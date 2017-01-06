$(function() {
    $( ".ui-tooltip" ).tooltip({});
    $('.product-import-table').css('display', '');
});

var brand_product_import_page = (function() {

    function init(viewModel){

        // setup import / upload button
        var customizations = {
            text: 'Upload File',
            iconClassString: 'icon icon-upload',
            className:'product-upload',
            buttonClasses: 'btn-warning btn-sm'
        };

        file_upload_widget.init($('.product-upload-container'), '/brand/' + viewModel.brand + '/import', customizations, viewModel._onProductUploadComplete, viewModel._onProductUploadFailed);
    	
	$('button.btn-cancel-import').click(function() {
	    confirm_modal.setButtonClasses('btn-success', 'btn-danger');
	    confirm_modal.show('Cancel Import', 'Are you sure you want to cancel this import?<BR>Your changes have not been saved.', function() {
		    var curr = window.location.href;
		    var parts = curr.split('/');
		    var brand_id = parts[parts.length - 2];
                    window.location.href = '/brand/view/' + brand_id;
	    });
	});
    
    }

    return {
        init: init
    }

}());


