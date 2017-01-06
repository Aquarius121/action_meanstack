
$(function() {
    $( ".ui-tooltip" ).tooltip({});
});

var brand_page = (function() {

    var code_mirror, content_inited = false;

    var orig_ldata;

    function init(brand) {
        _initBrandPropertiesTab(brand);
        _initProductsTab(brand);

        _showStylesIfPaneVisible(brand, 200);

        $('a.show-properties').click(function() {
            _processPropertiesElastic();
        });

        $('a.show-content').click(function() {
            showContent(brand);
        });

        if($('input.form-control.crm-email-link').val().trim().length > 0)
        {
            $('input.set-participating').attr('disabled', 'disabled');
            $('input.set-participating').prop('checked', true);
        }
        $('input.form-control.crm-email-link').keyup(function(){
            if($('input.form-control.crm-email-link').val().trim().length > 0)
            {
                $('input.set-participating').attr('disabled', 'disabled');
                $('input.set-participating').prop('checked', true);
            }
            else
            {
                $('input.set-participating').removeAttr('disabled');
            }
        });
	
	$('a.show-styles').click(function() {
	    setLocatorData();
	});

	$('button.save-locator-button').click(function() {
	    // validate values 
	    var loc_cust = $('.brand-locator-container').find('input.wilke-locator-customer').val();
	    if(loc_cust && loc_cust != '' && loc_cust.length > 250) {
	        alert_modal.show('Error', 'customer id exceeds 250 character maximum length');
	    	return;
	    }

	    var master_ean = $('.brand-locator-container').find('input.wilke-locator-ean').val();
	    if(master_ean && master_ean != '' && master_ean.length > 13) {
	        alert_modal.show('Error', 'master ean exceeds 13 digit maximum length');
	    	return;
	    }

	    var loc_client = $('.brand-locator-container').find('input.iri-locator-client').val();
	    if(loc_client && loc_client != '' && loc_client.length > 250) {
	        alert_modal.show('Error', 'client id exceeds 250 character maximum length');
	        return;
	    }
	    
	    var loc_brand = $('.brand-locator-container').find('input.iri-locator-brand').val();
            if(loc_brand && loc_brand != '' && loc_brand.length > 250) {
	        alert_modal.show('Error', 'brand site id exceeds 250 character maximum length');
		return;
	    }

	    loading_modal.show('Saving...');

	    var data = brand_locator_config_form.getData($('.brand-locator-container'));

            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id + '?locator=true',
                data: data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });
        });

	$('button.cancel-locator-button').click(function() {
	     var ldata = serializeLocatorData();
	     if(orig_ldata != ldata) {
	    	confirm_modal.setButtonClasses('btn-success', 'btn-danger');
           	confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
            	    window.location.reload();
                });
            }
        });


        var old_fdata = JSON.stringify(brand_faq_config_form.getData($('.brand-faq-container')));	
        $('button.save-faq-button').click(function() {
            loading_modal.show('Saving...');

            var data = brand_faq_config_form.getData($('.brand-faq-container'));

            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id + '?faq=true',
                data: data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });
        });

	$('button.cancel-faq-button').click(function() {
	    var fdata = JSON.stringify(brand_faq_config_form.getData($('.brand-faq-container')));
	    if(old_fdata != fdata) {	    
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
                	window.location.reload();
		});
	    }
        });

        $('button.delete-unused-content').click(function() {
            confirm_modal.setButtonClasses('btn-warning', 'btn-danger');
            confirm_modal.setButtonText('No', 'Yes');
            confirm_modal.show('Confirm Deletion', 'Are you sure you want to delete all unused content for this brand?<BR>This cannot be undone!', function () {
                loading_modal.show('Deleting...');
                $.ajax({
                    type: 'DELETE',
                    url: '/brand/' + brand._id + '/content?type=unused'
                }).error(function (e) {
                    loading_modal.hide();
                    alert_modal.show('Error', e.responseText);
                }).done(function (result) {
                    loading_modal.hide();
                    alert_modal.show('Success', 'Deletion succeeded', function() {
                        window.location.reload();
                    });
                });
            });
        });

        var old_prod_data = JSON.stringify(brand_product_details_source_config_form.getData($('.brand-product-details-container')));
        $('button.save-product-source-button').click(function() {
            loading_modal.show('Saving...');

            var data = brand_product_details_source_config_form.getData($('.brand-product-details-container'));

            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id + '?product_info_source=true',
                data: data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });
        });

	$('button.cancel-product-source-button').click(function() {
	    var prod_data = JSON.stringify(brand_product_details_source_config_form.getData($('.brand-product-details-container')));
            if(old_prod_data != prod_data) {
	        confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
            	    window.location.reload();
		});
	    } 
        });

	$('button.export-csv').click(function() {
		window.location.href = '/brand/' + brand._id + '/products?format=csv';
	});

	$('button.export-xlsx').click(function() {
		window.location.href = '/brand/' + brand._id + '/products?format=xlsx';
	});

        brand_form_contents.init(brand);
        brand_locator_config_form.init($('.brand-locator-container'), brand);
        brand_faq_config_form.init($('.brand-faq-container'), brand);
        brand_product_details_source_config_form.init($('.brand-product-details-container'), brand);
        image_gallery_widget.init(brand);

	function serializeLocatorData() {
	    var bc = $('.brand-locator-container');
	    var locData = bc.find('input.wilke-locator-customer').val();
	    locData += '&' + bc.find('input.wilke-locator-ean').val();
 	    locData += '&' + bc.find('input.iri-locator-client').val();
	    locData += '&' + bc.find('input.iri-locator-client').val();
	    return locData;
	}

	function setLocatorData() {
	    orig_ldata = serializeLocatorData();;
	}

        $( '.color-picker' ).colorpicker();

        if(!brand.product_count) {
            $('.delete-brand-button').removeClass('hidden');
            $('.delete-brand-button').click(function() {
                loading_modal.show('Deleting...');
                $.ajax({
                    type: 'DELETE',
                    url: '/brand/' + brand._id
                }).error(function(e) {
                    loading_modal.hide();
                    alert_modal.show('Error', e.responseText);
                }).done(function(result) {
                    window.location.href = '/brands/view';
               });
            });
        }
    }

    function _processPropertiesElastic() {
        if($('.tab-pane#brand-properties:visible').length == 0) {
            setTimeout(function() { _processPropertiesElastic()}, 200);
            return;
        }
        $( 'textarea' ).elastic();
        $( 'textarea' ).trigger('blur');
    }

    function _showStylesIfPaneVisible(brand, interval) {
        if($('.brand-styles:visible').length > 0) {
		_initStyleEntry(brand);
            return;
        }
        setTimeout(function() {
            _showStylesIfPaneVisible(brand, interval);
        }, interval);
    }

    function _initStyleEntry(brand) {
        code_mirror = css_editor_widget.init($('.brand-styles'), brand.custom_styling);

	var old_sdata = JSON.stringify(getStyleData());

        $('.save-button').click(function() {
            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id + '/styling',
                data: {
                    custom_styling: code_mirror.getValue(),
                    components: {
                        navbar: $('.navbar-color-picker').val(),
                        navbar_widget: $('.navbar-widget-color-picker').val(),
                        navbar_widget_hover: $('.navbar-widget-hover-color-picker').val(),
                        accordion_heading_background: $('.accordion-heading-background-color-picker').val(),
                        accordion_heading_text: $('.accordion-heading-text-color-picker').val(),
                        well_background: $('.well-background-color-picker').val(),
                        well_heading_text: $('.well-heading-text-color-picker').val(),
                        body_background: $('.body-background-color-picker').val(),
                        body_text: $('.body-text-color-picker').val(),
                        brand_logo_text: $('.brand-logo-text-color-picker').val(),
                        brand_logo_top_left: $('.brand-logo-top-left-color-picker').val(),
                        brand_logo_top_right: $('.brand-logo-top-right-color-picker').val(),
                        brand_logo_bottom_left: $('.brand-logo-bottom-left-color-picker').val(),
                        brand_logo_bottom_right: $('.brand-logo-bottom-right-color-picker').val()
                    }
                }
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e);
            }).success(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
            });
        });

	$('.cancel-button').click(function() {
	    var sdata = JSON.stringify(getStyleData());
	    if(old_sdata != sdata) {
                confirm_modal.setButtonClasses('btn-success', 'btn-danger');
                confirm_modal.show('Unsaved Changes', 'Are you sure you want to cancel?<BR>Any unsaved changes will be lost!', function() {
                    window.location.reload();
	        });
	    }
        });
    }

    function getStyleData() {
       var styleData = {
           custom_styling: code_mirror.getValue(),
           components: {
		navbar: $('.navbar-color-picker').val(),
      		navbar_widget: $('.navbar-widget-color-picker').val(),
		navbar_widget_hover: $('.navbar-widget-hover-color-picker').val(),
		accordion_heading_background: $('.accordion-heading-background-color-picker').val(),
		accordion_heading_text: $('.accordion-heading-text-color-picker').val(),
		well_background: $('.well-background-color-picker').val(),
		well_heading_text: $('.well-heading-text-color-picker').val(),
		body_background: $('.body-background-color-picker').val(),
		body_text: $('.body-text-color-picker').val(),
		brand_logo_text: $('.brand-logo-text-color-picker').val(),
		brand_logo_top_left: $('.brand-logo-top-left-color-picker').val(),
		brand_logo_top_right: $('.brand-logo-top-right-color-picker').val(),
		brand_logo_bottom_left: $('.brand-logo-bottom-left-color-picker').val(),
		brand_logo_bottom_right: $('.brand-logo-bottom-right-color-picker').val()
	   }
	};

	return styleData;
    }

    function showContent(brand) {
        if(content_inited) {
            return;
        }

        var customizations = {
            text: 'Upload',
            iconClassString: 'glyphicon glyphicon-camera',
            className: 'content-fileupload',
            buttonClasses: 'btn-warning btn-sm'
        };
        file_upload_widget.init($('.content-fileupload-container'),
                '/brand/' + brand._id + '/content',
            customizations,
            function(data) {
                $('.contents').find('.gallery-link-container').append(
                        '<a href="' + data.result.url + '" title="' + data.result.url + '">' +
                        '<img src="' + data.result.url + '" data-gallery style="max-width: 200px; max-height: 200px;">' +
                        '</a>');
                loading_modal.hide();
                alert_modal.show('Success', 'Successfully uploaded');
            }, function(err) {

            }
        );

        image_gallery_widget.setContents($('#brand-content').find('.contents'), brand, function(url_to_delete) {
            $.ajax({
                type: 'DELETE',
                url: '/brand/' + brand._id + '/content',
                data: {
                    url: url_to_delete
                }
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                $('a[href$="' + url_to_delete + '"').remove();
                alert_modal.show('Success', 'Deletion succeeded');
            });
        });

        content_inited = true;
    }

    function _initProductsTab(brand) {
        var table_element = $('.brand-product-container table');
        products_table_widget.initAdmin(table_element, brand._id, function(ean) {
            window.location.href = '/product/view/' + ean + '?mode=edit';
        });
        table_element.css('display', '');

        $('a.feature-all').click(function() {
            loading_modal.show('Adding...');
            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id + '/features?feature=all'
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Successfully activated all products for this brand', function() {
                    window.location.reload();
                });
            });
        });

        $('a.unfeature-all').click(function() {
            loading_modal.show('Removing...');
            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id + '/features?unfeature=all'
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Successfully deactivated all products for this brand', function() {
                    window.location.reload();
                });
            });
        });
    }

    function _initBrandPropertiesTab(brand) {
        if($('.tab-pane#brand-properties:visible').length == 0) {
            setTimeout(function() { _initBrandPropertiesTab(brand)}, 500);
            return;
        }

        var customizations = {
            text: 'Upload',
            iconClassString: 'glyphicon glyphicon-camera',
            className: 'brand-logo-fileupload',
            buttonClasses: 'btn-warning btn-sm'
        };
        file_upload_widget.init($('.logo-upload-container'),
                '/brand/' + brand._id + '/content',
            customizations,
            function(response) {
                $('input.brand-logo').val(response.result.url);
                alert_modal.show('Success', "Added logo.  Don't forget to save!");
            }, function(err) {
                alert_modal.show('Error', 'Failed to upload logo');
            }
        );
        $('input.brand-logo-fileupload').attr('accept','image/*');
        //$('input.brand-logo-fileupload').change(function(e){
        //    var validExts = new Array(".jpg", ".png", ".jpge");
        //    var fileExt = this.value;
        //    fileExt = fileExt.substring(fileExt.lastIndexOf('.'));
        //    if (validExts.indexOf(fileExt) < 0) {
        //        alert("Invalid file selected, valid files are of " +
        //            validExts.toString() + " types.");
        //        //preventBehavior(e);
        //        this.value = "";
        //        return false;
        //    }
        //    else return true;
        //});
        $('input.set-hours').change(function() {
            if(this.checked) {
                $('.hours-fields').css('display', '');
            } else {
                $('.hours-fields').css('display', 'none');
            }
        });

	var old_props = JSON.stringify(brand_form_contents.getData());
        $('button.save-properties').click(function() {
            var data = brand_form_contents.getData(),
                validation_errors = brand_form_contents.validateData(data);

            if(validation_errors.length > 0) {
                alert_modal.show('Error', validation_errors[0]);
                return;
            }

            loading_modal.show('Saving...');
            $.ajax({
                type: 'POST',
                url: '/brand/' + brand._id,
                data: data
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Update succeeded');
                brand.participating = $('input.set-participating').is(':checked');
                brand_locator_config_form.init($('.brand-locator-container'),brand);
            });
        });

        var auto_message_expiration_datepicker = $('.auto-message-expiration');
        $('.datepicker').datepicker({format: 'mm/dd/yyyy', changeYear: true, autoclose: true});

        if(typeof(brand.auto_message_expiration) != 'undefined') {
            var expiration_as_moment = moment.utc(brand.auto_message_expiration);
            auto_message_expiration_datepicker.datepicker('update', expiration_as_moment.format('MM/DD/YYYY'));
        }


	 $('button.cancel-properties').click(function() {
	     var props = JSON.stringify(brand_form_contents.getData());
	     if(old_props != props) {
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
