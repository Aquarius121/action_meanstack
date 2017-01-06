// requires:
//link(rel='stylesheet', href='/stylesheets/fileupload/jquery.fileupload.css')
//script(src="/js/tpl/fileupload/jquery.ui.widget.js")
//script(src="/js/tpl/fileupload/jquery.fileupload.min.js")
//script(src="/js/tpl/fileupload/jquery.iframe-transport.js")
//script(src="/js/widgets/file-upload-widget.js")
var file_upload_widget = (function() {

    var template_def =
        '<span class="btn fileinput-button {{=it.buttonClasses}}">' +
            '<i class="{{=it.iconClassString}}"></i>' +
            '<span>{{=it.text}}</span>' +
            '<input type="file" name="file"{{? it.multi}}multiple{{?}} data-sequential-uploads="false" class="fileupload {{=it.className}}">' +
        '</span>';

    var template = doT.template(template_def);

    var default_options = {
        text: '',
        buttonClasses: '',
        iconClassString: '',
        multi: true,
        className: ''
    };

    function init(container, url, customizations, onSuccess, onFailure) {

        var options = $.extend({}, default_options, customizations);
        container.html(template(options));

        var widget = container.find('input');
        widget.unbind('change');
        widget.change(function (e) {
            loading_modal.show('Loading...');
        });

        container.fileupload({
            url: url,
            dataType: 'json',
            pasteZone: null,
            error: function(e) {
                if(e.status == 200) {
                    loading_modal.hide();
                    onSuccess(e);
                } else {
                    loading_modal.hide();
                    onFailure(e);
                }
            },
            done: function (e, data) {
                loading_modal.hide();
                onSuccess(data);
            }
        });
    }

    return {
        init: init
    }
}());
