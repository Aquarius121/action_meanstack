var security = require('./security');

var admin = require('./routes/admin');
var astute_knowledge = require('./routes/astute-knowledge');
var brands = require('./routes/brands');
var brand_owners = require('./routes/brand-owners');
var config_routes = require('./routes/config');
var coupons = require('./routes/coupons');
var facebook = require('./routes/facebook');
var favorites = require('./routes/favorites');
var feedback = require('./routes/feedback');
var google = require('./routes/google');
var index = require('./routes/index');
var message = require('./routes/message');
var nlp = require('./routes/nlp');
var opt_ins = require('./routes/opt-ins');
var postal_codes = require('./routes/reference/postal-codes');
var products = require('./routes/products');
var reports = require('./routes/reports');
var survey = require('./routes/survey');
var system = require('./routes/system');
var users = require('./routes/users');
var wilke = require('./routes/wilke');

// Request validation:
// - request may need authentication
// - request may be accessible only by admins
// - request body must be valid
// - ObjectIDs must be validated (in params, queries, and body)

module.exports = function(app) {

    app.get('/', index.index_get);
    app.get('/sitemap.xml', index.sitemap);
    app.get('/robots.txt', index.robots);
    app.get('/intro', index.intro_get);
    app.get('/coming-attraction/view', index.coming_attractions_get);

    app.get('/login', users.login_view);
    app.post('/login', users.login_post);
    app.get('/logout', users.logout_get);

    // user management
    app.put('/user', users.user_create);
    app.post('/user/lost-password', users.lost_password);
    app.get('/user/reset-password', users.reset_password_link_target);
    app.post('/user/reset-password', users.reset_password);
    app.get('/user', security.ensureAuthenticated, security.ensureAdmin, users.user_query); //admin query interface
    app.get('/user/create/view', security.ensureAuthenticatedForView, security.ensureAdmin, users.user_create_view);
    app.get('/users/view', security.ensureAuthenticatedForView, users.users_view);
    app.get('/user/view/:id', security.ensureAuthenticatedForView, users.user_view);
    app.get('/user/:id/history/view', security.ensureAuthenticatedForView, users.user_messages_view);
    app.post('/user/:id', security.ensureAuthenticated, users.user_update);
    app.post('/user/:id/content', security.ensureAuthenticated, users.user_upload_content);
    app.put('/user/:id/brand', security.ensureAuthenticated, security.ensureAdmin, users.user_add_brand);
    app.delete('/user/:id', security.ensureAuthenticated, users.user_delete);
    app.get('/user/:id/content', security.ensureAuthenticated, users.user_get_content);
    app.get('/user/:id', security.ensureAuthenticated, users.user_get);
    app.get('/register', users.register_view);

    // product routes
    app.put('/product', security.ensureAuthenticated, security.ensureNonUser, products.product_create);
    app.get('/products/find', products.products_open_search); // public search
    app.get('/products/find/view', security.ensureAuthenticatedForView, products.products_find_view);
    app.get('/products/view', security.ensureAuthenticatedForView, security.ensureNonUserForView, products.products_view);
    app.get('/products', security.ensureAuthenticated, products.product_query); //admin query interface
    app.get('/products/brand-products', security.ensureAuthenticated, products.products_for_brand); //admin query interface
    app.get('/product/where-to-buy/view/:code', security.ensureAuthenticatedForView, products.product_where_to_buy_view);
    app.get('/product/brand-message/view/:code', security.ensureAuthenticatedForView, products.product_brand_message_view);
    app.get('/product/faq/view/:code', security.ensureAuthenticatedForView, products.product_faq_view);
    app.get('/product/info/view/:code', security.ensureAuthenticatedForView, products.product_info_view);
    app.get('/product/create/view', security.ensureAuthenticatedForView, security.ensureNonUser, products.product_create_view);
    app.get('/product/:ean/where-to-buy', security.ensureAuthenticated, products.product_where_to_buy);
    app.get('/product/:code', products.product_get);
    app.get('/product/view/:code', security.ensureAuthenticatedForView, products.product_view);
    app.delete('/product/:id', security.ensureAuthenticated, security.ensureAdmin, products.product_delete);
    app.post('/products/:idList/brand', security.ensureAuthenticated, security.ensureAdmin, products.products_transfer_brand);
    app.post('/product/:id', security.ensureAuthenticated, products.product_update);
    app.get('/products/hans', products.hans); // public search

    // brand routes
    app.post('/brand/:id/content', security.ensureAuthenticated, security.ensureNonUser, brands.brand_upload_content);
    app.post('/brand/:id/import', security.ensureAuthenticated, security.ensureAdmin, brands.brand_product_import_data);
    app.delete('/brand/:id', security.ensureAuthenticated, security.ensureAdmin, brands.brand_delete);
    app.delete('/brand/:id/content', security.ensureAuthenticated, security.ensureNonUser, brands.brand_delete_content);
    app.get('/brands/view', security.ensureAuthenticatedForView, brands.brands_view);
    app.get('/brand', security.ensureAuthenticated, brands.brand_query);
    app.get('/brand/create/view', security.ensureAuthenticated, security.ensureAdmin, brands.brand_create_view);
    app.get('/brand/:id/products', security.ensureAuthenticatedForView, security.ensureNonUser, brands.brand_export_products);
    app.get('/brand/view/:id', security.ensureAuthenticatedForView, security.ensureNonUser, brands.brand_view);
    app.get('/brand/:id/view', security.ensureAuthenticatedForView, security.ensureNonUser, brands.brand_products_view);
    app.get('/brand/:idList', security.ensureAuthenticated, brands.brands_get);
    app.get('/brand/:id/import', security.ensureAuthenticated, security.ensureAdmin, brands.brand_product_import);
    app.put('/brand', security.ensureAuthenticated, security.ensureAdmin, brands.brand_create);
    app.post('/brand/:id', security.ensureAuthenticated, security.ensureNonUser, brands.brand_update);
    app.post('/brand/:id/styling', security.ensureAuthenticated, security.ensureNonUser, brands.brand_style_update);
    app.post('/brand/:id/features', security.ensureAuthenticated, security.ensureNonUser, brands.brand_feature_product);

    // brand owner routes
    app.get('/brand-owners/view', security.ensureAuthenticatedForView, security.ensureAdmin, brand_owners.brand_owners_view);
    app.get('/brand-owner', security.ensureAuthenticated, security.ensureAdmin, brand_owners.brand_owners_query);
    app.get('/brand-owner/create/view', security.ensureAuthenticatedForView, security.ensureAdmin, brand_owners.brand_owner_create_view);
    app.get('/brand-owner/view/:id', security.ensureAuthenticatedForView, security.ensureNonUser, brand_owners.brand_owner_view);
    app.put('/brand-owner', security.ensureAuthenticated, security.ensureAdmin, brand_owners.brand_owner_create);
    app.post('/brand-owner/:id', security.ensureAuthenticated, security.ensureAdmin, brand_owners.brand_owner_update);
    app.delete('/brand-owner/:id', security.ensureAuthenticated, security.ensureAdmin, brand_owners.brand_owner_delete);

    // message
    app.get('/messages', security.ensureAuthenticated, message.messages_get);
    app.get('/messages/errors', security.ensureAuthenticated, security.ensureAdmin, message.message_errors_get);
    app.get('/messages/view', security.ensureAuthenticated, security.ensureAdmin, message.messages_view);
    app.get('/messages/errors/view', security.ensureAuthenticatedForView, security.ensureAdmin, message.messages_errors_view);
    app.get('/messages/unread', security.ensureAuthenticated, message.message_get_unread);
    app.get('/message/send/view', security.ensureAuthenticatedForView, message.message_send_view);
    app.get('/message/thanks', security.ensureAuthenticatedForView, message.message_thanks_view);
    app.put('/message', security.ensureAuthenticated, message.message_put);
    app.post('/message', security.ensureAuthenticated, message.message_put);
    app.delete('/messages/error/:id', security.ensureAuthenticated, security.ensureAdmin, message.message_error_delete);
    app.post('/message/:id', security.ensureAuthenticated, message.message_update);
    app.post('/messages/responses', security.ensureAuthenticated, message.response_update);

    // favorite
    app.get('/favorites/view', security.ensureAuthenticatedForView, favorites.favorites_view);
    app.get('/favorites', security.ensureAuthenticated, favorites.favorites_get);
    app.put('/favorite', security.ensureAuthenticated, favorites.favorite_add);
    app.delete('/favorite', security.ensureAuthenticated, favorites.favorite_remove);

    // opt-ins
    app.get('/opt-ins/view', security.ensureAuthenticatedForView, opt_ins.opt_ins_view);
    app.get('/opt-ins', security.ensureAuthenticated, opt_ins.opt_ins_get);
    app.put('/opt-in', security.ensureAuthenticated, opt_ins.opt_in_add);
    app.delete('/opt-in', security.ensureAuthenticated, opt_ins.opt_in_remove);

    // facebook
    app.get('/facebook/login', facebook.facebook_login);
    app.get('/facebook/logout', facebook.facebook_logout);
    app.get('/facebook/oauth', facebook.facebook_oauth);
    app.post('/facebook/me', facebook.facebook_me_info);

    // feedback
    app.get('/feedback', security.ensureAuthenticated, feedback.get_feedback);
    app.put('/feedback', security.ensureAuthenticated, feedback.add_feedback);

    // survey
    app.put('/survey', security.ensureAuthenticated, security.ensureAdmin, survey.add_survey);
    app.post('/survey/:id', security.ensureAuthenticated, security.ensureAdmin, survey.update_survey);
    app.get('/survey', security.ensureAuthenticated, survey.get_survey);
    app.put('/survey/:id/response', security.ensureAuthenticated, survey.add_survey_response);

    // google
    app.get('/google/plus/login', google.google_login);
    app.get('/google/plus/logout', google.google_logout);
    app.get('/google/plus/oauth', google.google_oauth);
    app.post('/google/plus/me', google.google_me_info);

    // faq
    app.get('/faq/enlight/:tenant/category/:category', security.ensureAuthenticated, wilke.get_category);
    app.get('/faq/enlight/:tenant/categories', security.ensureAuthenticated, wilke.list_categories);
    app.get('/faq/enlight/:tenant/document/:document', security.ensureAuthenticated, wilke.get_document);
    app.get('/faq/astute-knowledge/5/session', security.ensureAuthenticated, astute_knowledge.get_session);
    app.get('/faq/astute-knowledge/5/dialog', security.ensureAuthenticated, astute_knowledge.get_dialog_response);
    app.get('/faq/astute-knowledge/5/dialog-history', security.ensureAuthenticated, astute_knowledge.get_dialog_history);
    app.get('/faq/astute-knowledge/session', security.ensureAuthenticated, astute_knowledge.get_session);
    app.get('/faq/astute-knowledge/dialog', security.ensureAuthenticated, astute_knowledge.get_dialog_response);
    app.get('/faq/astute-knowledge/dialog-history', security.ensureAuthenticated, astute_knowledge.get_dialog_history);

    // etc
    app.get('/video-chat', index.video_chat);

    // config
    app.get('/config/view', config_routes.view_config);
    app.get('/config/:type', config_routes.get_config);
    app.put('/config/:type', config_routes.put_config);

    // references
    app.get('/reference/postal-code', security.ensureAuthenticated, postal_codes.get_postal_codes);
    app.get('/reference/postal-code-coord', security.ensureAuthenticated, postal_codes.get_latlon_by_postal_code);
    app.post('/reference/postal-code', security.ensureAuthenticated, security.ensureTrueAdmin, postal_codes.upload_postal_codes);

    // system
    app.get('/system/resources', security.ensureAuthenticated, security.ensureTrueAdmin, system.resources_get);
    app.get('/system/resources/view', security.ensureAuthenticatedForView, security.ensureTrueAdmin, system.resources_view);
    app.get('/system/logs', security.ensureAuthenticated, security.ensureTrueAdmin, system.logs_get);
    app.get('/system/logs/view', security.ensureAuthenticatedForView, security.ensureTrueAdmin, system.logs_view);
    app.delete('/system/response-times', security.ensureAuthenticated, security.ensureTrueAdmin, system.response_times_delete);
    app.get('/system/response-times', security.ensureAuthenticated, security.ensureTrueAdmin, system.response_times_get);
    app.get('/system/response-times/view', security.ensureAuthenticatedForView, security.ensureTrueAdmin, system.response_times_view);

    // admin
    app.delete('/admin/database', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_clear_data);
    app.post('/admin/database/:db', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_database);
    app.post('/admin/database/:db/collection/:collection', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_collection);
    app.post('/admin/database', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_database);
    app.post('/admin/products', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_products);
    app.post('/admin/reports', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_reports);
    app.post('/admin/brands', security.ensureAuthenticated, security.ensureTrueAdmin, admin.admin_brands);
    app.post('/admin/user', security.ensureAuthenticated, security.ensureAdmin, admin.admin_user);

    // reporting
    app.get('/report/:report', security.ensureAuthenticated, security.ensureNonUser, reports.reports_get);
    app.get('/report/action-activity/view', security.ensureAuthenticatedForView, reports.action_activity_report_view);
    app.get('/report/action-statistics/view', security.ensureAuthenticatedForView, security.ensureAdmin, reports.action_statistics_report_view);
    app.get('/report/user-profile/view', security.ensureAuthenticatedForView, security.ensureNonUser, reports.user_profile_report_view);
    app.get('/report/:report/:brand', security.ensureAuthenticated, security.ensureNonUser, reports.reports_brand_get);
    app.delete('/reports', security.ensureAuthenticatedForView, security.ensureTrueAdmin, reports.reports_delete);

    // nlp
    app.post('/nlp', security.ensureAuthenticated, nlp.query);
    app.post('/nlp/train', security.ensureAuthenticated, security.ensureAdmin, nlp.train);
};
