var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');
var _path = require('path');

var database = require('../database/instances/product-info');

var xlsx = require('../ext/xlsx');
var babyparse = require('babyparse');

var fs = require('fs');

module.exports = {

    getBrandData: _getBrand,
    getBrandsByIds: _getBrandsByIds,

    exportProductsForBrandAsXlsx: _exportProductsForBrandAsXlsx,
    importProductsForBrandWithXlsx: _importProductsForBrand,
    exportProductsForBrandAsCsv: _exportProductsForBrandAsCsv,
    importProductsForBrandWithCsv: _importProductsForBrandWithCsv

};

// gets the product, associated brand, and brand's favorite status for the given caller
function _getBrand(caller, id, callback2) {
    var query = {
        _id: ObjectID(id)
    };

    // TODO: pick fields
    var fields = {
        _id: 1
    };

    database.pod_brands.findOne(query, function(err_brand, brand) {
        if(err_brand) {
            winston.error('an error occurred while getting a brand from the database: ' + err_brand);
        }
        callback2(err_brand, brand);
    });
}



function _getBrandsByIds(idList, fieldList, callback) {
    if(idList.length == 0) {
        callback(null, []);
        return;
    }

    idList = _.map(idList, function(id) { return ObjectID(id);});
    database.pod_brands.find({_id: {$in: idList}}, fieldList).toArray(callback);
}

function _getValueFromRowItem(item) {


    if(!item) {
        return null;
    }

    if(item.value.toString() == 'NaN')
    {
        return null;
    }

    if(item.formatCode && item.formatCode == '00000000')
    {
        var pad = item.formatCode;
        return  pad.substring(0, pad.length - item.value.toString().length) + item.value.toString();
    }

    if(item.formatCode && item.formatCode == '0000000000000')
    {
        var pad = item.formatCode;
        return  pad.substring(0, pad.length - item.value.toString().length) + item.value.toString();
    }

    return item.value.toString();

}

function _importProductsForBrand(caller, brand_id, file, callback2) {
   var results = [];
   var base64File = '';
   var products = [];
   fs.readFile(file.path, function (err, data) {
       base64File = new Buffer(data, 'binary').toString('base64');
       var productsXlsx = xlsx(base64File);
       var worksheet = productsXlsx.worksheets[0];

       var async_tasks = [], warnings = [];
       
       // these are the indexes that were found to be duplicates
    	products = appendDuplicateStatusXlsx(worksheet.data);

       //_.each(worksheet.data, function (row, index) {
       _.each(products, function (row, index) {

		var leading_pad = function pad(num, size) {
                    var s = num+"";
                    while (s.length < size) s = "0" + s;
                    return s;
                };
             
             var checkEan = function(eanValue) {
                 if(!eanValue || eanValue.length == 0) {
             	     return false;
             	 }
		
		 return true;
             };
                   
	     var eanValid = checkEan(_getValueFromRowItem(row[1]));
             // ignore header line
           
	     if (index > 0 && eanValid) {
           
                if(_path.extname(file.name) != '.xlsx')
                	return;

               // make sure the row has enough records
               if(typeof(row) == 'undefined' || row == null)
                    return;

               if(row.length < 3) {
                   //console.log(index);
                   warnings.push('row ' + index + ' had too few items');
               } else {

                   // build the product from the line
                   var item = {

                       brand_name:_getValueFromRowItem(row[0]),
                       ean: leading_pad(_getValueFromRowItem(row[1]),13),
                       brand: '',
                       name: _getValueFromRowItem(row[2]),
                       feature_weight: _getValueFromRowItem(row[3]),
                       images: [_getValueFromRowItem(row[4])],
                       nutrition_labels: [_getValueFromRowItem(row[5])],
                       phone_number: _getValueFromRowItem(row[6]),
                       sms_number:  _getValueFromRowItem(row[7]),
                       facebook_link:  _getValueFromRowItem(row[8]),
                       twitter_link:  _getValueFromRowItem(row[9]),
                       instagram_link:  _getValueFromRowItem(row[10]),
                       brand_message:  _getValueFromRowItem(row[11]),
                       faq:  _getValueFromRowItem(row[12]),
                       ingredients:  _getValueFromRowItem(row[13]),
                       instructions:  _getValueFromRowItem(row[14]),
                       auto_message:  _getValueFromRowItem(row[15]),
                       promo_videos: [_getValueFromRowItem(row[19])],
                       image_style: _getValueFromRowItem(row[20]),
                       map_search_types: _getValueFromRowItem(row[21]),
                       auto_msg_expiration: _getValueFromRowItem(row[22]),
                       promo_images: [_getValueFromRowItem(row[23])],
                       master_ean: {
                           locator: '',
                           product_info: '' },
                       is_duplicate: _getValueFromRowItem(row[24])
                   };

		   // no longer put products without a brand into the Bullpen
                   //if(item.brand_name == '')
                       //item.brand_name = 'Bullpen';


                   // if the EAN is at least of the valid format
                   if(item.ean && item.ean.length > 0 && item.ean != '00000000' && item.ean != '0000000000000') {

                       // apply master EAN if necessary
                       var masterEan = _getValueFromRowItem(row[16]);
                       if (masterEan && masterEan.trim().length > 0) {
                           item.master_ean = {
                               locator: _getValueFromRowItem(row[17]) == 1 ? _getValueFromRowItem(row[16]) : '',
                               product_info: _getValueFromRowItem(row[18]) == 1 ? _getValueFromRowItem(row[16]) : ''
                           };
                       }

                       async_tasks.push(function(callback_async) {
                           database.ean.findOne({ean: item.ean}, function (err_product, product) {
                               if (product) {
                                   item.matchingExistingProduct = product;
                                   item._id = product._id;
                                   item.brand = product.brand;

                                   //results.push(item);
                                   //setTimeout(callback_async, 0);
                               }
                               //else{

                                   var brand_info = {
                                       name: item.brand_name,
                                       last_update: (new Date()).getTime()
                                   };

                                   database.pod_brands.findOne({name: brand_info.name},function(err_brands, brand) {

                                       if(brand)
                                       {
                                           item.brand = brand._id.toString();
                                           results.push(item);
                                           setTimeout(callback_async, 0);
                                       }
                                       else
                                       {
                                           database.pod_brands.insert(brand_info, function(err_update, insert_result) {
                                               if(err_update == null) {
                                                   item.brand = insert_result[0]._id.toString();
                                               }
                                               results.push(item);
                                               setTimeout(callback_async, 0);
                                           });
                                       }
                                   });

                               //}



                           });



                       });

                   } else {
                       warnings.push('ean on line ' + index + ' had an invalid EAN');
                   }
               }
           }
       });

       async.series(async_tasks, function(err_async) {
           callback2(err_async, {
               products: results,
               warnings: warnings
           });
       });
   });
}

function _exportProductsForBrandAsXlsx(caller, brand_id, callback) {
    database.pod_brands.findOne({id: ObjectID(brand_id)}, function(err_brand, brand) {
        if(err_brand) {
            winston.error('an error occurred while getting a brand from the database: ' + err_brand);
            callback(err_brand);
            return;
        }

        database.ean.find({brand: brand_id}).toArray(function(err_products, products) {
            if(err_products) {
                winston.error('an error occurred while getting products for a brand from the database: ' + err_products);
                callback(err_products);
                return;
            }

            if(products == null || products.length == 0) {
                callback('no products exist for the given brand');
                return;
            }

            var worksheets = {
                worksheets: [
                    _buildProductsSheet(products)
                ],
                creator: caller.user
            };

            var buffer = xlsx(worksheets);
            if(!buffer.base64) {
                callback('could not get base64 buffer during export');
                return;
            }
            buffer =  new Buffer(buffer.base64, 'base64');
            callback(null, buffer);
        });
    });
}

function _buildProductsSheet(products) {

        var samplesSheet = {
            "name":"Products",
            "data":[],
            "data_validation": [
                []
            ]
        };

        // build the header row
        var header_row = [
            {
                value: "Brand",
                bold: true
            },
            {
                value: "EAN",
                bold: true
            },
            {
                value: "Name",
                bold: true
            },
            {
                value: "Active",
                bold: true
            },
            {
                value: "ProductImage",
                bold: true
            },
            {
                value: "ProductLabel",
                bold: true
            },
            {
                value: "Phone",
                bold: true
            },
            {
                value: "SMS",
                bold: true
            },
            {
                value: "Facebook",
                bold: true
            },
            {
                value: "Twitter",
                bold: true
            },
            {
                value: "Instagram",
                bold: true
            },
            {
                value: "BrandMessage",
                bold: true
            },
            {
                value: "FAQ",
                bold: true
            },
            {
                value: "Ingredients",
                bold: true
            },
            {
                value: "Instructions",
                bold: true
            },
            {
                value: "AutoMessage",
                bold: true
            },
            {
                value: "MasterEAN",
                bold: true
            },
            {
                value: "UseMasterEANForWhereToBuy",
                bold: true
            },
            {
                value: "UseMasterEANForProductInfo",
                bold: true
            },
            {
                value: "PromoVideo",
                bold: true
            },
            {
                value: "BackgroundStyle",
                bold: true
            },
            {
                value: "MapSearchTypes",
                bold: true
            },
            {
                value: "AutoMessageExpiration",
                bold: true
            },
            {
                value: "PromoImage",
                bold: true
            }
        ];

        samplesSheet.data.push(header_row);

        // write the question for each sample
        _.each(products, function(product, product_index) {

            var master_ean = '';

            if(product.master_ean) {
                if (product.master_ean.locator) {
                    master_ean = product.master_ean.locator;
                } else if(product.master_ean.product_info) {
                    master_ean = product.master_ean.product_info;
                }
            }

            var product_entry = [
                {
                    value: product.brand_name,
                    autoWidth: true,
                    bold: false,
                },
                {
                    value: product.ean,
                    autoWidth: true,
                    bold: false,
                    formatCode: product.ean.length == 8 ?'00000000':'0000000000000'
                },
                {
                    value: product.name,
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.feature_weight && product.feature_weight > 0 ? '1' : '0',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.images && product.images.length > 0 ? product.images[0] : '',
                    autoWidth: true,
                    bold: false
                },
                {
	            value: product.nutrition_labels ? product.nutrition_labels : '',
		    autoWidth: true,
                    bold: false
                },
                {
                    value: product.phone_number ? product.phone_number : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.sms_number ? product.sms_number : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.facebook_link ? product.facebook_link : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.twitter_link ? product.twitter_link : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.instagram_link ? product.instagram_link : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.brand_message ? product.brand_message : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: typeof(product.faq) == 'string' ? product.faq : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.ingredients ? product.ingredients : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.instructions ? product.instructions : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.auto_message ? product.auto_message : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: master_ean,
                    autoWidth: true,
                    bold: false,
                    formatCode: (master_ean ? (master_ean.length == 8 ? '00000000':'0000000000000') : 'General')
                },
                {
                    value: product.master_ean && product.master_ean.locator ? '1' : '0',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.master_ean && product.master_ean.product_info ? '1' : '0',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.promo_videos && product.promo_videos.length > 0 ? product.promo_videos[0] : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.image_style ? product.image_style : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.map_search_types && product.map_search_types.length > 0 ? product.map_search_types.join() : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.auto_message_expiration ? moment(product.auto_message_expiration).format('MM/DD/YYYY') : '',
                    autoWidth: true,
                    bold: false
                },
                {
                    value: product.promo_images && product.promo_images.length > 0 ? product.promo_images[0] : '',
                    autoWidth: true,
                    bold: false
                }
            ];
            var product_validations = [
                {}
            ];

            samplesSheet.data.push(product_entry);
            //samplesSheet.data_validation.push(product_validations);
        });
        return samplesSheet;
}
    
    
function _importProductsForBrandWithCsv(caller, brand_id, file, callback2) {
	var results = [];
  	var base64File = '';
  	var productsCsv = [];
	var products = [];
   	fs.readFile(file.path, function (err, data) {
       	    base64File = new Buffer(data, 'binary').toString('base64');
       	    var productsCsvStr = new Buffer(base64File, 'base64').toString('utf8');
       	    productsCsv = babyparse.parse(productsCsvStr);

       	   var async_tasks = [], warnings = [];

	   // these are the indexes that were found to be duplicates
	   products = appendDuplicateStatus(productsCsv.data);


       	   _.each(products, function (row, index) {

	       var leading_pad = function pad(num, size) {
		    var s = num+"";
		    while (s.length < size) s = "0" + s;
		
		    return s;
	       };

	       var checkEan = function(eanValue) {
		    if(!eanValue || eanValue.length == 0) {
		        return false;
		    }

		    return true;
	       };

	       var eanValid = checkEan(row[1]);
           
	       // ignore header line
               if (index > 0 && eanValid) {
           
                   if(_path.extname(file.name) != '.csv')
                	return;

                   // make sure the row has enough records
                   if(typeof(row) == 'undefined' || row == null)
                       return;

                   if(row.length < 3) {
                       warnings.push('row ' + index + ' had too few items');
                    } else {

                        // build the product from the line
                        var item = {

                          brand_name: row[0],
                          ean: row[1],
                          brand: '',
                          name: row[2],
                          feature_weight: row[3],
                          images: [row[4]],
                          nutrition_labels: [row[5]],
                          phone_number: row[6],
                          sms_number:  row[7],
                          facebook_link: row[8],
                          twitter_link:  row[9],
                          instagram_link:  row[10],
                          brand_message:  row[11],
                          faq:  row[12],
                          ingredients:  row[13],
                          instructions:  row[14],
                          auto_message:  row[15],
                          promo_videos: [row[19]],
                          image_style: row[20],
                          map_search_types: row[21],
                          auto_msg_expiration: row[22],
                          promo_images: [row[23]],
                          master_ean: {
                            locator: '',
                            product_info: ''},
			  			  is_duplicate: row[24]
                       };

		      // no longer put products without a brand into the Bullpen
                      //if(item.brand_name == '')
                      //    item.brand_name = 'Bullpen';

                      // if the EAN is at least of the valid format
                      if(item.ean && item.ean.length > 0 && item.ean != '00000000' && item.ean != '0000000000000') {

                         // apply master EAN if necessary
                         var masterEan = row[16];
                         if (masterEan && masterEan.trim().length > 0) {
                           item.master_ean = {
                               locator: row[17] == 1 ? row[16] : '',
                               product_info: row[18] == 1 ? row[16] : ''
                           };
                         }

                        async_tasks.push(function(callback_async) {
                           database.ean.findOne({ean: item.ean}, function (err_product, product) {
                               if (product) {
                                   item.matchingExistingProduct = product;
                                   item._id = product._id;
                                   item.brand = product.brand;

                                   //results.push(item);
                                   //setTimeout(callback_async, 0);
                               }
                               //else{

                                   var brand_info = {
                                       name: item.brand_name,
                                       last_update: (new Date()).getTime()
                                   };

                                   database.pod_brands.findOne({name: brand_info.name},function(err_brands, brand) {

                                       if(brand)
                                       {
                                           item.brand = brand._id.toString();
                                           results.push(item);
                                           setTimeout(callback_async, 0);
                                       }
                                       else
                                       {
                                           database.pod_brands.insert(brand_info, function(err_update, insert_result) {
                                               if(err_update == null) {
                                                   item.brand = insert_result[0]._id.toString();
                                               }
                                               results.push(item);
                                               setTimeout(callback_async, 0);
                                           });
                                       }
                                   });

                               //}



                           });	

                       });

                   } else {
                       warnings.push('ean on line ' + index + ' had an invalid EAN');
                   }
               }
           }
       });

       async.series(async_tasks, function(err_async) {
           callback2(err_async, {
               products: results,
               warnings: warnings
           });
       });
   });
}

    
function _exportProductsForBrandAsCsv(caller, brand_id, callback) {
    	database.pod_brands.findOne({id: ObjectID(brand_id)}, function(err_brand, brand) {
        if(err_brand) {
            winston.error('an error occurred while getting a brand from the database: ' + err_brand);
            callback(err_brand);
            return;
        }

        database.ean.find({brand: brand_id}).toArray(function(err_products, products) {
            if(err_products) {
                winston.error('an error occurred while getting products for a brand from the database: ' + err_products);
                callback(err_products);
                return;
            }

            if(products == null || products.length == 0) {
                callback('no products exist for the given brand');
                return;
            }

            var csvData = _buildProductsCsv(products);
	    	var csvStr = babyparse.unparse(csvData);

            var buffer = new Buffer(csvStr, 'base64');
            callback(null, csvStr);
        });
    });
}
    
function _buildProductsCsv(products) {
        var csv = [];

        // build the header row
        var header_row = [ 'Brand',
          		    'EAN',
          		    'Name',
          		    'Active',
            		    'ProductImage',
             		    'ProductLabel',
          		    'Phone',
     			    'SMS',
   			    'Facebook',
			    'Twitter',
			    'Instagram',
			    'BrandMessage',
			    'FAQ',
			    'Ingredients',
			    'Instructions',
			    'AutoMessage',
			    'MasterEAN',
			    'UseMasterEANForWhereToBuy',
			    'UseMasterEANForProductInfo',
			    'PromoVideo',
			    'BackgroundStyle',
			    'MapSearchTypes',
			    'AutoMessageExpiration',
			    'PromoImage' ];

        csv.push(header_row);

        // write the question for each sample
        _.each(products, function(product, product_index) {

            var master_ean = '';

            if(product.master_ean) {
                if (product.master_ean.locator) {
                    master_ean = product.master_ean.locator;
                } else if(product.master_ean.product_info) {
                    master_ean = product.master_ean.product_info;
                }
            }

            var product_entry = [ product.brand_name,
             			  product.ean,
                   		  product.name,
                   		  product.feature_weight && product.feature_weight > 0 ? '1' : '0',
                   		  product.images && product.images.length > 0 ? product.images[0] : '',
				  product.nutrition_labels ? product.nutrition_labels : '',
				  product.phone_number ? product.phone_number : '',
				  product.sms_number ? product.sms_number : '',
				  product.facebook_link ? product.facebook_link : '',
				  product.twitter_link ? product.twitter_link : '',
				  product.instagram_link ? product.instagram_link : '',
				  product.brand_message ? product.brand_message : '',
   				  typeof(product.faq) == 'string' ? product.faq : '',
				  product.ingredients ? product.ingredients : '',
				  product.instructions ? product.instructions : '',
				  product.auto_message ? product.auto_message : '',
				  master_ean,
				  product.master_ean && product.master_ean.locator ? '1' : '0',
				  product.master_ean && product.master_ean.product_info ? '1' : '0',
				  product.promo_videos && product.promo_videos.length > 0 ? product.promo_videos[0] : '',
				  product.image_style ? product.image_style : '',
				  product.map_search_types && product.map_search_types.length > 0 ? product.map_search_types.join() : '',
				  product.auto_message_expiration ? moment(product.auto_message_expiration).format('MM/DD/YYYY') : '',
				  product.promo_images && product.promo_images.length > 0 ? product.promo_images[0] : ''
                   	      ];
           
            csv.push(product_entry);
        });
        
        return csv;
}

function appendDuplicateStatus(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	for(var i = 0; i < len; i++) {
	    out[i] = a[i];
	    var item = a[i][1];
	    if(seen[item] != 1) {
	        seen[item] = 1;
			out[i].push('no dup');
	    } else {
	        out[i].push('dup');
	    }
	}

	return out;
}

function appendDuplicateStatusXlsx(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	for(var i = 0; i < len; i++) {
	    out[i] = a[i];
	    var item = a[i][1];
	    if(item == undefined) {
	   		item = '';
	   	} else {
	   		item = item.value.toString();
	   	}
	    	
	    if(seen[item] != 1) {
	        seen[item] = 1;
		out[i][24] = {value: 'no dup', autoWidth: true, bold: false};
	    } else {
	        out[i][24] = {value: 'dup', autoWidth: true, bold: false};
	   	}
	}

	return out;
}

