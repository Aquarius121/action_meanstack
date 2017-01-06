SharePage.prototype  = new PageController();
SharePage.prototype.constructor = SharePage;

function SharePage() {
    this.type = 'share';
    this.max_content_size = 15 * 1000000; // 15 MB

    this.type_to_title_map = {
        'comment': 'Let us know your thoughts',
        'complaint': 'Having an issue?',
        'question': 'Have a question for us?',
        'reply': 'What would you like to reply with?'
    };
}

SharePage.prototype.onPageReady = function() {
    var that = this;

    this.pageContainer = $('#share');
    this.productHeaderContainer = this.pageContainer.find('.product-image-header');
    this.spacerContainer = this.pageContainer.find('.prompt-spacer');

    this.upload_buttons_container = this.pageContainer.find('.upload-buttons-container');
    this.product_image = this.pageContainer.find('img.product-image-mini');
    this.text_area = this.pageContainer.find('textarea.text-entry');
    this.attachment_indicator = this.pageContainer.find('.attachment-indicator');

    this.audio_button = this.pageContainer.find('.upload-audio');
    this.image_button = this.pageContainer.find('.upload-image');
    this.video_button = this.pageContainer.find('.upload-video');

    that.attachment_indicator.click(function() {

        return false;

        // TODO: get this up and running

        var modal_instance = generic_modal.init({
            container: $('body'),
            headerHtml: 'Message attachments',
            showFooter: false
        });

        /*
         [{
         "name":"audio_003.wav",
         "localURL":null,
         "lastModifiedDate":1420681488000,
         "size":246316,
         "start":0,
         "end":0,
         "fullPath":"/Users/markdickson/Library/Developer/CoreSimulator/Devices/FB3F0C91-484C-438C-A0C3-0FE7417A7C97/data/Containers/Data/Application/8B26FB7B-94F0-4653-9758-1C408D97AA01/tmp/audio_003.wav"
         }]
         */
        var files = [];

        message_manager.getFiles().forEach(function(file) {
            files.push({
                type: 'audio', // TODO: "compute" type from filename
                link: file.fullPath
            });
        });

        view_attachments_widget.init({
            container: modal_instance.getBody(),
            files: message_manager.getFiles()
            //allow_remove: true,
            //onRemoveFile: function(file) {
            //    alert('TODO: file remove: ' + JSON.stringify(file));
            //}
        });
    });

    this.pageContainer.find('.send-text').click(function() {
        _sendMessage(_onSendMessageResult);
        return false;
    });


    this.video_button.bind("touchstart",function() {
        _beforeContentAdded();
        setTimeout(function(){
        var modal_instance = generic_modal.init({
            container: $('body'),
            headerHtml: 'Choose video from source',
            showFooter: false,
            bodyHtml: '<div class="picker-contents"></div>'
        });
        share_video_selection_widget.init(modal_instance.selector.find('.picker-contents'), {
            user: app.caller,
            onSelection: function(img_url) {
                modal_instance.hide();
            },
            onComplete: function(img_url) {
                /*
                 profile_image_widget.init(that.pageContainer.find('.profile-image-container'), app.caller, onProfileWidgetClicked);
                 */
                //console.log(img_url + ' has been set as the profile picture');
            },
            onError: function(err_text) {
                 modal_instance.hide();
                 alert_modal.show('Error', err_text, function(){});
            }
        },function () {
            capture_util.captureVideo(undefined, function (err, capture_result) {
                if (err) {
                    _onContentAddedError(err);
                    return;
                }
                modal_instance.hide();
                capture_result[0].fullPath = capture_result[0].fullPath.replace("private/", "");
                _onContentAddedSuccess(capture_result, 'video');
            });
        },function(result){
            modal_instance.hide();
            console.log(JSON.stringify(result));
            _onContentAddedSuccess(result, 'video');
        });},200);

    });

    this.image_button.bind("touchstart",function() {
        _beforeContentAdded();
        setTimeout(function(){
        var modal_instance = generic_modal.init({
            container: $('body'),
            headerHtml: 'Choose image from source',
            showFooter: false,
            bodyHtml: '<div class="picker-contents"></div>'
        });
        share_image_selection_widget.init(modal_instance.selector.find('.picker-contents'), {
            user: app.caller,
            onSelection: function(img_url) {
                modal_instance.hide();
                loading_modal.hide();
            },
            onComplete: function(img_url) {
                /*
                 profile_image_widget.init(that.pageContainer.find('.profile-image-container'), app.caller, onProfileWidgetClicked);
                 */
                //console.log(img_url + ' has been set as the profile picture');
            },
            onError: function(err_text) {
                /*
                 modal_instance.hide();
                 alert_modal.show('Error', err_text, function(){});*/
            }
        },function (){
            capture_util.captureImage(undefined, function(err, capture_result) {
                if(err) {
                    _onContentAddedError(err);
                    return;
                }
                modal_instance.hide();
                loading_modal.hide();
                _onContentAddedSuccess(capture_result, 'image');
            });

        },function(result){
            modal_instance.hide();
            loading_modal.hide();
            _onContentAddedSuccess(result, 'image');
        });},200);


    });

    this.audio_button.bind("touchstart",function() {
        _beforeContentAdded();
        setTimeout(function() {
            capture_util.captureAudio(undefined, function (err, capture_result) {
                if (err) {
                    _onContentAddedError(err);
                    return;
                }

                _onContentAddedSuccess(capture_result, 'sound file');
            });
        },500);
        return false;
    });

    if(!platform_util.isMobile()) {
        that.pageContainer.find('.upload-file').removeClass('hidden');
        that.video_button.addClass('hidden');
        that.image_button.addClass('hidden');
        that.audio_button.addClass('hidden');
    }

    function _sendMessage(callback2) {
        message_manager.sendMessage({
            text: that.text_area.val(),
            type: that.type,
            reply_to_id: that.reply_to_id,
            product_info: that.product_info
        }, callback2);
    }

    function _onSendMessageResult(error) { // , results
        if(error) {
            if(navigator.connection.type == "none")
            {
                alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                return;
            }
            alert_modal.show('Error', 'an error occurred: ' + error);
            return;
        }

        that.text_area.val('');
        alert_modal.show('Success', 'Message sent!', function() {
            app_controller.openInternalPage('#thanks-share');
        });
    }

    function _beforeContentAdded() {
        //that.upload_buttons_container.css('display', 'none');
        //setTimeout(function(){console.log("beforeContent")},500);
    }

    function _onContentAddedError(err) {
        //that.upload_buttons_container.css('display', '');
        if(typeof(err) == 'string') {
            console.log('error: ' + err);
        } else {
            console.log('error: ' + JSON.stringify(err));
        }
    }

    function _onContentAddedSuccess(capture_result, type) {
        if(!message_manager.addContent(that.max_content_size, capture_result)) {
            console.log(that.max_content_size + ' worth of content, and that is above the limit');
            alert_modal.show('Error', 'You have surpassed the size limit for a single message.  Please try again and reduce the size of the content');
            return;
        }

        _refreshAttachmentsIndicator(type);
    }

    function _refreshAttachmentsIndicator(type) {
        var attachment_count = message_manager.numberOfAttachments();

        if(attachment_count == 0) {
            that.attachment_indicator.html('');
            return;
        }

        var attachment_contents =
            '<a class="manage-attached"><i class="glyphicon glyphicon-paperclip" style="margin-right: 5px;"></i>attached ' +
            (attachment_count == 1 ? (typeof(type) != 'undefined' ? type : 'file') : attachment_count + ' files') + '</a>';

        // sample content = [{
        //    "name":"audio_005.wav",
        //    "localURL":null,
        //    "lastModifiedDate":1420837582000,
        //    "size":517028,
        //    "start":0,
        //    "end":0,
        //    "fullPath":".../tmp/audio_005.wav"
        // }]

        that.attachment_indicator.html(attachment_contents);

        that.attachment_indicator.find('a').click(function() {

            var files = message_manager.getFiles();
            var attachments = files.map(function(file) {
                var type = 'audio';
                if(typeof(file.type) != 'undefined' && file.type) {
                    type = file.type;
                }

                return {
                    link: file.fullPath,
                    type: type
                };
            });

            var modal_instance = generic_modal.init({
                container: $('body'),
                headerHtml: 'Message attachments',
                showFooter: false
            });

            view_attachments_widget.init({
                container: modal_instance.getBody(),
                files: attachments,
                allow_remove: true,
                onRemoveFile: function(file) {
                    message_manager.removeFile(file);
                    files = message_manager.getFiles();

                    _refreshAttachmentsIndicator();
                    modal_instance.hide();
                }
            });
        });
    }
};

SharePage.prototype.setNonReplyMode = function(mode) {
    this.type = mode;

    // show correct prompt for type
    var title_text = this.type_to_title_map[mode];
    if(typeof(title_text) != 'undefined') {
        this.pageContainer.find('h3.title-text').html(title_text);
    }
    this.spacerContainer.addClass('hidden');

};

SharePage.prototype.setProductInfo = function(product) {
    this.product_info = product;
};

SharePage.prototype.setReply = function(id) {
    this.reply_to_id = id;
    this.type = 'reply';

    // show correct prompt for type
    var title_text = this.type_to_title_map[this.type];
    if(typeof(title_text) != 'undefined') {
        this.pageContainer.find('h3.title-text').html(title_text);
    }
};

SharePage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    this.pageContainer.find('input.text-entry').val('');
    this.upload_buttons_container.css('display', '');
    this.attachment_indicator.html('');

    message_manager.reset();

    header_widget.update('Contact Us');

    if(this.product_info) {

        if(this.product_info.brand && this.product_info.brand.styling) {
            app_util.addCustomStyle(this.product_info.brand.styling);
        }

        //if (this.type == 'reply') {
        //    this.product_image.attr('src', '');
        //} else {
        if(this.product_info.product.images && this.product_info.product.images.length > 0) {
            this.product_image.attr('src', general_util.processImageLink(this.product_info.product.images[0]));
        }
        this.applyProductImages(this.product_info, this.pageContainer);
        //}
    }

    /*
     star_rating_handler.init(this.pageContainer.find('.star-container'), 'share', app_util.getRemoteUrl());
     */
    if(this.type != 'reply') {
        this.pageContainer.find('.select-prompt').removeClass('hidden');
    } else {
        this.pageContainer.find('.select-prompt').addClass('hidden');
    }


    this.pageContainer.find('.text-entry').blur(function(){
        $("#share").css({"margin-top": "0px"});
    });
    //if(device.version == "4.3" || device.version == "4.2.2" || device.version == "4.4.4" || device.version == "4.4.2") {
    if(device.platfrom != "iOS"){
        this.pageContainer.find('.text-entry').bind("click", function () {
            $("#share").css({"margin-top": "-160px"});
        });

        $('#share').bind("touchstart", function (e) {
            if (e.target.className != "text-entry") {
                setTimeout(function(){$("#share").css({"margin-top": "0px"});},100);
                //$("#share").css({"margin-top": "0px"});
            }
        });
    }


};

SharePage.prototype.onPageShow = function() {
    //if(!app.caller.address ||
    //        (!app.caller.address.street || app.caller.address.street.trim().length == 0) ||
    //        (!app.caller.address.state || app.caller.address.state.trim().length == 0) ||
    //        (!app.caller.address.city || app.caller.address.city.trim().length == 0) ||
    //        (!app.caller.address.zip || app.caller.address.zip.trim().length == 0))

    if(!app.caller.address.zip || app.caller.address.zip.trim().length == 0)
    {
        var title = 'NOTICE';
        var body_html = '<h4 class="text-center">' + title + '<h4>' +
            '<p class="text-center">Sharing with us requires the entry of your postal code</p>';

        var cancel_button_html = '<a class="btn btn-danger btn-cancel">Nevermind</a>';
        var ok_button_html = '<a class="btn btn-success btn-ok" style="margin-left: 10px;">Enter Postal code</a>';

        var modal = confirmation_util.showCustomModal(body_html, cancel_button_html + ok_button_html);
        modal.find('.btn-ok').click(function() {
            app.redirect = '#share';
            app_controller.openInternalPage('#profile', {
                hide_from_history: true
            });
            return false;
        });
        modal.find('.btn-cancel').click(function() {
            window.history.go(-3);
            return false;
        });
    }
};

SharePage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
};

SharePage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;
};

SharePage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.product_info = product_info;
    this.setReply(reply_id);
};