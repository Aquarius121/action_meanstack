// requires:
// - doT

var opt_toggle_widget = (function() {

    var template_def =
        '<div class="toggle-widget">' +
            '{{? it.brand}}' +
                '{{? it.brand.opt}}' +
                    '<a class="optout">' +
                        '<i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Opted In"></i> opted in' +
                    '</a>' +
                    '<a class="optin" style="display: none;">' +
                        '<i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> opt in' +
                    '</a>' +
                '{{??}}' +
                    '<a class="optin">' +
                        '<i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> opt in' +
                    '</a>' +
                    '<a class="optout" style="display: none;">' +
                        '<i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Opted In"></i> opted in' +
                    '</a>' +
                '{{?}}' +
            '{{?}}' +
        '</div>';

    var template = doT.template(template_def);

    // expects brand.opt to be set
    function init(remote_url, brand, container, caller) {
        container.html(template({
            brand: brand,
            caller: caller,
            active_class: 'fa fa-check-square-o',
            inactive_class: 'fa fa-square-o'
        }));

        var opt_ins = container.find('a.optin');
        var opt_outs = container.find('a.optout');

        opt_ins.click(function() {
            var that = $(this);
            saveOpt(that);
        });

        opt_outs.click(function() {
            var that = $(this);
            var url = remote_url + '/opt-in?id=' + caller._id + '&brand=' + brand._id;

            $.ajax({
                type: 'DELETE',
                url: url,
                data: {
                    brand: brand._id
                }
            }).error(function(e) {
                alert_modal.showFromXHR('Error', e);
            }).done(function() { // result
                delete brand.opt;

                opt_outs.css('display', 'none');
                opt_ins.css('display', '');
            });
        });

        function saveOpt(widget) {
            var url = remote_url + '/opt-in?id=' + caller._id + '&brand=' + brand._id;
            var data = {
                brand: brand._id
            };

            $.ajax({
                type: 'PUT',
                url: url,
                data: data
            }).error(function(e) {
                alert_modal.showFromXHR('Error', e);
            }).done(function() { // result
                brand.opt = true;

                opt_ins.css('display', 'none');
                opt_outs.css('display', '');
            });
        }
    }

    return {
        init: init
    }
}());