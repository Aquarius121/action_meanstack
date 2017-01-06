var rating_widget = (function () {

    var info_template_ref =
        '{{~it.stars :value:index}}' +
            '<a class="rating-option" data-score={{=index}}><i class="{{=value.rating_classes}}" style="{{=value.rating_style}}"></i></a>' +
        '{{~}}' +
        '<div class="clearfix"></div>';

    var info_template = doT.template(info_template_ref);

    function init(container, options) {
        var _options = {
            stars: [
                {
                    //rating_classes: 'glyphicon glyphicon-star-empty icon icon-star-empty',
                    //rating_style: 'margin-right: 5px;'
                }
            ],
            selection_enabled: true,
            onSelected: function(star_index) { console.log(star_index); }
        };

        _options = $.extend({}, _options, options);

        container.html(info_template(_options));

        if(_options.selection_enabled) {
            container.find('.rating-option').click(function() {
                _options.onSelected($(this).data('score'));
            });
        }
    }

    return {
        init: init
    };

}());
