var confirm_modal = (function() {

    var _modalClassName = '.modal-confirm';
    var _addedCancelClass = '';
    var _addedOkClass = '';

    var confirm_modal_template_def =
        '<div class="modal-confirm modal fade" role="dialog">' +
            '<div class="modal-dialog" style="background-color: #fff;">' +
                '<div class="modal-header">' +
                    '<button class="close" data-dismiss="modal">x</button>' +
                    '<h4></h4>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p></p>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button data-dismiss="modal" class="cancel btn">Cancel</button>' +
                    '<button class="submit btn">Ok</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    function setButtonClasses(cancelButtonClass, okButtonClass) {
        var dialog = $(_modalClassName);
        if(_addedCancelClass.length > 0) {
            dialog.find('button.cancel').removeClass(_addedCancelClass);
        }
        if(cancelButtonClass) {
            dialog.find('button.cancel').addClass(cancelButtonClass);
            _addedCancelClass = cancelButtonClass;
        }

        if(_addedOkClass.length > 0) {
            dialog.find('button.submit').removeClass(_addedOkClass);
        }
        if(okButtonClass) {
            dialog.find('button.submit').addClass(okButtonClass);
            _addedOkClass = okButtonClass;
        }
    }

    function setButtonText(cancelButtonText, okButtonText) {
        var dialog = $(_modalClassName);
        dialog.find('button.cancel').text(cancelButtonText);
        dialog.find('button.submit').text(okButtonText);
    }

    function show(title, text, onOk, onCancel, onHidden) {
        var dialog = $(_modalClassName);
        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        dialog.find('.modal-body > p').html(text);
        dialog.find('.modal-header > h4').html(title);

        dialog.find('button.submit').unbind('click');
        dialog.find('button.submit').click(function() {
            hide();
            onOk();
            return false;
        });

        dialog.find('button.cancel').unbind('click');
        dialog.find('button.cancel').click(function() {
            hide();
            if(onCancel) {
                onCancel();
            }
        });

        dialog.on('hidden.bs.modal', function() {
            if(onHidden) {
                onHidden();
            }
        });

        dialog.modal('show');
    }

    function hide() {
        $(_modalClassName).modal('hide');
    }

    function getHtml() {
        return doT.template(confirm_modal_template_def)({});

    }

    return {
        setButtonClasses: setButtonClasses,
        setButtonText: setButtonText,

        show: show,
        hide: hide,
        getHtml: getHtml
    }
}());

$(function() {
    $('body').append(confirm_modal.getHtml());
});