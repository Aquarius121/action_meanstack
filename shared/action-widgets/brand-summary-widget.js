// requires:
// - doT

var brand_summary_widget = (function() {

     var template_def =
        '<div class="brand-summary-widget animation-flicker-fix" style="padding-bottom: 20px;">' +
            '<div class="pull-left animated flipInX" style="">' +
                '<div><h3>{{=it.brand.name}}</h3></div>' +
                '{{?it.brand.logo_url}}<img src="{{=it.brand.logo_url}}">{{?}}' +

                '{{? it.brand.facebook_link}}' +
                '{{?}}' +
            '</div>' +
            '<div class="clearfix"></div>' +
        '</div>';

    var template = doT.template(template_def);

    var default_options = {
        caller: null,
        remote_url: null,
        brand_id: null
    };

    function init(options_in) {
        var options = $.extend({}, default_options, options_in);

        var url = options.remote_url + '/brand/' + options.brand_id;

        // TODO: app_util.makeRequest?
        $.ajax({
            type: 'GET',
            url: url
        }).error(function() {
            loading_modal.hide();
            window.alert('an error occurred');
        }).done(function(result) {
            if(result.length > 0) {
                var html = template({
                    brand: result[0],
                    caller: options.caller
                });
                options.container.html(html);
            }
        });
    }

    return {
        init: init
    }
}());