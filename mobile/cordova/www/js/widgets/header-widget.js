var header_widget = (function() {

    var header_container, right_nav_container;

    function init() {
        header_container = $('body > .content > div[data-role=header]');
        right_nav_container = header_container.find('.right-nav');
    }

    function update(text) {
        if(typeof(text) != 'undefined' && text && text.length > 0) {
            header_container.find('.text').html(text);
            header_container.find('.brand').addClass('hidden');
            return;
        }
        header_container.find('.text').html('');
        header_container.find('.brand').removeClass('hidden');
    }

    function setVisible(is_visible) {
        if(is_visible) {
            header_container.removeClass('hidden');
            return;
        }
        header_container.addClass('hidden');
    }

    function setRightNavVisible(is_visible) {
        if(is_visible) {
            right_nav_container.removeClass('hidden');
            return;
        }
        right_nav_container.addClass('hidden');
    }

    return {
        init: init,
        update: update,
        setVisible: setVisible,
        setRightNavVisible: setRightNavVisible
    }
}());

