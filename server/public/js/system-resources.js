var system_resources_page = (function() {

    var info_template_ref =
        '<label style="width: 100px;">Version</label><span>{{=it.version}}</span><div class="clearfix"></div>' +
        '<label style="width: 100px;">Process</label><span>{{=it.process}}</span><div class="clearfix"></div>' +
        '<label style="width: 100px;">PID</label><span>{{=it.pid}}</span><div class="clearfix"></div>';

    var info_template = doT.template(info_template_ref);

    var compact_message_prompt = 'Are you sure you want to compact this collection?  This will lock the collection and make dependent features unusable while processing.';

    function init() {
        _populate(false);

        setInterval(function() {
            _populate(true);
        }, 21000);
    }

    function _populate(is_cpu_only) {
        $.ajax({
            type: 'GET',
            url: '/system/resources'
        }).error(function(jqXHR) {
            alert_modal.showFromXHR('Error', jqXHR);
        }).success(function(result) {
            cpu_chart.draw($('.cpu-chart-container'), result.cpu);

            if(!is_cpu_only) {
                disk_usage_chart.draw($('.disk-usage-container'), result.disk);
                databases_widget.init($('.database-container'), result.database, function(database, collection) {
                    confirm_modal.show('Confirm Compact', compact_message_prompt, function() {
                        loading_modal.hide();
                        loading_modal.show('Compacting');
                        $.ajax({
                            type: 'POST',
                            url: '/admin/database/' + database + '/collection/' + collection + '?action=compact'
                        }).done(function (result) {
                            loading_modal.hide();
                            alert_modal.show('In Progress', 'Collection compacting began!  This may take a while, depending on collection size.');
                        }).error(function (jqXHR) {
                            loading_modal.hide();
                        });
                    });
                }, function(database) {
                    confirm_modal.show('Confirm Repair', compact_message_prompt, function() {
                        loading_modal.hide();
                        loading_modal.show('Repairing');
                        $.ajax({
                            type: 'POST',
                            url: '/admin/database/' + database + '?action=repair'
                        }).done(function (result) {
                            loading_modal.hide();
                            alert_modal.show('In Progress', 'Database repair began!  This may take a while, depending on database size.');
                        }).error(function (jqXHR) {
                            loading_modal.hide();
                        });
                    });
                });
                system_info_widget.init($('.system-info-container'), result.info);
                $('.database-info-container').html(info_template(result.status));

                var solr_label = $('.solr-status');
                solr_label.html(result.solr_connected ? 'Connected' : 'Not connected');
                if(result.solr_connected) {
                    solr_label.addClass('label-success');
                    solr_label.removeClass('label-danger');
                } else {
                    solr_label.removeClass('label-success');
                    solr_label.addClass('label-danger');
                }
            }
        });
    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
    system_resources_page.init();
});