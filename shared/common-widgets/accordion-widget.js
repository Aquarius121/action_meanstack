// Handles DOM-building and extra details for a bootstrap accordion
//
// Sample usage:
// AccordionWidget.init({
//    container: options.container,
//    className: 'stream-feed-settings',
//    items:[
//          { title: 'Facebook Page', className: 'facebook-page' },
//          { title: 'Facebook Message', className: 'facebook-message' }
//    ]
// });
//
// AccordionWidget.addItems(options.container, [{
//    title: 'Web Feeds', className: 'web-feeds'
// }]);
//
// requires:
// - bootstrap
// - doT
var accordion_widget = (function () {

    var default_options = {
        container: null,            // required
        className: null,            // required - do not use . in front
        isOneOpenAtATime: false,    // optional
        tabsInitiallyOpen: true,    // optional - currently applies only to isOneOpenAtATime = false
        isStriped: false,           // optional
        enabled: true,              // optional
        delayBodyRendering: false,  // optional (TODO: in progress)
        items: [{
            title: 'panel 1',
            className: 'panel1',    // required and must be unique per item
            titleFunction: null,    // optional, takes precedence over title property (function that returns title contents)
            bodyFunction: function(){ return '';}, // function that returns body contents
            headFunction: function(){ return '';}  // function that returns header pull-right content
        }]
    };

    function init(options_in) {
        "use strict";

        var options = $.extend(true, {}, default_options, options_in);

        // Seems unlikely you'd want an accordion in this case
        if (options_in.items.length === 0) {
            options.items = [];
        }

        options.container.html(template(options));

        if(options.delayBodyRendering) {
            options.container.find('> .panel').on('shown.bs.collapse', function() {
                alert('open');
                //options.container.find('panel-body-' + item.className).html('opened bodyFunction()');
            });
        }
    }

    function addItems(container, items) {
        "use strict";

        var template_options = {
            items: items,
            enabled: container.find('.panel-group').data('enabled'),
            isOneOpenAtATime: container.find('.panel-group').data('singleton')
        };

        container.find('.panel').append(items_template(template_options));
    }

    function removeItem(container, className) {
        container.find('.panel > div.panel-heading-' + className + ', .panel > div.collapse-' + className).remove();
    }

    function getBodyContainer(options, className) {
        return options.container.find('.panel-body-' + className);
    }

    function getHeaderWidgetContainer(options, className) {
        return options.container.find('.panel-heading-' + className).find('.header-widget-container');
    }

    function toggleCollapsed(container) {
        var data_toggle = container.find('> .panel > .panel-heading a[data-toggle=collapse]');
        var collapse_body = container.find('> .panel > .panel-collapse.collapse');
        collapse_body.collapse('toggle');
        data_toggle.toggleClass('collapsed');
    }

    var items_template_def =
        '{{~it.items :item:item_index}}' +
            '<div class="panel-heading  panel-heading-{{=item.className}}">' +
                '<h4 class="panel-title">' +
                    '{{?it.isOneOpenAtATime}}' +
                        '<a {{?it.enabled}}data-toggle="collapse" data-parent=".{{=it.className}}" href=".collapse-{{=item.className}}" {{?}}class="{{?item_index != 0}}collapsed{{?}}">' +
                    '{{??}}' +
                        '<a {{?it.enabled}}data-toggle="collapse" href=".collapse-{{=item.className}}" {{?}}class="{{?!it.tabsInitiallyOpen}}collapsed{{?}}">' +
                    '{{?}}' +
                    '<i class="si si-downarrow"></i>' +
                    '<span>{{?item.titleFunction}}{{=item.titleFunction()}}{{??}}{{=item.title}}{{?}}</span>' +
                    '<div class="pull-right header-widget-container">{{?item.headFunction}}{{=item.headFunction()}}{{?}}</div>' +
                    '</a>' +
                '</h4>' +
            '</div>' +
            '{{?it.isOneOpenAtATime}}' +
                '<div class="panel-collapse collapse {{?item_index == 0}}in {{?}}collapse-{{=item.className}}">' +
            '{{??}}' +
                '<div class="panel-collapse collapse {{?it.tabsInitiallyOpen}}in {{?}}collapse-{{=item.className}}">' +
            '{{?}}' +
                '<div class="panel-body panel-body-{{=item.className}}">{{?item.bodyFunction && !it.delayBodyRendering}}{{=item.bodyFunction()}}{{?}}</div>' +
            '</div>' +
        '{{~}}';

    var template_def =
        '<div class="panel-group accordion {{?it.isStriped}}striped{{?}} accordion-semi {{=it.className}}" data-singleton="{{=it.isOneOpenAtATime}}" data-enabled="{{=it.enabled}}">' +
            '<div class="panel panel-default">' +
                items_template_def +
            '</div>' +
        '</div>';

    var template = doT.template(template_def);
    var items_template = doT.template(items_template_def);

    return {
        init : init,
        addItems: addItems,
        removeItem: removeItem,
        getHeaderWidgetContainer: getHeaderWidgetContainer,
        getBodyContainer: getBodyContainer,
        toggleCollapsed: toggleCollapsed
    };

}());
