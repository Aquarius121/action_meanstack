var footer_widget = (function() {

    function init(selector) {
        var footer_template_def =
            '<div class="navbar-inner">' +
                '<div class="col-xs-2" style="padding-left: 0;">' +
                    '<a class="btn back-btn" style="padding: 0;">' +
                        '<i class="glyphicon glyphicon-arrow-left" style="zoom: 2;"></i>' +
                    '</a>' +
                '</div>' +
                '<div class="col-xs-8 version text-center"></div>' +
                '<ul class="right-nav nav pull-right hidden">' +
                    '<li style="cursor: pointer;" class="navbar-widget">' +
                        '<a data-toggle="dropdown" class="dropdown-toggle">' +
                            '<span class="caret caret-up"></span>' +
                            '<img src="img/logo2.png" style="height: 34px; background-color: #eee; padding: 2px; border-radius: 5px;">' +
                            '</a>' +
                            '<ul class="pull-left dropdown-menu dropdown-caret dropdown-bottom-right">' +
                                '<li><a href="#" class="find-redirect"><i class="glyphicon " style="margin-right: 10px;"></i>LIVE Click to talk</a></li>' +
                                '<li><a href="#" class="find-redirect"><i class="glyphicon " style="margin-right: 10px;"></i>LIVE Chat</a></li>' +
                                '<li><a href="#" class="find-redirect"><i class="glyphicon " style="margin-right: 10px;"></i>LIVE Video</a></li>' +
                            '</ul>' +
                        '</li>' +
                    '</ul>' +
                '</div>';

        var version = '';

        selector.append(doT.template(footer_template_def)({}));
    }

    return {
        init: init
    }
}());