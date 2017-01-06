var star_rating_widget = (function () {

    var info_template_ref =
        '{{~it.stars :value:index}}' +
            '{{?value == 0}}' +
                '<a class="star-rating" data-score={{=index + 1}}><i class="glyphicon glyphicon-star-empty icon icon-star-empty" style="{{=it.unselected_style}}"></i></a>' +
            '{{?? value == 0.5}}' +
                '<a class="star-rating" data-score={{=index + 1}}><i class="glyphicon glyphicon-star-half icon icon-star-half" style="{{=it.selected_style}}"></i></a>' +
            '{{??}}' +
                '<a class="star-rating" data-score={{=index + 1}}><i class="glyphicon glyphicon-star icon icon-star" style="{{=it.selected_style}}"></i></a>' +
            '{{?}}' +
        '{{~}}' +
        '<div class="clearfix" style="margin-bottom: 10px;"></div>' +
        '<a class="star-info">what do these mean?</a>';

    var star_info_contents =
        '<div style="font-size: 14px;">' +
        '<div>1 star:<br>Was Not Helpful</div>' +
        '<div>2 star:<br>Could Not Find What I Was Looking For</div>' +
        '<div>3 star:<br>Helpful but Looking for More Information</div>' +
        '<div>4 star:<br>Helpful Found What I Was Looking For</div>' +
        '<div>5 star:<br>Very Helpful Will Use It Again</div>' +
        '</div>';

    var info_template = doT.template(info_template_ref);

    function init(container, options) {
        var _options = {
            supports_half_stars: false,
            unselected_style: 'margin-right: 5px;',
            selected_style: 'color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;',
            value: 0,
            selection_enabled: true,
            number_of_stars: 5,
            on_selected: function(star_rating) { console.log(star_rating); }
        };
        if(options) {
            Object.keys(options).forEach(function(key) {
                _options[key] = options[key];
            });
        }

        _options.stars = [];
        for(var i=0; i<_options.number_of_stars; i++) {
            if(_options.value <= i) {
                _options.stars.push(0);
            } else if(_options.value <= i + 0.5 && _options.supports_half_stars) {
                _options.stars.push(0.5);
            } else {
                _options.stars.push(1);
            }
        }

        container.html(info_template(_options));

        if(_options.selection_enabled) {
            container.find('.star-rating').click(function() {
                _options.on_selected($(this).data('score'));
            });
        }

        container.find('a.star-info').click(function() {
            alert_modal.show('Info', star_info_contents);
        });
    }

    return {
        init: init
    };

}());
