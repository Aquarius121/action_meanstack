var message_manager = (function() {

    var _content = [];
    var _content_size = 0;

    var default_options = {
        text: null,
        type: null,
        product_info: null,
        reply_to_id: null
    };

    var options = $.extend({}, default_options);

    function sendMessage(mm_options, callback2) {
        options = $.extend({}, default_options, mm_options);

        var url = app_util.getRemoteUrl() + '/message';

        if(options.text.trim().length == 0) {
            alert_modal.show('Alert', 'Message text must be entered');
            return;
        }

        var data = {
            text: options.text,
            type: options.type
        };

        if(typeof(data.type) == 'undefined') {
            alert_modal.show('Select a type', 'Please tell us more, is this a comment, question or complaint?', function() {
                app_controller.openInternalPage('#product-menu'); // TODO: going to the correct spot?
            });
            return;
        }

        if(data.type == 'reply') {
            console.log('replying to ' + options.reply_to_id);
            data.reply_to = options.reply_to_id;
        } else {

            // TODO: get type from widget and enforce that a type was selected
            data.ean = options.product_info.product.ean;
        }

        /*
        if(_content && _content.length == 1) {

            //progress_modal.setProgress({
            //    loaded: 0,
            //    total: 1
            //});

            progress_modal.show();
            capture_util.uploadFile(url, _content[0], data, _onProgressEvent, function(err_upload, upload_result) {
                progress_modal.hide();

                if(err_upload) {
                    callback2(err_upload.body);
                    return;
                }
                console.log('Upload success: ' + upload_result.responseCode);
                console.log(upload_result.bytesSent + ' bytes sent');

                _content = [];

                callback2(err_upload, upload_result);
            });
            return;
        }
        */

        if(_content.length > 0) {
            console.log("content length:" + _content.length);
            _uploadMultipleFiles({}, function(err_upload, upload_results) {
                console.log("upload finished");
                if(err_upload) {
                    alert_modal.show('Error', 'An error occurred while uploading the file(s)');
                    console.log('upload error: ' + err_upload);
                    return;
                }

                loading_modal.show('Sharing');

                data.attachments = upload_results;

                // TODO: switch to makeRequest?
                $.support.cors = true;
                $.ajax({
                    type: 'PUT',
                    url: url,
                    data: data
                }).success(function(data) { // , text, jqXHR
                    console.log("upload success");
                    loading_modal.hide();
                    callback2(null, data);
                }).error(function(data) { // , text
                    loading_modal.hide();
                    callback2(data, null);
                });
            });
            return;
        }

        loading_modal.show('Sharing');

        // TODO: switch to makeRequest?
        $.support.cors = true;
        $.ajax({
            type: 'PUT',
            url: url,
            data: data
        }).success(function(data) { // , text, jqXHR
            loading_modal.hide();
            callback2(null, data);
        }).error(function(data) { // , text
            loading_modal.hide();
            callback2(data, null);
        });
    }

    function _uploadMultipleFiles(options, callback2) {
        var url = app_util.getRemoteUrl() + '/user/' + app.caller._id + '/content';

        if(typeof(options.results) == 'undefined') {
            options.results = [];
        }
        console.log(_content.length);
        if(options.results.length == _content.length) {
            callback2(null, options.results);
            return;
        }

        progress_modal.show();

        var file = _content[options.results.length];
        console.log(JSON.stringify(file));
        capture_util.uploadFile(url, file, {}, _onProgressEvent, function(err_upload, upload_result) {

            progress_modal.hide();

            if(err_upload) {
                callback2(err_upload.body);
                return;
            }
            console.log('Upload success: ' + upload_result.responseCode);
            console.log(upload_result.bytesSent + ' bytes sent');


            options.results.push({
                name: file.name,
                size: file.size,
                type: file.type,
                link: upload_result.response
            });

            setTimeout(function() {
                _uploadMultipleFiles(options, callback2);
            }, 0);
        });
    }

    /*
        max_content_size is in bytes,
        capture_result = {
            end: 0
            fullPath: "file:/storage/emulated/0/DCIM/Camera/1406577390010.jpg"
            lastModifiedDate: 1406577390000
            localURL: null
            name: "1406577390010.jpg"
            size: 1096892
            start: 0
            type: "image/jpeg"
        }
     */
    function tryAddContent(max_content_size, capture_result) {
        if(capture_result[0].size + _content_size > max_content_size) {
            return false;
        }
        _content_size += capture_result[0].size;
        _content.push(capture_result[0]);
        return true;
    }

    function removeFile(file) {
        var matching_index = null;
        _content.forEach(function(item, item_index) {
            if(item.fullPath == file.link) {
                matching_index = item_index;
            }
        });

        if(matching_index != null) {
            var to_remove = _content[matching_index];

            _content_size -= to_remove.size;
            _content.splice(matching_index, 1);

            return to_remove;
        }

        console.log('hmm, we could not find that file in the message manager');
        return null;
    }

    function reset() {
        _content = [];
        _content_size = 0;
    }

    function numberOfAttachments() {
        return _content.length
    }

    function sizeOfAttachments() {
        return _content_size;
    }

    function getFiles() {
        return _content;
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
        sendMessage: sendMessage,
        addContent: tryAddContent,
        removeFile: removeFile,
        reset: reset,
        numberOfAttachments: numberOfAttachments,
        sizeOfAttachments: sizeOfAttachments,
        getFiles: getFiles
    }
}());