var action_database = require('../database/instances/action');

var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

module.exports = {
    view_config: _viewConfig,
    get_config: _getConfig,
    put_config: _putConfig
};

var acceptable_config_types = [
    'terms-and-conditions'
];

function _getConfig(req, res) {
    var type = req.param('type');

    if(acceptable_config_types.indexOf(type) == -1) {
        res.send('unrecognized type', 500);
        return;
    }

    action_database.getConfig(type, function(err_config, config_item) {
        if(err_config) {
            res.send('could not get config item: ' + err_config);
            return;
        }

        if(!config_item) {
            general_util.send404(res, 'not found');
            return;
        }

        res.send(config_item, 200);
    });
}

function _putConfig(req, res) {
    var type = req.param('type');

    if(acceptable_config_types.indexOf(type) == -1) {
        res.send('unrecognized type', 500);
        return;
    }

    action_database.saveConfig(type, req.body.value, function(err_insert) {
        if(err_insert) {
            res.send(err_insert, 500);
            return;
        }

        res.send('{result: "ok"}', 200);
    });
}

function _viewConfig(req, res) {
    var caller = user_util.getCaller(req);
    res.render('config', {
        caller: caller,
        title: 'Site Config',
        url: req.url
    });
}