// requires:
// - doT

var view_attachments_widget = (function() {

    var default_options = {
        container: null,
        files: [],
        allow_remove: false,
        onRemoveFile: function(file) { }
    };

    var widget_template_def =
        '<div class="view-attachments-widget">' +
            '{{~it.files :file_info:file_index}}' +

                '<div class="attachment-item">' +

                    // if the file is an image
                    '{{?file_info.type && file_info.type.indexOf("image") == 0}}' +
                        '<img data-type="{{=file_info.type}}" src="{{=general_util.processImageLink(file_info.link)}}">' +


                    // if the file is an image
                    '{{??file_info.type && file_info.type.indexOf("video") == 0}}' +
                        '<div class="video" data-url="{{=file_info.link}}"><i class="glyphicon glyphicon-film"></i></div>' +

                    // else, it's treated as audio
                    '{{??}}' +
                        '<div class="audio" data-url="{{=file_info.link}}"><i class="glyphicon glyphicon-headphones"></i></div>' +
                    '{{?}}' +

                    '{{?it.allow_remove}}' +
                        '<div class="remove" data-index="{{=file_index}}"><i class="glyphicon glyphicon-remove"></i></div>' +
                    '{{?}}' +


                '</div>' +

                // add a separator
                '{{?file_index < it.files.length - 1}}<hr>{{?}}' +

            '{{~}}' +
        '</div>';

    var widget_template = doT.template(widget_template_def);

    function init(options_in) {

        var options = $.extend({}, default_options, options_in);

        // we only currently show favorite products
        options.container.html(widget_template({
            files: options.files,
            allow_remove: options.allow_remove
        }));

        options.container.find('.video').click(function() {
            window.open($(this).data('url'), '_system');
            return false;
        });

        options.container.find('.audio').click(function() {
            window.open($(this).data('url'), '_system');
            return false;
        });

        options.container.find('.remove').click(function() {
            options.onRemoveFile(options.files[$(this).data('index')]);
            return false;
        });

        console.log(options.files);
    }

    return {
        init: init
    }

}());