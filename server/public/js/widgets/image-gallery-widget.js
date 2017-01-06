/*
    on init, attaches a modal to the body with id=blueimp-gallery
    when brand is retreived, it can be passed to setContents
 */

var image_gallery_widget = (function () {

    var modal_template_def =
        '<div id="blueimp-gallery" class="blueimp-gallery blueimp-gallery-controls">' +
            '<div class="slides"></div>' +
            '<h3 class="title"></h3>' +
            '<a class="prev">‹</a>' +
            '<a class="next">›</a>' +
            '<a class="btn btn-danger delete">Delete</a>' +
            '<a class="close">×</a>' +
            '<a class="play-pause"></a>' +
            '<ol class="indicator"></ol>' +
            '<div class="modal fade">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<button class="close" type="button" aria-hidden="true">&times;</button>' +
                            '<h4 class="modal-title"></h4>' +
                        '<div class="modal-body next"></div>' +
                        '<div class="modal-footer">' +
                            '<button class="btn btn-default pull-left prev" type="button">' +
                                '<i class="glyphicon glyphicon-chevron-left"></i>' +
                                'Previous' +
                            '</button>' +
                            '<button type="button" class="btn btn-primary next">' +
                                'Next' +
                                '<i class="glyphicon glyphicon-chevron-right"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    var gallery_template_def =
        '<div class="gallery-link-container">' +
            '{{?it.content}}' +
                '{{~it.content :url:index}}' +
                    '<a href="{{=url}}" title="{{=url}}">' +
                        '<img src="{{=url}}" data-gallery="" style="max-width: 200px; max-height: 200px;">' +
                    '</a>' +
                '{{~}}' +
            '{{?}}' +
        '</div>';

    var gallery_template = doT.template(gallery_template_def);
    var modal_template = doT.template(modal_template_def);

    function init() {
        $('body').prepend(modal_template({}));
    }

    function setContainerContents(link_container, brand, onDelete) {
        link_container.html(gallery_template(brand));

        var gallery_container = $('.blueimp-gallery');

        link_container.click(function(event) {
            event = event || window.event;
            var target = event.target || event.srcElement,
                link = target.src ? target.parentNode : target,
                options = {index: link, event: event},
                links = this.getElementsByTagName('a');

            var gallery = blueimp.Gallery(links, options);

            gallery_container.find('.delete').unbind('click');
            gallery_container.find('.delete').click(function() {
                var pos = gallery.getIndex();

                var url = $('.blueimp-gallery').find('.slide[data-index=' + pos + '] > img').attr('src');
                gallery.close();

                if(onDelete) {
                    onDelete(url);
                }
            });
        });
    }

    return {
        init : init,
        setContents: setContainerContents
    };
}());
