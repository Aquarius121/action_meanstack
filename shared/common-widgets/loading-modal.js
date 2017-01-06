var loading_modal = (function() {

    var default_loading_text = 'Loading';

    // TODO: remove inline styles, though I think they are only undefined on server
    var loading_modal_template_def =
        '<div class="modal-loading modal" style="height:165px; width: 165px; margin-left: -82px; left: 50%; top: 50%; margin-top: -75px; overflow: visible;">' +
            '<div class="modal-content">' +
                '<div class="modal-body" style="border-radius: 10px;">' +
                    '<div class="loading-message" style="height:65px; width: 135px;">' +
                        '<div class="loading-child" style="margin-left: 63px; margin-top: 60px;"></div>' +
                    '</div>' +
                    '<div style="text-align: center;" class="loading-text">' + default_loading_text + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    // timeout_ms defaults to 1 minute.  If <= 0, no timeout is applied
    function show(loadingText, timeout_ms) {
        var loadingMessage = $('.modal-loading');
        loadingMessage.modal({ show : false, keyboard : false, backdrop : 'static' });
        loadingMessage.find('.modal-body').find('.loading-text').html(typeof(loadingText) == 'undefined' ? default_loading_text : loadingText);

        var spinner_container = loadingMessage.find('.loading-child');

        if(spinner_container.children().length > 0) {
            loadingMessage.modal('show');
            return;
        }

        if(typeof(this.spinner) == 'undefined') {
            var opts = {
                lines: 13, // The number of lines to draw
                length: 20, // The length of each line
                width: 10, // The line thickness
                radius: 30, // The radius of the inner circle
                corners: 1, // Corner roundness (0..1)
                rotate: 0, // The rotation offset
                direction: 1, // 1: clockwise, -1: counterclockwise
                color: '#000', // #rgb or #rrggbb or array of colors
                speed: 1, // Rounds per second
                trail: 60, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                top: 'auto', // Top position relative to parent in px
                left: 'auto' // Left position relative to parent in px
            };
            this.spinner = new Spinner(opts)
        }
        var target = spinner_container.get(0);
        this.spinner.spin(target);

        loadingMessage.modal('show');

        if(typeof(timeout_ms) == 'undefined') {
            setTimeout(hide, 60000);
            return;
        }
        if(timeout_ms > 0) {
            setTimeout(hide, timeout_ms);
        }
    }

    function hide() {
        $('.modal-loading').modal('hide');
        if(typeof(this.spinner) != 'undefined') {
            this.spinner.stop();
        }
    }

    function getHtml() {
        return doT.template(loading_modal_template_def)({});
    }

    return {
        show: show,
        hide: hide,
        getHtml: getHtml
    }
}());

$(function() {
    $('body').append(loading_modal.getHtml());
});