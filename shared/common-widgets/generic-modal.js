var generic_modal = (function() {

    var _default_options = {
        className: 'modal-generic',
        showHeader: true,
        showFooter: true,
        headerHtml: '',
        bodyHtml: '',
        footerHtml: '',
        removeOnHide: true,
        onOk: function() {},
        onCancel: function() {},
        onHidden: function() {}
    };

    var modal_template_def =
        '<div class="{{=it.className}} modal fade" role="dialog">' +
            '<div class="modal-dialog" style="background-color: #fff;">' +
                '{{?it.showHeader}}' +
                    '<div class="modal-header">' +
                        '<button class="close" data-dismiss="modal"><i class="glyphicon glyphicon-remove"></i></button>' +
                        '{{=it.headerHtml}}' +
                    '</div>' +
                '{{?}}' +
                '<div class="modal-body">' +
                    '{{=it.bodyHtml}}' +
                '</div>' +
                '{{?it.showFooter}}' +
                    '<div class="modal-footer">' +
                        '{{=it.footerHtml}}' +
                    '</div>' +
                '{{?}}' +
            '</div>' +
        '</div>';

    var modal_template = doT.template(modal_template_def);

    function init(options) {
        var context = {};

        var final_options = $.extend(true, {}, _default_options, options);

        context.selector = final_options.container.append(modal_template(final_options));

        // do bootstrap init
        var dialog = options.container.find('.' + final_options.className);
        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });

        context.hide = function() {
            dialog.modal('hide'); // will trigger 'hidden.bs.modal' event
        };

        // catch hidden event from bootstrap modal
        dialog.on('hidden.bs.modal', function() {
            final_options.onHidden();
            dialog.remove();
        });

        // show the dialog immediately
        dialog.modal('show');

        context.getBody = function() {
            return dialog.find('.modal-body');
        };

        // give the caller an object representing this instance of generic_modal
        return context;
    }

    return {
        init: init
    }
}());