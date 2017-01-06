// requires:
// - doT

var opt_ins_widget = (function() {

    var default_options = {
        remote_url: null,
        container: null,
        opt_ins: [],
        user_id: null,
        onBrandSelected: function(brand_id) {}
    };

    var opt_ins_template_def =
        '<div class="opt-ins-widget">' +
            '{{?!it || it.length == 0}}' +
                '<div class="text-center no-favorites">You have not opted into any brand communications.</div>' +
            '{{??}}' +
                '{{~it :value:index}}' +
                    '<div class="well opt-in-widget" data-brand="{{=value._id}}">' +
                        '<div class="image-container">' +
                            '{{?value.logo_url}}<img src="{{=value.logo_url}}">{{?}}' +
                        '</div>' +
                        '<div class="opt-ins-info">' +
                            '<a class="brand-link" data-id="{{=value._id}}">{{=value.name}}</a>' +
                            '<a class="remove-opt pull-right" data-id="{{=value._id}}"><i class="glyphicon glyphicon-remove-circle"></i></a>' +
                            '<div class="clearfix"></div>' +
                            '{{?value.link}}' +
                                '<a class="favorite-link pull-left" data-link="{{=value.link}}">{{=value.link}}</a>' +
                            '{{?}}' +
                            '{{?value.privacy_policy_url}}' +
                                '<a class="policy-link" data-link="{{=value.privacy_policy_url}}">privacy policy</a>' +
                            '{{?}}' +
                        '</div>' +

                    '</div>' +
                '{{~}}' +
            '{{?}}' +
        '</div>';

    var opt_ins_template = doT.template(opt_ins_template_def);

    function init(options_in) {

        var options = $.extend({}, default_options, options_in);

        // we only currently show favorite products
        options.container.html(opt_ins_template(options.opt_ins.brands));

        options.container.find('a.favorite-link').click(function() {
            window.open($(this).data('link'), "_system");
        });

        options.container.find('a.remove-opt').click(function() {
            var brand_id = $(this).data('id');
            var url = options.remote_url + '/opt-in?brand=' + brand_id + '&id=' + options.user_id;

            $.ajax({
                type: 'DELETE',
                url: url
            }).error(function(e) {
                alert_modal.showFromXHR('Error', e);
            }).success(function() { // result
                options.opt_ins.brands = options.opt_ins.brands.filter(function(optin) {
                    return optin._id != brand_id;
                });
                init(options);
            });
        });

        options.container.find('a.policy-link').click(function() {
            window.open($(this).data('link'), "_system");
        });

        options.container.find('a.brand-link').click(function() {
            options.onBrandSelected($(this).data('id'));
        });
    }

    return {
        init: init
    }

}());