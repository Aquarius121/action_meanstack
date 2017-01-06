var select_brand_modal = (function() {

    var _modalSelectorString = '.modal-select-brand';

    function init() {
        var dialog = $(_modalSelectorString);
        brand_select.init(dialog.find('.brand-select-widget'));
    }

    function show(title, text, onOk) {
        var dialog = $(_modalSelectorString);
        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        dialog.find('.modal-body > p').html(text);
        dialog.find('.modal-header > h4').html(title);

        dialog.find('button.submit').unbind('click');
        dialog.find('button.submit').click(function() {
            hide();
            onOk();
            return false;
        });

        dialog.modal('show');
    }

    function hide() {
        $(_modalSelectorString).modal('hide');
    }

    function getSelection() {
        var dialog = $(_modalSelectorString);
        return brand_select.getSelection(dialog.find('.brand-select-widget'));
    }

    return {
        init: init,
        show: show,
        hide: hide,
        getSelection: getSelection
    }
}());