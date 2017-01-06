var alert_modal = (function() {

    var alert_modal_template_def =
        '<div class="modal-alert modal">' +
            '<div class="modal-content">' +
                '<div class="modal-header">' +
                    '<button class="close" data-dismiss="modal">x</button>' +
                    '<h4></h4>' +
                '</div>' +
                '<div class="modal-body" style="overflow: auto;">' +
                    '<p></p>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button data-dismiss="modal" class="btn-ok btn btn-warning">OK</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    var _modalClassName = '.modal-alert';

    function show(title, text, onComplete) {
        var dialog = $(_modalClassName);
        var okButton = dialog.find('button.btn-ok');

        // bind onComplete event
        okButton.unbind('click');
        if(typeof(onComplete) != 'undefined') {
            okButton.click(onComplete);
        }

        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        dialog.find('.modal-body > p').html(text);
        dialog.find('.modal-header > h4').html(title);
        dialog.modal('show');
    }

    function showFromXHR(title, xhr, onComplete) {
        if(typeof(xhr.responseText) != 'undefined' && xhr.responseText.length > 0) {
            show(title, xhr.responseText, onComplete);
            return;
        }

        if(xhr.responseCode == 404) {
            show(title, 'not found', onComplete);
            return;
        }

        show(title, 'response code: ' + xhr.responseCode);
    }

    function hide() {
        $(_modalClassName).modal('hide');
    }

    function getHtml() {
        return doT.template(alert_modal_template_def)({});
    }

    function get() {
        return $(_modalClassName);
    }

    return {
        show: show,
        hide: hide,
        showFromXHR: showFromXHR,
        getHtml: getHtml,
        get: get
    }
}());

$(function() {
    $('body').append(alert_modal.getHtml());
});