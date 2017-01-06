// requires:
// - spin.js
// - jquery
var loading_indicator_widget = (function() {

    var loading_template_def =
        '<div class="loading-container" style="position: relative;">' +
            '<div class="loading-message" style="height:74px; width: 80px; margin: auto;">' +
                '<div class="loading-child" style="position: relative; top: 40px;"></div>' +
            '</div>' +
            '<div style="text-align: center;" class="loading-text"></div>' +
        '</div>';

    var default_options = {
        container: null,        // required
        text: 'Loading',

        render_lines: 9,        // The number of lines to draw
        render_length: 0,       // The length of each line
        render_line_width: 7,   // The line thickness
        render_radius: 20,      // The radius of the inner circle
        render_corners: 1,      // Corner roundness (0..1)
        render_rotate: 0,       // The rotation offset
        render_direction: 1,    // 1: clockwise, -1: counterclockwise
        render_color: '#000',   // #rgb or #rrggbb or array of colors
        render_speed: 1,        // Rounds per second
        render_trail: 60,       // Afterglow percentage
        render_shadow: false,   // Whether to render a shadow
        render_hwaccel: false,  // Whether to use hardware acceleration
        render_class: 'spinner',// The CSS class to assign to the spinner
        render_zindex: 0,       // The z-index (defaults to 0 - api calls for much higher: 2e9+)
        render_top: 'auto',     // Top position relative to parent in px
        render_left: 'auto'     // Left position relative to parent in px
    };

    function init(options_in) {
        "use strict";
        var options = $.extend(true, {}, default_options, options_in);

        options.container.html(loading_template_def);
        options.container.find('.loading-text').html(options.text);

        var spinner_container = options.container.find('.loading-child');

        options.container.find('.loading-container').css('top', Math.floor(options.container.height() / 2 - 37));

        var opts = {
            lines: options.render_lines,
            length: options.render_length,
            width: options.render_line_width,
            radius: options.render_radius,
            corners: options.render_corners,
            rotate: options.render_rotate,
            direction: options.render_direction,
            color: options.render_color,
            speed: options.render_speed,
            trail: options.render_trail,
            shadow: options.render_shadow,
            hwaccel: options.render_hwaccel,
            className: options.render_class,
            zIndex: options.render_zindex,
            top: options.render_top,
            left: options.render_left
        };
        var spinner = new Spinner(opts);

        var target = spinner_container.get(0);
        spinner.spin(target);
    }

    function destroy(container)  {
        container.find('.loading-container').remove();
    }

    function setText(container, text) {
        container.find('.loading-text').html(text);
    }

    return {
        init: init,
        destroy: destroy,
        setText: setText
    }
}());
