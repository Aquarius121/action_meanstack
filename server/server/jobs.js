var config = require('config');
var fs = require('fs');
var moment = require('moment');
var path = require('path');
var schedule = require('node-schedule');
var winston = require('winston');

var DatabaseMonitor = require('node-server-monitor').mongo_database_monitor;
var ReportsManager = require('reports-using-mongo').ReportsManager;
var node_server_monitor = require('node-server-monitor');
var backup_manager = require('node-mongo-backup-manager');

var user_utils = require('./util/user-utils');

var disk_job;
var cpu_sample_jobs = [];
var database_size_job;
var reporting_jobs = [];
var age_calculation_job;
var database_backup_job;
var database_backup_removal_job;

module.exports = {
    startDiskJob: _startDiskJob,
    startCPUJob: _startCPUJob,
    startDatabaseSizeJob: _startDatabaseSizeJob,
    startReportingJob: _startReportingJob,
    startAgeCalculationJob: _startAgeCalculationJob,
    startDatabaseBackupJob: _startDatabaseBackupJob,
    startDatabaseBackupRemovalJob: _startDatabaseBackupRemovalJob
};

// ON STARTUP

// SET UP DATABASE MONITOR

DatabaseMonitor.addDatabase(require('./database/instances/action').db);
DatabaseMonitor.addDatabase(require('./database/instances/action-message').db);
DatabaseMonitor.addDatabase(require('./database/instances/product-info').db);
DatabaseMonitor.addDatabase(require('./database/instances/action-audit').db);
DatabaseMonitor.addDatabase(require('./database/instances/action-feedback').db);
DatabaseMonitor.addDatabase(require('./database/instances/action-log').db);
DatabaseMonitor.addDatabase(require('./database/instances/action-reference').db);
DatabaseMonitor.addDatabase(require('./database/instances/action-report').db);

// SET UP REPORTS MANAGER

var daily_action_statistics_report = require('./reports/daily-action-statistics-report');
var daily_favorites_report = require('./reports/daily-favorites-report');
var daily_logins_report = require('./reports/daily-logins-report');
var daily_messages_report = require('./reports/daily-messages-report');
var daily_opt_in_report = require('./reports/daily-opt-in-report');
var daily_page_ratings_report = require('./reports/daily-page-ratings-report');
var daily_registrations_report = require('./reports/daily-registration-report');
var daily_survey_report = require('./reports/daily-survey-report');
var daily_user_report = require('./reports/daily-user-profile-report');
var monthly_unique_users_report = require('./reports/monthly-unique-users-report');
var weekly_unique_users_report = require('./reports/weekly-unique-users-report');

ReportsManager.addReportHandler('daily_action_statistics_report', new daily_action_statistics_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_favorites_report', new daily_favorites_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_logins_report', new daily_logins_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_messages_report', new daily_messages_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_opt_in_report', new daily_opt_in_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_page_ratings_report', new daily_page_ratings_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_registrations_report', new daily_registrations_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_survey_report', new daily_survey_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('daily_user_report', new daily_user_report(config['report_builder'].max_days_back));
ReportsManager.addReportHandler('monthly_unique_users_report', new monthly_unique_users_report(config['report_builder'].max_months_back));
ReportsManager.addReportHandler('weekly_unique_users_report', new weekly_unique_users_report(config['report_builder'].max_weeks_back));

DatabaseMonitor.takeStats();

_startDiskJob();

_startCPUJob();

_startDatabaseSizeJob();

_startDatabaseBackupJob();

_startDatabaseBackupRemovalJob();

if(config['report_builder'].enabled) {
    _startReportingJob();
}

_startAgeCalculationJob();

// HANDLERS

function _startDiskJob() {

    winston.info('scheduled disk space snapshot job');

    // === disk usage snapshots
    var disk_rule = new schedule.RecurrenceRule();
    disk_rule.minute = 4; // once per hour
    disk_job = schedule.scheduleJob(disk_rule, _takeDiskSnapshot);

    var disk_stats = [], max_disk_stats = 500;

    function _takeDiskSnapshot() {
        node_server_monitor.disk_monitor.getDiskSpace(config.disks, function(err, result){

            // Process Disk
            {
                disk_stats.push(result);
                if(disk_stats.length > max_disk_stats) {
                    disk_stats.slice(1);
                }
                winston.debug('disk space: ' + JSON.stringify(result));
            }
        });
    }

    return disk_job;
}

function _startCPUJob() {
    winston.info('scheduled CPU snapshot jobs');

    // === cpu usage snapshots
    var cpu_rule = new schedule.RecurrenceRule();
    cpu_rule.second = 0; // once per minute
    cpu_sample_jobs.push(schedule.scheduleJob(cpu_rule, _takeCPUSnapshot));

    var cpu_rule2 = new schedule.RecurrenceRule();
    cpu_rule2.second = 20; // once per minute
    cpu_sample_jobs.push(schedule.scheduleJob(cpu_rule2, _takeCPUSnapshot));

    var cpu_rule3 = new schedule.RecurrenceRule();
    cpu_rule3.second = 40; // once per minute
    cpu_sample_jobs.push(schedule.scheduleJob(cpu_rule3, _takeCPUSnapshot));

    return cpu_sample_jobs;
}

function _takeCPUSnapshot() {
    node_server_monitor.cpu_monitor.sampleCPU(function(cpu) {});
}

function _startDatabaseSizeJob() {
    winston.info('scheduled database statistics snapshot job');

    // === cpu usage snapshots
    var db_rule = new schedule.RecurrenceRule();
    db_rule.minute = 57; // once per hour
    database_size_job = schedule.scheduleJob(db_rule, DatabaseMonitor.takeStats);
}

function _startReportingJob() {
    winston.info('scheduled reporting job');

    // === disk usage snapshots
    var report_rule_1 = new schedule.RecurrenceRule();
    report_rule_1.minute = 30; // once per hour at the 30th minute
    reporting_jobs.push(schedule.scheduleJob(report_rule_1, _processReports));

    var report_rule_2 = new schedule.RecurrenceRule();
    report_rule_2.minute = 0; // once per hour at the 0th minute
    reporting_jobs.push(schedule.scheduleJob(report_rule_2, _processReports));

    function _processReports() {
        ReportsManager.process();
    }

    return reporting_jobs;
}

function _startAgeCalculationJob() {
    winston.info('scheduled age calculation job');

    var db_rule = new schedule.RecurrenceRule();
    db_rule.hour = 1; // once per day, early
    db_rule.minute = 5;
    age_calculation_job = schedule.scheduleJob(db_rule, user_utils.recalculateAges);
}

function _startDatabaseBackupJob() {
    if(!config["database_backups"]["active"]) {
        return;
    }

    winston.info('scheduled database backup job');

    var db_rule = new schedule.RecurrenceRule();
    db_rule.hour = 1; // once per day, early
    db_rule.minute = 23;
    database_backup_job = schedule.scheduleJob(db_rule, function() {

        if(!config["database_backups"]['backup_directory']) {
            winston.error('during database backup job, could not continue because backup directory was not set');
            return;
        }

        winston.info('began database backup job');

        backup_manager.backup({
            username: config['storage'].user,      // TODO: only backs up database instance dynamic lives inside of
            password: config['storage'].password,
            outputDirectory: config["database_backups"]['backup_directory'],
            createEnclosingDirectory: true,
            compresses: true
        }, function(err_backup) {
            if(err_backup) {
                winston.error('while backing up database: ' + err_backup);
            }

            winston.info('finished database backup job');
        });
    });
}

function _startDatabaseBackupRemovalJob() {
    winston.info('scheduled database backup removal job');

    var db_rule = new schedule.RecurrenceRule();
    db_rule.hour = 2; // once per day, early
    db_rule.minute = 25;
    database_backup_removal_job = schedule.scheduleJob(db_rule, function() {

        if(!config["database_backups"]['backup_directory']) {
            winston.error('during database backup removal job, could not continue because backup directory was not set');
            return;
        }

        if(!config["database_backups"]['backup_limit']) {
            winston.error('during database backup removal job, could not continue because backup limit was not set');
            return;
        }

        fs.readdir(config["database_backups"]['backup_directory'], function(err_read, dir_contents) {
            if(err_read) {
                winston.error('while deleting old database backups: ' + err_read);
                return;
            }

            // if the file is of the format YYYY-MM-DDHHMMss.tar.gz
            var files = [], re = /\d\d\d\d-\d\d-\d\d\d\d\d\d\d\d\.tar\.gz/;
            dir_contents.forEach(function(directory_item) {
                if(directory_item.match(re)) {
                    var my_moment = moment(directory_item.split('.')[0], 'YYYY-MM-DDHHmmss');
                    files.push({
                        filename: directory_item,
                        timestamp: my_moment.valueOf()
                    });
                }
            });

            var number_of_files_to_delete = files.length - config["database_backups"]['backup_limit'];

            if(number_of_files_to_delete <= 0) {
                winston.info('completed database backup removal job, having deleted nothing');
                return;
            }

            winston.info('preparing to delete ' + number_of_files_to_delete + ' database backups');

            files.sort(function(a, b) {
                return (a.timestamp - b.timestamp);
            });

            for(var i = 0; i<number_of_files_to_delete; i++) {
                fs.unlinkSync(path.join(config["database_backups"]['backup_directory'], files[i].filename));
                winston.info('deleted ' + files[i].filename);
            }

            winston.info('completed database backup removal job, having deleted ' + number_of_files_to_delete + ' files');
        });
    });
}