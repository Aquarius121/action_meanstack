var choose_content_widget = (function() {

    var gallery_template_def =
        '<div class="gallery-link-container">' +
            '{{?it.content}}' +
                '{{~it.content url:index}}' +
                    '<a>' +
                        '<img src="{{=url}}" href="{{=url}}" title="{{=url}}" data-gallery="" style="max-width: 200; max-height: 200;">' +
                    '</a>' +
                '{{~}}' +
            '{{?}}' +
        '</div>';

    var gallery_template = doT.template(gallery_template_def);

    function init(container, brand) {
        container.html('<div class="gallery-link-container"></div>');
        gallery_template(brand);
    }

    return {
        init: init
    }
}());
