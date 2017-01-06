// requires:
// - doT
// - tablesorter
// - misc. styles
var table_pager = (function () {

    var template_def =
        '<div class="pager text-center" style="width: 100%">' +
            '<button class="btn btn-xs btn-default first" style="border-radius: 5px; margin-right: 5px;">' +
                '<i class="icon-fast-backward" style="padding-left: 0;"></i>' +
            '</button>' +
            '<button class="btn btn-xs btn-default prev" style="border-radius: 5px; margin-right: 5px;">' +
                '<i class="icon-backward" style="padding-left: 0;"></i>' +
            '</button>' +
            '<input type="text" disabled="disabled" style="text-align: center;" class="pagedisplay">' +
            '<button class="btn btn-xs btn-default next" style="border-radius: 5px; margin-left: 5px; margin-right: 5px;">' +
                '<i class="icon-forward" style="padding-left: 0;"></i>' +
            '</button>' +
            '<button class="btn btn-xs btn-default last" style="border-radius: 5px; margin-right: 5px;">' +
                '<i class="icon-fast-forward" style="padding-left: 0;"></i>' +
            '</button>' +
            '<select class="pagesize" style="width: auto; margin-right: 5px;">' +
                '<option selected="selected" value="15"> 15</option>' +
                '<option value="30"> 30</option>' +
                '<option value="100"> 100</option>' +
                '<option value="250"> 250</option>' +
            '</select>' +
            ' per page' +
        '</div>';

    var template = doT.template(template_def);

    function init(container) {
        container.html(template({}));
    }

    return {
        init : init
    };
}());