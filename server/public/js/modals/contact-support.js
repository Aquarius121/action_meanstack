var contact_support_modal = (function() {

    var _ean;
    var _onPositive, _onNegative, _onMedical, _onNeutral;
    var _maxTextLimit = 140;
    var _nlpThreshold = 0.60;
    var _modalClassName = '.modal-contact-support';

    function show(data, onPositive, onNegative, onMedical, onNeutral) {
        _ean = data.ean;
        _onPositive = onPositive;
        _onNegative = onNegative;
        _onMedical = onMedical;
        _onNeutral = onNeutral;

        var contactDialog = $(_modalClassName);
        contactDialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        //loadingMessage.find('.modal-body .loading-text').html(loadingText);

        var sms_text = contactDialog.find('.modal-body textarea');
        sms_text.unbind('keypress');
        sms_text.keypress(function() {
            updateCountLabel();
        });

        sms_text.val('');
        updateCountLabel();

        var send_button = contactDialog.find('.modal-footer button.btn-send-support-msg');
        send_button.unbind('click');
        send_button.click(function() {
            hide();
            processSend();
            return false;
        });

        contactDialog.modal('show');
    }

    function processSend() {
        var contactDialog = $(_modalClassName);

        loading_modal.show('Sending...');
        var text = contactDialog.find('.modal-body textarea').val();
        $.ajax({
            type: 'POST',
            url: '/nlp',
            data: {text: text}
        }).error(function(e) {
            onNLPResult(null, text);
            console.log('an error occurred with sentiment analysis: ' + e);
        }).done(function(result) {
            onNLPResult(result ,text);
        });
    }

    function onNLPResult(nlp_result, text) {
        $.ajax({
            type: 'POST',
            url: '/ean/' + _ean + '/feedback',
            data: {
                text: text,
                nlp: nlp_result
            }
        }).error(function(e) {
            onMessageSent(nlp_result, text, null);
            console.log('an error occurred with reporting this feedback: ' + e);
        }).done(function(result) {
            onMessageSent(nlp_result, text, result);
        });
    }

    function onMessageSent(nlp_result, text, send_message_result) {

        if(nlp_result.is_medical) {
            loading_modal.hide();
            _onMedical();
            return;
        }

        if(nlp_result != null && parseFloat(nlp_result.probability) >= _nlpThreshold ) { // TODO: should be on server...

            if(nlp_result.sentiment.toLowerCase() == 'positive') {
                loading_modal.hide();
                _onPositive(send_message_result.coupons, nlp_result.sentiment.toLowerCase());
                return;

            } else if(nlp_result.sentiment.toLowerCase() == 'negative') {
                loading_modal.hide();
                _onNegative(send_message_result.coupons, nlp_result.sentiment.toLowerCase());
                return;
            }
        }
        loading_modal.hide();
        _onNeutral();
    }

    function hide() {
        $(_modalClassName).modal('hide');
    }

    function updateCountLabel() {
        var contactDialog = $(_modalClassName);
        contactDialog.find('.modal-body .remaining-characters').text((_maxTextLimit - contactDialog.find('.modal-body textarea').val().length) + ' characters remaining');
    }

    return {
        show: show,
        hide: hide
    }
}(contact_support_modal));