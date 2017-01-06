var user_image_selection_widget = (function () {

    var default_options = {
        user: null, // required
        onSelection: function(url) {},
        onComplete: function(url) {},
        onError: function(error) {},
        rootUrl: '/'
    };

    var template_ref =
        '<div class="user-image-selection-widget">' +
            '{{?it.user && it.user.facebook_data && it.user.facebook_data.picture && it.user.facebook_data.picture.data && it.user.facebook_data.picture.data.url}}' +
                '<button class="facebook-button">Use FB Image</button>' +
            '{{?}}' +
                '{{?it.user && it.user.google_data && it.user.google_data.image && it.user.google_data.image.url}}' +
                    '<button class="google-button">Use Google Plus Image</button>' +
                '{{?}}' +
            '<button class="gallery-button">From Gallery</button>' +
            //'<button class="picture-button">Take Picture</button>' +
        '</div>';

    var template_instance = doT.template(template_ref);

    function init(container, options_in) {
        var options = $.extend({}, default_options, options_in);

        container.html(template_instance(options));

        container.find('.facebook-button').click(function() {
            app.caller.image_url = options.user.facebook_data.picture.data.url;
            options.onSelection(app.caller.image_url);

            var url = app_util.getRemoteUrl() + '/user/' + app.caller._id;
            app_util.makeRequest('POST', url, app.caller, 'Updating',
                function() { // response_data, text, jqXHR
                    options.onComplete(app.caller.image_url);
                }, function(e) {
                    options.onError('an error occurred: ' + e.responseText);
                }
            );
        });

        container.find('.google-button').click(function() {
            app.caller.image_url = options.user.google_data.image.url;
            options.onSelection(app.caller.image_url);

            var url = app_util.getRemoteUrl() + '/user/' + app.caller._id;
            app_util.makeRequest('POST', url, app.caller, 'Updating',
                function() { // response_data, text, jqXHR
                    options.onComplete(app.caller.image_url);
                }, function(e) {
                    options.onError('an error occurred: ' + e.responseText);
                }
            );
        });

        container.find('.gallery-button').click(function() {
            if(typeof(platform_util) != 'undefined' && platform_util.isMobile()) {
                // TODO: show loading modal?
                navigator.camera.getPicture(function (data) { // data is a URI
                    options.onSelection(data);

                    progress_modal.show();

                    var url = app_util.getRemoteUrl() + '/user/' + app.caller._id + '/content';
                    var name = data.replace(/^.*[\\\/]/, '');

                    // android does some crazy junk, like modified.png?1234124
                    name = (new Date()).getTime() + '.' + name.split('.').pop();
                    if(name.split('?').length > 0) {
                        name = name.split('?')[0];
                    }

                    var media_file = {
                        fullPath: data,
                        name: name
                    };

                    capture_util.uploadFile(url, media_file, {}, _onProgressEvent, function(err_upload, upload_result) {
                        progress_modal.hide();

                        if(err_upload) {
                            options.onError('upload failed: ' + err_upload.body);
                            return;
                        }

                        console.log('Upload success: ' + upload_result.responseCode);
                        console.log(upload_result.bytesSent + ' bytes sent');

                        app.caller.image_url = upload_result.response;

                        url = app_util.getRemoteUrl() + '/user/' + app.caller._id;
                        app_util.makeRequest('POST', url, app.caller, 'Updating',
                            function() { // response_data, text, jqXHR
                                options.onComplete(data);
                            }, function(e) {
                                options.onError('an error occurred: ' + e.responseText);
                            }
                        );
                    });

                }, function (error) {
                    options.onError(error);
                }, {
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    targetWidth: 256,
                    targetHeight: 256
                });
            } else {
                options.onError('NOT IMPLEMENTED FOR NON-MOBILE PLATFORM');
            }
        });
    }

    function _onProgressEvent(evt) {
        //if(evt.lengthComputable) {
        progress_modal.setProgress({
            loaded: evt.loaded,
            total: evt.total
        });
        //}
    }

    return {
        init: init
    };

}());
