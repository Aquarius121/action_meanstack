var brand_create_page = (function() {

    function init() {
        $('button.btn-create-brand').click(function() {
	    var brand_name = $('input.brand-name').val().trim(),
            brand_link = $('input.brand-link').val().trim();
	    if(!validateBrandName(brand_name)) {
	        alert_modal.show('Error', 'Brand names must be less than 50 characters');
		return;
	    }
        else if(!validateBrandLink(brand_link))
        {
            alert_modal.show('Error', 'Please enter valid Brand Link');
            return;
        }
        else {
                loading_modal.show();
                $.ajax({
                    type: 'PUT',
                    url: '/brand',
                    data: {
                        name: $('input.brand-name').val().trim(),
                        link: $('input.brand-link').val().trim()
                    }
                }).error(function(jqXHR) {
                    loading_modal.hide();
                    alert_modal.showFromXHR('Error', jqXHR);
                }).success(function(result) {
                    window.location.href = '/brand/view/' + result[0]._id;
                });
	    }
        });

	// add cancel button handler
        $('button.btn-cancel-brand').click(function() {
	    // get the values to see if anything has been added
            var b_name = $('input.brand-name').val();
            var b_link = $('input.brand-link').val();

            if(b_name.trim().length != 0 || b_link.trim().length != 0) {
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Your changes have not been saved.', function() {
                        window.location.href = '/brands/view/';
                });
            } else {
		window.location.href = '/brands/view/';
	    }
        });

	function validateBrandName(name) {
 	    if(name.length > 50) {
	        return false; 				            
	    }

	    return true;
	}

    function validateBrandLink(link) {
       if(typeof(link) == 'undefined' || link == 'undefined') {
          return true;
       } else if(link.trim() == '' || link.length == 0) {
          return true;
       } else {
          return (/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(link));
      }
    }



    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
    brand_create_page.init();
});
