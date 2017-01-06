var index_page_module = (function() {

    var coordinates, coordinates_changed, jcrop_api, full_width = 800;

    var _positiveSentimentResponse = 'Thank you for your feedback.';
    var _negativeSentimentCouponsResponse = 'Thank you for your feedback.  Please accept a coupon for a replacement.  An agent will contact you shortly.';
    var _negativeSentimentResponse = 'Thank you for your feedback.  An agent will contact you shortly.';
    var _positiveSentimentCouponsResponse = 'Thank you for your feedback.  Please accept a complimentary coupon.';
    var _medicalFeedbackResponse = 'Thank you for your feedback.  Please click <a onclick=window.alert("Experimental");>here</a> to begin a chat with an agent.';

    function init() {

        $('input.manual-entry').on('keyup', function(e) {
            if (e.which == 13) {
                e.preventDefault();
                _onBarcodeDetected($('input.manual-entry').val());
            }
        });

        $('button.query-button').click(function() {
            $('.coupon-container').html('');
            _onBarcodeDetected($('input.manual-entry').val());
        });

        //navigator.userAgent.indexOf('Safari') != -1

        $('button.decode-button').click(function() {
            $('.decode-controls').addClass('hidden');
            _crop();
            return false;
        });

        _initFileUpload();

        products_typeahead_widget.init('', $('.products-typeahead-widget'), _onSearch, _onSelection, '');
    }

    function _onSearch() {
        window.location.href = '/products/find/view?query=' + encodeURIComponent(products_typeahead_widget.getValue($('.products-typeahead-widget')));
    }

    function _onSelection(selected) {
        window.location.href = '/product/view/' + selected.ean;
    }

    function _loadFullSizeImage(file, orientation, onComplete) {
        var img_options = { maxWidth: full_width };
        if(orientation != null) {
            img_options.orientation = orientation;
        }
        loadImage(
            file,
            function (img) {
                $('.decode-controls').removeClass('hidden');
                $('.file-contents').html($('<a target="_blank">').append(img));
                onComplete();
            },
            img_options
        );
    }

    function _loadPreviewImage(file, orientation, onComplete) {
        var img_options = { maxWidth: Math.min(full_width, window.innerWidth - 66) };
        if(orientation != null) {
            img_options.orientation = orientation;
        }
        loadImage(
            file,
            function (img) {
                $('.decode-controls').removeClass('hidden');
                _applyPreviewImage(img);

                coordinates = {
                    x: 0,
                    y: 0,
                    w: img.width,
                    h: img.height
                };
                coordinates_changed = false;

                $('.file-preview > a').Jcrop({
                    onRelease: function() {
                        coordinates = null;
                        coordinates_changed = false;
                    },
                    onSelect: function(coords) {
                        coordinates = coords;
                        coordinates_changed = true;
                    }
                },function() {
                    jcrop_api = this;

                    if(window.innerWidth > full_width) {
                        $('.detection-notice').addClass('hidden');

                        var width_fraction = img.width / 6.0;
                        var height_fraction = img.height / 6.0;

                        coordinates = {
                            x: width_fraction,
                            y: height_fraction,
                            w: width_fraction * 5,
                            h: height_fraction * 5
                        };
                        jcrop_api.animateTo([coordinates.x, coordinates.y, coordinates.w, coordinates.h]);
                    } else {
                        $('.detection-notice').removeClass('hidden');
                    }

                    onComplete();
                });
            },
            img_options
        );
    }

    function _initFileUpload() {
        var fileUploadInput = $('input.fileupload');
        fileUploadInput.fileupload({
            dataType: 'json',
            error: function(e) {
            },
            done: function (e, data) {
            },
            add: function (e, data) {
                //prevents upload
            }
        });

        fileUploadInput.change(function (e) {
            loading_modal.show('Loading...');
            $('.product-result').html('');
            $('.coupon-container').html('');

            var file = e.target.files[0];
            loadImage.parseMetaData(file, function (data) {
                _loadFullSizeImage(file, data.exif ? data.exif.get('Orientation') : null, function() {
                    _loadPreviewImage(file, data.exif ? data.exif.get('Orientation') : null, function() {
                        loading_modal.hide();
                    });
                });
            });
        });
    }

    function _onBarcodeDetected(codePart) {
        window.location.href = '/product/view/' + codePart;
    }

    function _applyPreviewImage(img) {
        $('.file-preview').html($('<a target="_blank">').append(img));
    }

    function _crop() {
        var big_img = $('.file-contents').find('img, canvas')[0];
        var preview_img = $('.file-preview').find('img, canvas')[0];

        loading_modal.show('Cropping...');
        var scale = big_img.width / preview_img.width;
        if(preview_img.naturalWidth) {
            scale = preview_img.naturalWidth / preview_img.width;
        }
        if (preview_img && coordinates) {
            var scaledImage = loadImage.scale(big_img, {
                left: coordinates.x * scale,
                top: coordinates.y * scale,
                sourceWidth: coordinates.w * scale,
                sourceHeight: coordinates.h * scale,
                maxWidth: preview_img.width,
                crop: true
            });
            coordinates = null;
            _applyPreviewImage(scaledImage);

            loading_modal.hide();

            loading_modal.show('Decoding...');

            // if the image is probably too small to work, and the user
            // has not chosen a decoding area, use the larger image for decoding
            if(preview_img.width < full_width && !coordinates_changed) {
                _decodeImage(big_img);
            } else {
                _decodeImage(scaledImage);
            }
        }
    }

    function _decodeImage(img) {
        barcode_decode.decodeImg(true, img, function(result) {
            //var codeType = result[0].split(' ')[0].split(':')[0];
            var codePart = result[0].split(' ')[1];
            $('input.manual-entry').val(codePart);

            _onBarcodeDetected(codePart);
        }, function() {
            loading_modal.hide();
            window.alert('could not detect barcode');
        });
    }

    return {
        init: init
    }
}());

$(function() {
    index_page_module.init();
});
