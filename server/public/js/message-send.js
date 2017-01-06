
var message_send_page = (function() {

    var files = [];
    var request_url = '/message';

    function init(caller, product, reply_to) {
        var send_button = $('button.send-text');
        send_button.click(_submitOnlyTextClickEvent);

	var text_area = $('textarea.text-entry');
        var type_container = $('.type-select-container');

        select_message_type_widget.init(type_container);

        var fileupload_input = $('input.image-upload');
        fileupload_input.fileupload({
            dataType: 'json',
            url : '/user/'+caller._id+'/content',
            //url : '/message',
            error: function(e) {
                console.log(e);
                loading_modal.hide();

                if(e.status == 200){
                    var text = text_area.val();

                    // TODO: make sure we have an email address on record
                    // TODO: make sure the user has typed something

                    loading_modal.show('Uploading...');

                    var data = {
                        text: text,
                        type: getMessageType(type_container, reply_to),
                        platform: 'web'
                    };
                    if(typeof(product) != 'undefined') {
                        data.ean = product.ean;
                    }
                    if(typeof(reply_to) != 'undefined') {
                        data.reply_to = reply_to._id;
                    }
                    data.attachments = [{
                        name: files.name,
                        size: files.size,
                        type: files.type,
                        link: e.responseText}
                    ];
                    loading_modal.show("Sending...");
                    $.ajax({
                        type: 'PUT',
                        url: '/message',
                        data: data
                    }).success(function(data) { // , text, jqXHR
                        loading_modal.hide();
                        alert_modal.show('Success', 'Message sent!');
                    }).error(function(data) { // , text
                        loading_modal.hide();
                        window.alert(data.responseText);
                    });
                }
                else {
                    var err = '';
                    if(e.responseText == 'unrecognized message type undefined') {
                        err += 'Please select the type of message you would like to send.';
                    } else {
                        err += e.responseText;
                    }

                    alert_modal.show('Error: ', err);
                }
            },
            done: function (e, data) {
                loading_modal.hide();
                text_area.val('');
                files = [];
                data.files = [];
                $('button.send-text').click(_submitOnlyTextClickEvent);
		alert_modal.show('Success', 'Message sent!', function() {
		    window.location.href='/message/thanks?ean=' + product.ean;
		});
            },
            add: function (e, data) {
                loading_modal.show('Loading...');
                $('.product-result').html('');
                $('.coupon-container').html('');

                files = data.files[0];
                    setAttachButtonAttributes();
                send_button.unbind('click');
                send_button.click(function() {
                    if(text_area.val() == 'undefined' || text_area.val().trim().length == 0)  {
                        alert_modal.show('Message Error', 'You must type a message before clicking send.');
                        return;
                    };
                    if (window.File && window.FileReader && window.FileList && window.Blob)
                    {
                        //get the file size and file type from file input field
                        //console.log(files); return;
                        var fsize = files.size;

                        if(fsize>15728640) //do something if file size more than 1 mb (1048576)
                        {
                            //alert_modal.show("Error",fsize +" bites\nToo big!");
                            alert_modal.show("Error","Image Size should be less than 15MB");
                            return;
                        }
                    }else{
                        alert_modal.show("Error","Please upgrade your browser, because your current browser lacks some new features we need!");
                    }

                    loading_modal.show('Uploading...');
                    data.submit();
                    /*

                    var text = text_area.val();


                    // TODO: make sure we have an email address on record

                    loading_modal.show('Uploading...');

                    data.formData = {
                        text: text,
                        type: getMessageType(type_container, reply_to),
                        platform: 'web'
                    };
                    
		    if(typeof(product) != 'undefined') {
                        data.formData.ean = product.ean;
                    }
                    if(typeof(reply_to) != 'undefined') {
                        data.reply_to = reply_to._id;
                    }

                    data.submit();*/
                });
                
		loading_modal.hide();
            }
        });

        function _submitOnlyTextClickEvent() {
            // TODO: make sure we have an email address on record

            var msgType = select_message_type_widget.getSelected(type_container);
            console.log(reply_to);
            if(typeof(msgType) == 'undefined' && typeof(reply_to) == 'undefined') {
                alert_modal.show('Message type error', 'Please select the type of message you would like to send.');
                return;
            }

            if(text_area.val() == 'undefined' || text_area.val().trim().length == 0)  {
                alert_modal.show('Message Error', 'You must type a message before clicking send.');
                return;
            };


            loading_modal.show('Sending...');
            var data = {
                text: text_area.val(),
                type: getMessageType(type_container, reply_to),
                platform: 'web'
            };
            if(typeof(product) != 'undefined') {
                data.ean = product.ean;
            }
            if(typeof(reply_to) != 'undefined') {
                data.reply_to = reply_to._id;
            }

            if(files.length == 0) {
                $.support.cors = true;
                $.ajax({
                    type: 'PUT',
                    url: request_url,
                    data: data
                }).success(function() { // data, text, jqXHR
                    loading_modal.hide();
                    text_area.val('');
		            alert_modal.show('Success', 'Message sent!', function() {
			        window.location.href='/message/thanks?ean=' + product.ean;
		    });
                }).error(function(data) { // text
                    loading_modal.hide();
                    window.alert('An error occurred: ' + data.responseText);
                });
                return false;
            }
        }
    }

    function setAttachButtonAttributes() {
        var e = window.document.getElementsByTagName('span');
        var attach_button = e[4];
        attach_button.setAttribute("class", "btn btn-success btn-sm fileinput-button image-upload-button");

        //attach_button.getElementsByTag('input').setAttribute("accept", ".jpg,.png,.avi,.mp4,.mp3,.wav");
        var attach_btn_text = e[5];
        attach_btn_text.innerText = "file attached";
        }

        function getMessageType(container, reply_to) {
            return typeof(reply_to) != 'undefined' ? 'reply' : select_message_type_widget.getSelected(container);
        }

        return {
            init: init
        }
    }());


$(function() {
    $( ".ui-tooltip" ).tooltip({});
});
