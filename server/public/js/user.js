
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    var is_admin = typeof(caller) != 'undefined' && caller.role == 'admin';

    var form_container = $('.profile-form-container');
    var profile_image_container = $('.profile-image-container');

    var profile_form_options = {
        show_email: true,
        password_required: false,
        email_enabled: false,
        show_role: is_admin,
        is_profile: true,
        show_password: true
    };
    var form_context = profile_form.init(form_container, caller, profile_form_options);

    if(user.phone != undefined && user.phone !="" && user.phone.indexOf("-") === -1){
        newPhone = user.phone.substring(0,3) + "-" + user.phone.substring(3,6) + "-" + user.phone.substring(6,10);
        user.phone = newPhone;
    }

    profile_form.setValues(form_container, user, form_context);
    profile_image_widget.init(profile_image_container, user, onProfileWidgetClicked);

    var original_values = profile_form.serializeForm(form_container, form_context);

    function onProfileWidgetClicked() {

        // show selection dialog (fb, gallery, etc)
        var modal_instance = generic_modal.init({
            container: $('body'),
            headerHtml: 'Choose image from source',
            showFooter: false,
            bodyHtml: '<div class="picker-contents"></div>'
        });
        var form_data = profile_form.getData(form_container, form_context);
        var customizations = {
            text: 'Upload',
            iconClassString: 'glyphicon glyphicon-camera',
            className: 'brand-logo-fileupload',
            buttonClasses: 'btn-warning btn-sm',
            size_limit : 15*1000000   //  15MB
        };
        file_upload_widget.init($('.picker-contents'),
            '/user/' + user._id + '/content',
            customizations,
            function(response) {
                user.image_url = response.responseText;
		if(!formatAllowed(user.image_url)) {
		    modal_instance.hide();
		    alert_modal.show('Invalid Image Format', 'Image file must have an extension of .jpeg, .jpg, .png or .gif.');
		    return;
		}

                $('.image_url-field').val(user.image_url);
                //caller.image_url = response.responseText;
                form_data.image_url = user.image_url;
                //$.ajax({
                //    type: 'POST',
                //    url: '/user/' + user._id,
                //    data: form_data,
                //    crossDomain: true,
                //    beforeSend : function() {loading_modal.show("Updating..."); },
                //    complete   : function() {loading_modal.hide();}
                //}).error(function(e) {
                //    loading_modal.hide();
                //    alert_modal.show('Error', e.responseText);
                //}).success(function(result) {
                //    loading_modal.hide();
                //
                //});

                profile_image_widget.init(profile_image_container, user, onProfileWidgetClicked);
                modal_instance.hide();
                alert_modal.show('Success', "Added profile image. You need to click save!");
            }, function(err) {
                modal_instance.hide();
                if(err)
                    alert_modal.show('Error', 'Failed to upload profile image');
                else
                    alert_modal.show('Error', 'Image Size should be less than 15MB');
            }
        );
    }

    var brand_tag_selector_string = '.tag-list.managed-brands';
    brand_tags_widget.init($(brand_tag_selector_string));
    select_brand_modal.init();

    $('button.save-button').click(function() {
        var form_data = profile_form.getData(form_container, form_context);
        var validation_errors = profile_form.validate(form_container, profile_form_options, form_context);
        if(validation_errors.length > 0) {
            alert_modal.show('Error', validation_errors[0]);
            return;
        }

        if(is_admin && user.role == 'brand-manager') {
            form_data.managed_brands = brand_tags_widget.getBrandIds(brand_tag_selector_string);
        }

        loading_modal.show('Saving...');
        $.ajax({
            type: 'POST',
            url: '/user/' + user._id,
            data: form_data
        }).error(function(e) {
            loading_modal.hide();
            alert_modal.show('Error', e.responseText);
        }).success(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Update successful', function() {
                window.location.reload();
            });
        });
    });

    $('button.cancel-button').click(function() {
	var current_values = profile_form.serializeForm(form_container, form_context);

	if(current_values != original_values) {
	     confirm_modal.setButtonClasses('btn-success', 'btn-danger');
	     confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
	         window.location.reload();
	     });
	}
    });

    $('button.delete-button').click(function() {
        confirm_modal.setButtonClasses('btn-success', 'btn-danger');
        confirm_modal.setButtonText('No', 'Yes');
        confirm_modal.show('Delete User', 'Are you sure you wish to delete this user?', function() {
            loading_modal.show('Deleting...');
            $.ajax({
                type: 'DELETE',
                url: '/user/' + user._id
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).success(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Deletion successful', function() {
                    window.location.href = '/users/view';
                });
            });
        });
    });

    $('button.add-brand-button').click(function() {
        select_brand_modal.show('Select brand', 'Select a brand to manage', function() {
            var brand_tags = $(brand_tag_selector_string);
            if(brand_tags.length > 0) {
                loading_modal.show('Adding brand...');
                $.ajax({
                    type: 'PUT',
                    url: '/user/' + user._id + '/brand',
                    data: {
                        brand: select_brand_modal.getSelection()
                    }
                }).error(function(e) {
                    loading_modal.hide();
                    alert_modal.show('Error', e.responseText);
                }).success(function(result) {
                    loading_modal.hide();
                    alert_modal.show('Success', 'Addition successful', function() {
                        window.location.reload();
                    });
                });
            }
        });
    });

    $('button.btn-become').click(function() {
        confirm_modal.setButtonClasses('btn-success', 'btn-danger');
        confirm_modal.setButtonText('No', 'Yes');
        confirm_modal.show('Log in as User', 'Are you sure you wish to be logged in as this user?', function() {
            loading_modal.show('Becoming...');
            $.ajax({
                type: 'POST',
                url: '/admin/user?id=' + user._id + '&action=become'
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).success(function(result) {
                window.location.href = '/';
            });
        });
    });

    // helper functions for image file type detection
    function getFileType(urlStr) {
	var path_parts  = urlStr.split(".");
        var len = path_parts.length;
	return path_parts[len - 1];
    }

    function formatAllowed(urlStr) {
	var formats = ['jpeg', 'jpg', 'png', 'gif'];
        var type = getFileType(urlStr.toLowerCase());
	return formats.indexOf(type) == -1 ? false : true;
    }
    
});
