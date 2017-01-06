
$(function() {
    // Page uses stuff that is generated from server-scoped values, so look at product.jade
});

var product_edit_page = (function() {

    var image_tag_list;
    var promo_tag_list;
    var nutrition_tag_list;
    var video_tag_list;
    var map_tag_list;

    var image_tag_list_length;
    var promo_tag_list_length;
    var nutrition_tag_list_length;
    var video_tag_list_length;
    var map_tag_list_length;

    var self_help_tab_pane;

    var _checkLoadingIntervalMs = 200;

    var auto_message_changed = 0;
    var nutrition_changed = 0

    function init(product) {
        var settings = settings_manager.get();
        if(settings.cache_product != undefined)
        {
            product = settings.cache_product;
        }
        $( 'textarea' ).elastic();
        $( 'textarea' ).trigger('blur');

        self_help_tab_pane = $('.tab-pane#product-self-help-properties');

        _initSelfHelp(product);
        _initMedia(product);
        _initAutoMessage(product);

        $('.brand-select-widget').change(_refreshBrandLink);
        _refreshBrandLink();

	var old_name = $('input.product-name').val();
        var old_brand = brand_select.getSelection($('.brand-select-widget'));
 	var was_featured = $('input.featured').is(':checked');

        $('button.btn-save-product').click(function() {

            // get form fields
            var form_data = {};

            // get name, enforce need for a name
            form_data.name = $('input.product-name').val();
            if(form_data.name.trim().length == 0) {
                alert_modal.show('Error', 'You must enter a name');
                return false;
            }

            // get brand
            var selection = brand_select.getSelection($('.brand-select-widget'));

            if(typeof(selection) != 'undefined') {
                form_data.brand = selection;
            }
            else
            {
                alert_modal.show('Error', 'You must select Brand');
                return false;
            }

            if($('input.featured').is(':checked')) {
                form_data.feature_weight = 1;
            }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/product/' + product._id + '?properties=basic',
                data: form_data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });

            return false;
        });

	$('button.btn-cancel-product').click(function() {
	    var name = $('input.product-name').val();
            var brand = brand_select.getSelection($('.brand-select-widget'));
            var featured = $('input.featured').is(':checked');
            
	    if(old_name != name || old_brand != brand || was_featured != featured) {
	        confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
			window.location.reload();
                });
            } else {
		
	    }
        });

        $('button.btn-save-product-media').click(function() {

            // get form fields
            var form_data = {};

            // background style
            var background_style_selected = $('.background-style-container > input:checked');
            if(background_style_selected.length > 0) {
                form_data.image_style = background_style_selected.data('type');
                if(form_data.image_style == 'color') {
                    form_data.image_style = $('.background-style-container').find('.color-indicator').data('color');
                }
            }

            // images
            var images = image_tag_list.getTags();
            if(images.length > 0) {
                form_data.images = images;
            }

            // get nutrition label link
            /*
            var nutrition_labels = nutrition_tag_list.getTags();
            if(nutrition_labels.length > 0) {
                form_data.nutrition_labels = nutrition_labels;
            }
            */

            form_data.nutrition_labels = CKEDITOR.instances['Nutrition'].getData();
                //$('textarea.nutrition').val();;

            // promo images
            var promo_images = promo_tag_list.getTags();
            if(promo_images.length > 0) {
                form_data.promo_images = promo_images;
            }

            // get promo videos
            var promo_videos = video_tag_list.getTags();
            if(promo_videos.length > 0) {
                form_data.promo_videos = promo_videos;
            }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/product/' + product._id + '?properties=media',
                data: form_data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                var settings = settings_manager.get();
                settings.cache_product = product;
                settings.cache_product.image_style = form_data.image_style
                settings.cache_product.images = form_data.images
                settings.cache_product.promo_images = form_data.promo_images
                settings.cache_product.nutrition_labels = form_data.nutrition_labels
                settings_manager.save(settings);
                alert_modal.show('Success', 'Update succeeded');
            });

            return false;
        });


	
	$('button.btn-cancel-product-media').click(function() {
	   var nutrition_len = (typeof(product.nutrition_labels) != 'undefined' && product.nutrition_labels.length > 0) ? product.nutrition_labels.length : 0;
	   var image_len = typeof(image_tag_list) == 'undefined' ? 0 : image_tag_list.getTags().length;
	   var promo_len =  typeof(promo_tag_list) == 'undefined' ? 0 : promo_tag_list.getTags().length;
	   var video_len = typeof(video_tag_list) == 'undefined' ? 0 : video_tag_list.getTags().length;	

	    if(nutrition_changed == 1 || nutrition_tag_list_length != nutrition_len || image_tag_list_length != image_len || 
	       promo_tag_list_length != promo_len || video_tag_list_length != video_len) {
            	confirm_modal.setButtonClasses('btn-success', 'btn-danger');
            	confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
	            window.location.reload();
            	});
	    }
        });

	// original values
	var old_faq = $('textarea.faq').val();
	var old_instructions = $('textarea.instructions').val().trim();
	var old_brand_message = $('textarea.brand-message').val().trim();
	var old_ingredients = $('textarea.ingredients').val().trim();
	var old_master_ean = $('input.master-ean').val().trim();

        $('button.btn-save-product-extended-info').click(function() {

            // get form fields
            var form_data = {};

            // get map search types
            var search_types = map_tag_list.getTags();
            if(search_types.length > 0) {
                form_data.map_search_types = search_types;
            }

            // get instructions, faq, brand info, and contact numbers
            form_data.faq = $('textarea.faq').val().trim();
            form_data.instructions = $('textarea.instructions').val().trim();
            form_data.brand_message = $('textarea.brand-message').val().trim();
            form_data.ingredients = $('textarea.ingredients').val().trim();

	    // in case these were trimmed, redisplay them
	    $('textarea.faq').val(form_data.faq);
	    $('textarea.instructions').val(form_data.instructions);
	    $('textarea.brand-message').val(form_data.brand_message);
	    $('textarea.ingredients').val(form_data.ingredients);

            var master_ean = $('input.master-ean').val().trim();
            if(master_ean.length > 0) {
                var master_ean_struct = {};

                if($('input.master-product-info').prop('checked')) {
                    master_ean_struct.product_info = master_ean.trim();
                }

                if($('input.master-locator').prop('checked')) {
                    master_ean_struct.locator = master_ean.trim();
                }

                if(Object.keys(master_ean_struct).length > 0) {
                    form_data.master_ean = master_ean_struct;
                }
            }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/product/' + product._id + '?properties=self-help',
                data: form_data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });

            return false;
        });

	$('button.btn-cancel-product-extended-info').click(function() {
	    var faq = $('textarea.faq').val();
	    var instructions = $('textarea.instructions').val();
	    var brand_message = $('textarea.brand-message').val();
	    var ingredients = $('textarea.ingredients').val();
	    var master_ean = $('input.master-ean').val().trim();
	    var new_map_tag_list_length = typeof(map_tag_list) == 'undefined' ? 0 : map_tag_list.getTags().length;
	    if(old_faq != faq || old_instructions != instructions || old_brand_message != brand_message || old_master_ean != master_ean || new_map_tag_list_length != map_tag_list_length) {
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
		    window.location.reload();
                });
	    }
        });

	var old_exp = $('.auto-message-expiration');
	var old_exp_val = moment(old_exp.val()).valueOf();
	if(isNaN(old_exp_val)) {
		old_exp_val = 0;
	}

        $('button.btn-save-product-auto-message').click(function() {
            // get form fields
            var form_data = {};

            form_data.auto_message = CKEDITOR.instances['auto-message'].getData();

            var auto_message_expiration = $('.auto-message-expiration');
            if(auto_message_expiration.val().length > 0) {
                form_data.auto_message_expiration = moment(auto_message_expiration.val()).valueOf(); // TODO: UTC
            }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/product/' + product._id + '?properties=auto-message',
                data: form_data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });

            return false;
        });

	$('button.btn-cancel-product-auto-message').click(function() {
	    var exp = $('.auto-message-expiration');
	    var exp_val = moment(exp.val()).valueOf();
	    if(isNaN(exp_val)) {
		exp_val = 0;
	    }
	    
	    if(auto_message_changed == 1 || old_exp_val != exp_val) {  
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
                    window.location.reload();
	        });
	    } 
        });

        $('.btn-delete').click(function() {
            confirm_modal.setButtonClasses('btn-success', 'btn-danger');
            confirm_modal.show('Confirm Deletion', 'Are you sure you want to delete this product?<BR>This cannot be undone!', function() {

                loading_modal.show('Deleting...');
                $.ajax({
                    type: 'DELETE',
                    url: '/product/' + product._id,
                    data: {}
                }).error(function (e) {
                    loading_modal.hide();
                    alert_modal.show('Error', e.responseText);
                }).done(function (result) {
                    loading_modal.hide();
                    alert_modal.show('Success', 'Deletion succeeded', function () {
                        if(typeof(product.brand) != 'undefined') {
                            window.location.href = '/brand/view/' + product.brand;
                        } else {
                            window.history.back(); // TODO: improve
                        }
                    });
                });
            });
        });

	// save original social values
	var old_fb = $('input.facebook-link').val().trim();
        var old_tw = $('input.twitter-link').val().trim();
        var old_inst = $('input.instagram-link').val().trim();
        var old_phone = $('input.phone-number').val().trim();
        var old_sms = $('input.sms-number').val().trim();

        $('button.btn-save-product-social').click(function() {
            // get form fields
            var form_data = {};

	    function validateSocialLink(url) {
		if (/^(https?:\/\/)?((w{3}\.)?)twitter\.com\/(#!\/)?[a-z0-9_]+$/i.test(url))
		        return 'twitter';

	        if (/^(https?:\/\/)?((w{3}\.)?)facebook.com\/.*/i.test(url))
		        return 'facebook';

	         if (/^(https?:\/\/)?((w{3}\.)?)instagram.com\/.*/i.test(url))
		        return 'instagram';

	      return 'unknown';
	    }

	    function validatePhoneAndSms(phone) {
	        var regExp = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
	        return phone && phone.match(regExp);
	    }

            // get social media links
            form_data.facebook_link = $('input.facebook-link').val().trim();
            form_data.twitter_link = $('input.twitter-link').val().trim();
            form_data.instagram_link = $('input.instagram-link').val().trim();
            form_data.phone_number = $('input.phone-number').val().trim();
            form_data.sms_number = $('input.sms-number').val().trim();

	    // update the links in case whitespace has been trimmed
	    $('input.facebook-link').val(form_data.facebook_link);
            $('input.twitter-link').val(form_data.twitter_link);
	    $('input.instagram-link').val(form_data.instagram_link);
	    $('input.phone-number').val(form_data.phone_number);
	    $('input.sms-number').val(form_data.sms_number);

	    var updated = false;
	    if(old_fb != form_data.facebook_link || 
		old_tw != form_data.twitter_link || 
	 	old_inst != form_data.instagram_link || 
		old_phone != form_data.phone_number || 
		old_sms != form_data.sms_number) {
		    updated = true;
	    }

	    if(!updated && (form_data.facebook_link.length == 0 && 
	       form_data.twitter_link.length == 0 &&
	       form_data.instagram_link.length == 0 &&
	       form_data.phone_number.length == 0 &&
	       form_data.sms_number.length == 0))  {
		alert_modal.show('Error', 'Please enter changes on this page before clicking save');
		return;
	    }

	    if(form_data.facebook_link.length != 0 && validateSocialLink(form_data.facebook_link) != 'facebook') {
	        alert_modal.show('Error', 'Please provide a valid facebook link');
		return;
	    }

	    if(form_data.twitter_link.length != 0 && validateSocialLink(form_data.twitter_link) != 'twitter') {
		alert_modal.show('Error', 'Please provide a valid twitter link');
		return;
	    }

	    if(form_data.instagram_link.length != 0 && validateSocialLink(form_data.instagram_link) != 'instagram') {
	        alert_modal.show('Error', 'Please provide a valid instagram link');
		return;
	    }

	    if(form_data.phone_number.length != 0 && !validatePhoneAndSms(form_data.phone_number)) {
		alert_modal.show('Error', 'Please provide a valid phone number of the form xxx-xxx-xxxx');
		return;
	    }

	    if(form_data.sms_number.length != 0 && !validatePhoneAndSms(form_data.sms_number)) {
		alert_modal.show('Error', 'Please provide a valid sms number of the form xxx-xxx-xxxx');
	        return;
	    }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/product/' + product._id + '?properties=social',
                data: form_data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });

            return false;
        });

	$('button.btn-cancel-product-social').click(function() {
	    var fb = $('input.facebook-link').val();
            var tw = $('input.twitter-link').val();
            var inst = $('input.instagram-link').val();
            var phone = $('input.phone-number').val();
            var sms = $('input.sms-number').val();
	    if(old_fb != fb || old_tw != tw || old_inst != inst || old_phone != phone || old_sms != sms) {
            	confirm_modal.setButtonClasses('btn-success', 'btn-danger');
            	confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
            	    window.location.reload();
		});
	    }
        });
    }

    function _initSelfHelp(product) {

        if($('.tab-pane#product-self-help-properties:visible').length == 0) {
            setTimeout(function() { _initSelfHelp(product)}, _checkLoadingIntervalMs);
            return;
        }

        _initMapTypeElements(product);

        var master_ean = self_help_tab_pane.find('input.master-ean');
        master_ean.keyup(function() {
            _setMasterEanFieldsEnabled(general_util.isValidEAN($(this).val()));
        });

        _setMasterEanFieldsEnabled(general_util.isValidEAN(master_ean.val()));
    }

    function _setMasterEanFieldsEnabled(is_visible) {
        if(is_visible) {
            self_help_tab_pane.find('input.master-product-info').removeAttr('disabled');
            self_help_tab_pane.find('input.master-locator').removeAttr('disabled');
        } else {
            self_help_tab_pane.find('input.master-product-info').attr('disabled', 'disabled');
            self_help_tab_pane.find('input.master-locator').attr('disabled', 'disabled');
        }
    }

    function _initAutoMessage(product) {
        if($('.tab-pane#product-self-help-auto-message:visible').length == 0) {
            setTimeout(function() { _initAutoMessage(product)}, _checkLoadingIntervalMs);
            return;
        }

        var auto_message_editor = CKEDITOR.replace('auto-message');
	auto_message_editor.on( 'change', function( evt ) {
		auto_message_changed = 1;
	});

        $( 'textarea' ).elastic();
        $( 'textarea').trigger('blur');

        var auto_message_expiration_datepicker = $('.auto-message-expiration');
        $('.datepicker').datepicker({format: 'mm/dd/yyyy', changeYear: true, autoclose: true});

        if(typeof(product.auto_message_expiration) != 'undefined') {
            var expiration_as_moment = moment.utc(product.auto_message_expiration);
            auto_message_expiration_datepicker.datepicker('update', expiration_as_moment.format('MM/DD/YYYY'));
        }
    }

    function _initMedia(product) {

        // ensure media is visible
        if($('.tab-pane#product-self-help-media:visible').length == 0) {
            setTimeout(function() { _initMedia(product)}, _checkLoadingIntervalMs);
            return;
        }

        _initNutritionImageElements(product);
        _initProductImageElements(product);
        _initPromoImageElements(product);
        _initVideoElements(product);
    }

    function _initVideoElements(product) {

        // init video tags
        var video_tag_options = { readOnly: false };
        if(typeof(product.promo_videos) != 'undefined' && product.promo_videos.length > 0) {
            video_tag_options.tagData = product.promo_videos;
        }
        video_tag_list = $('.tag-list.promo-videos').tags(video_tag_options);

        if(typeof(video_tag_list) == 'undefined') {
            video_tag_list_length = 0;
        } else {
            video_tag_list_length = video_tag_list.getTags().length;
        }

        if(typeof(product.brand) != 'undefined') {
            var customization = {
                text: 'Upload',
                iconClassString: 'icon icon-camera',
                className:'video-upload',
                buttonClasses: 'btn-warning btn-sm'
            };
            file_upload_widget.init($('.promo-videos-upload-container'), '/brand/' + product.brand + '/content', customization,
                function(response) {
                    video_tag_list.addTag(response.result.url);
                    alert_modal.show('Success', "Added product promotional video.  Don't forget to save!");
                }, function() {
                    // TODO: something should go here
                }
            );
            $('.promo-videos-upload-container').attr('accept','video/*');
        }
    }

    function _initNutritionImageElements(product) {

        // init nutrition tags
        var nutrition_tag_options = { readOnly: false };
        if(typeof(product.nutrition_labels) != 'undefined' && product.nutrition_labels.length > 0) {
            nutrition_tag_options.tagData = product.nutrition_labels;
	    nutrition_tag_list_length =  product.nutrition_labels.length;
        } else {
	    nutrition_tag_list_length = 0;
	}

        var nutrition_editor = CKEDITOR.replace('Nutrition');
	nutrition_editor.on( 'change', function( evt ) {
		nutrition_changed = 1;
	});

        // init nutrition label file upload
        if(typeof(product.brand) != 'undefined') {
            var customizations = {
                text: 'Upload',
                iconClassString: 'icon icon-camera',
                className:'nutrition-label-upload',
                buttonClasses: 'btn-warning btn-sm'
            };
            file_upload_widget.init($('.nutrition-label-upload-container'), '/brand/' + product.brand + '/content', customizations,
                function(response) {
                    nutrition_tag_list.addTag(response.result.url);
                    alert_modal.show('Success', "Added product label.  Don't forget to save!");
                }, function() {

                }
            );
        }
    }

    function _initMapTypeElements(product) {

        // init map type tags
        var map_tag_options = { readOnly: false };
        if(typeof(product.map_search_types) != 'undefined' && product.map_search_types.length > 0) {
            map_tag_options.tagData = product.map_search_types;
        }
        map_tag_options.restrictTo = Object.keys(google_map.acceptable_place_types);
        map_tag_options.suggestions = Object.keys(google_map.acceptable_place_types);
        map_tag_list = $('.tag-list.map-search-types').tags(map_tag_options);

	if(typeof(map_tag_list) == 'undefined') {
	    map_tag_list_length = 0;
	} else {
	    map_tag_list_length = map_tag_list.getTags().length;
	}

    }

    function _initProductImageElements(product) {

        // image urls
        var image_tag_options = { readOnly: false };
        if(typeof(product.images) != 'undefined' && product.images.length > 0) {
            image_tag_options.tagData = product.images;
        }
        image_tag_list = $('.tag-list.product-images').tags(image_tag_options);

	if(typeof(image_tag_list) == 'undefined') {
	    image_tag_list_length = 0;
	} else {
	    image_tag_list_length = image_tag_list.getTags().length;
   	}

        // init image fileupload
        if(typeof(product.brand) != 'undefined') {
            var customizations = {
                text: 'Upload',
                iconClassString: 'icon icon-camera',
                className:'product-upload',
                buttonClasses: 'btn-warning btn-sm'
            };
            file_upload_widget.init($('.product-upload-container'), '/brand/' + product.brand + '/content', customizations,
                function(response) {
                    image_tag_list.addTag(response.result.url);
                    alert_modal.show('Success', "Added product image.  Don't forget to save!");
                }, function() {
                }
            );
        }
    }

    function _initPromoImageElements(product) {

        // promo image urls
        var promo_image_tag_options = { readOnly: false };

        if(typeof(product.promo_images) != 'undefined' && product.promo_images.length > 0) {
            promo_image_tag_options.tagData = product.promo_images;
        }
        promo_tag_list = $('.tag-list.promo-images').tags(promo_image_tag_options);
	promo_tag_list_length = promo_tag_list.getTags().length;

        if(typeof(product.brand) != 'undefined') {
            var customization = {
                text: 'Upload',
                iconClassString: 'icon icon-camera',
                className:'product-upload',
                buttonClasses: 'btn-warning btn-sm'
            };
            file_upload_widget.init($('.promo-image-upload-container'), '/brand/' + product.brand + '/content', customization,
                function(response) {
                    promo_tag_list.addTag(response.result.url);
                    alert_modal.show('Success', "Added product promotional image.  Don't forget to save!");
                }, function() {
                    // TODO: something should go here
                }
            );
        }
    }

    function _refreshBrandLink() {
        var selection = brand_select.getSelection($('.brand-select-widget'));
        if(typeof(selection) != 'undefined') {
            $('a.brand-link').removeClass('hidden');
            return false;
        }
        $('a.brand-link').addClass('hidden');
        return false;
    }

    return {
        init: init
    }
}());
