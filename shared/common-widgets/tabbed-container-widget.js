// Abstracts the building and operation of a collection of tabbed panels
// requires:
// - doT
// - bootstrap
// - jquery
var tabbed_container_widget = (function () {

    var default_options = {
        initialTab: null,           // (optional) takes precedence over window hash
        tabs: [{
            className: 'tab-one',   // required
            label: 'Tab One',       // required
            onOpened: function(){}, // (optional)
            hash: 'tab1'            // (optional)
        }],
        style: 'tabs',              // (optional) can be 'tabs' or 'dropdown'
        secondary_label: '',        // (optional)
        processHashes: false,
        onTabOpened: function(tabClassName, tabSelector) {}
    };

    function init(container, options_in) {
        "use strict";

        var options = $.extend(true, {}, default_options, options_in);

        if(options.style == 'tabs') {
            return _initTabStyle(container, options);
        }
        return _initDropdownStyle(container, options);
    }

    function openTab(container, target, options_in) {
        var options = $.extend(true, {}, default_options, options_in);

        if(options.style == 'tabs') {
            _openTabForTabStyle(container, target, options);
            return;
        }
        _openTabForDropdownStyle(container, target, options);
    }

    function _initDropdownStyle(container, options) {
        var _interface = {
            getCurrentTabInfo: getCurrentTabInfo
        };

        function getCurrentTabInfo() {
            var activeTabClass = container.find('.tab-pane.active').data('tab');

            var activeTab = _getTabInfo(options, function(tab) {
                return tab.className == activeTabClass;
            });

            return {
                target: activeTab.className,
                label: activeTab.label
            };
        }

        container.html(dropdown_template(options));

        container.find('a.type-selector').click(function() {
            var tabClass = $(this).data('tab');
            openTab(container, tabClass, options);
        });

        return _interface;
    }

    function _initTabStyle(container, options) {
        var _interface = {
            getCurrentTabInfo: getCurrentTabInfo
        };

        function getCurrentTabInfo() {
            var activeTab = container.find('li.active > a');

            return {
                target: activeTab.data('toggle-target').substr(1),
                label: activeTab.text()
            };
        }

        container.html(tabs_template(options));

        container.find('a[data-toggle="tab"]').click(function() {
            openTab(container, $(this).data('toggle-target'), options);
        });

        if(options.initialTab) {
            openTab(container, '.' + options.initialTab, options);
        } else if(options.processHashes) {
            var hash = (window.location.hash.length > 0 && window.location.hash[0] == '#') ? window.location.hash.substr(1) : window.location.hash;
            var selectedTab = _getTabInfo(options, function(tab) {
                return tab.hash == hash;
            });
            if(selectedTab) {
                openTab(container, '.' + selectedTab.className, options);
            } else {
                openTab(container, '.' + options.tabs[0].className, options);
            }
        }

        return _interface;
    }

    function _openTabForTabStyle(container, target, options) {
        container.find('.tab-pane').removeClass('active');

        var target_container = container.find(target).addClass('active');
        container.find('a[data-toggle-target="' + target + '"]').tab('show');

        var targetSansPeriod = target.substr(1);
        var selectedTab = _getTabInfo(options, function(tab) {
            return tab.className == targetSansPeriod;
        });

        if(selectedTab) {
            if(options.processHashes && typeof(selectedTab.hash) != 'undefined') {
                history.pushState(null, null,'#' + selectedTab.hash);
            }
            if(typeof(selectedTab.onOpened) != 'undefined') {
                selectedTab.onOpened();
            }
        }
        options.onTabOpened(targetSansPeriod, target_container);
    }

    function _openTabForDropdownStyle(container, target, options) {
        var selectedTab = _getTabInfo(options, function(tab) {
            return tab.className == target;
        });
        container.find('.selected-label').html(selectedTab.label);

        container.find('.tab-pane').removeClass('active');
        container.find('.tab-pane.' + target).addClass('active');
    }

    function _getTabInfo(options, filterFunction) {
        if(typeof(options.tabs) == 'undefined' || !Array.isArray(options.tabs)) {
            return null;
        }

        var matching_tabs = options.tabs.filter(filterFunction);
        if(matching_tabs.length == 0) {
            return null;
        }

        if(matching_tabs.length > 1) {
            console.log('WARNING: on a TabbedContainerWidget, more than one tab was selected in _getTabInfo');
        }

        return matching_tabs[0];
    }

    var tabs_template_def =
        '<div class="tabbed-collection tab-style">' +
            '<div class="controls"></div>' +
            '<ul class="nav nav-tabs">' +
                '{{~it.tabs :tab:tab_index}}' +
                    '{{? (it.initialTab && it.initialTab == tab.className)}}' +
                        '<li class="active"><a data-toggle-target=".{{=tab.className}}" data-toggle="tab">{{=tab.label}}</a></li>' +
                    '{{??}}' +
                        '<li><a data-toggle-target=".{{=tab.className}}" data-toggle="tab">{{=tab.label}}</a></li>' +
                    '{{?}}' +
                '{{~}}' +
            '</ul>' +
            '<div class="tab-content">' +
                '{{~it.tabs :tab:tab_index}}' +
                    '{{? (it.initialTab && it.initialTab == tab.className)}}' +
                        '<div class="tab-pane active {{=tab.className}}"></div>' +
                    '{{??}}' +
                        '<div class="tab-pane {{=tab.className}}"></div>' +
                    '{{?}}' +
                '{{~}}' +
            '</div>' +
        '</div>';

    var dropdown_template_def =
        '<div class="tabbed-collection dropdown-style">' +
            '<div class="dropdown pull-left">' +

                '<a class="dropdown-toggle" data-toggle="dropdown" id="dropdown-type-1">' +
                    '{{~it.tabs :tab:tab_index}}' +
                        '{{? (it.initialTab && it.initialTab == tab.className)}}' +
                            '<span class="selected-label">{{=tab.label}}</span>' +
                        '{{?}}' +
                    '{{~}}' +
                    '<i class="si-downarrow"></i>' +
                '</a>' +
                '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdown-type-1">' +
                    '{{~it.tabs :tab:tab_index}}' +
                        '<li role="presentation"><a class="type-selector" data-tab="{{=tab.className}}">{{=tab.label}}</a></li>' +
                    '{{~}}' +
                '</ul>' +
                '<span class="secondary-label">{{=it.secondary_label}}</span>' +
            '</div>' +
            '<div class="clearfix"></div>' +
            '<div class="tab-content">' +
                '{{~it.tabs :tab:tab_index}}' +
                    '{{? (it.initialTab && it.initialTab == tab.className)}}' +
                        '<div class="tab-pane active {{=tab.className}}" data-tab="{{=tab.className}}"></div>' +
                    '{{??}}' +
                        '<div class="tab-pane {{=tab.className}}" data-tab="{{=tab.className}}"></div>' +
                    '{{?}}' +
                '{{~}}' +
            '</div>' +
        '</div>';

    var tabs_template = doT.template(tabs_template_def);
    var dropdown_template = doT.template(dropdown_template_def);

    return {
        init : init,
        openTab: openTab
    };

}());