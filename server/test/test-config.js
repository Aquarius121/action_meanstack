var fs = require('fs');

var content = fs.readFileSync('../config/default.json', 'utf8');

module.exports = JSON.parse(content);