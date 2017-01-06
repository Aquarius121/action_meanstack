var auto_message_utils = (function() {

    var is_showing_auto_message_once = true;

    function tryShowAutoMessage(product_info, onShowMessage) {
        if(typeof(product_info) == 'undefined') {
            return;
        }

        if(!_tryShowProductAutoMessage(product_info, onShowMessage)) {
            _tryShowBrandAutoMessage(product_info, onShowMessage);
        }
    }

    function _tryShowProductAutoMessage(product_info, onShowMessage) {
        if(typeof(product_info.product) != 'undefined' &&
            typeof(product_info.product.auto_message) != 'undefined' &&
            product_info.product.auto_message &&
            product_info.product.auto_message.trim().length > 0) {

            // don't show the message if it's past the expiration (TODO: erase it, too)
            if(typeof(product_info.product.auto_message_expiration) != 'undefined') {
                var expiration_timestamp = moment(product_info.product.auto_message_expiration).utc().valueOf();
                if(expiration_timestamp <= moment().utc().valueOf()) {
                    return false;
                }
            }

            if(!is_showing_auto_message_once) {
                showAutoMessage(product_info.product.auto_message, onShowMessage);
                return true;
            }

            var settings = settings_manager.get();

            // if a record for this product doesn't exist
            if(typeof(settings.product_auto_messages[product_info.product.ean]) == 'undefined') {
                settings.product_auto_messages[product_info.product.ean] = [ product_info.product.auto_message ];
                settings_manager.save(settings);

                showAutoMessage(product_info.product.auto_message, onShowMessage);
                return true;
            }

            // check texts of auto messages
            if(settings.product_auto_messages[product_info.product.ean].indexOf(product_info.product.auto_message) == -1) {
                settings.product_auto_messages[product_info.product.ean].push(product_info.product.auto_message);
                settings_manager.save(settings);

                showAutoMessage(product_info.product.auto_message, onShowMessage);
                return true;
            }
        }
        return false;
    }

    function _tryShowBrandAutoMessage(product_info, onShowMessage) {
        if(typeof(product_info.brand) != 'undefined' &&
            typeof(product_info.brand.auto_message) != 'undefined' &&
            product_info.brand.auto_message &&
            product_info.brand.auto_message.trim().length > 0) {

            // don't show the message if it's past the expiration (TODO: erase it, too)
            if(typeof(product_info.brand.auto_message_expiration) != 'undefined') {
                var expiration_timestamp = moment(product_info.brand.auto_message_expiration).utc().valueOf();
                if(expiration_timestamp <= moment().utc().valueOf()) {
                    return false;
                }
            }

            if(!is_showing_auto_message_once) {
                showAutoMessage(product_info.brand.auto_message, onShowMessage);
                return true;
            }

            var settings = settings_manager.get();

            // if a record for this brand doesn't exist
            if(typeof(settings.brand_auto_messages[product_info.brand._id]) == 'undefined') {
                settings.brand_auto_messages[product_info.brand._id] = [ product_info.brand.auto_message ];
                settings_manager.save(settings);

                showAutoMessage(product_info.brand.auto_message, onShowMessage);
                return true;
            }

            // check texts of auto messages
            if(settings.brand_auto_messages[product_info.brand._id].indexOf(product_info.brand.auto_message) == -1) {
                settings.brand_auto_messages[product_info.brand._id].push(product_info.brand.auto_message);
                settings_manager.save(settings);

                showAutoMessage(product_info.brand.auto_message, onShowMessage);
                return true;
            }
        }
        return false;
    }

    function showAutoMessage(message, onShowMessage) {
        if(typeof(onShowMessage) == 'undefined') {
            alert_modal.show('Message', message);
            general_util.makeLinksSafe(alert_modal.get());
        }
    }

    return {
        tryShowAutoMessage: tryShowAutoMessage
    }
}());