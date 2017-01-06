/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/model/product.d.ts" />
var action;
(function (action) {
    var admin;
    (function (admin) {
        var brand;
        (function (_brand) {
            var EditableField = (function () {
                function EditableField(value, originalValue, validate, changed) {
                    var _this = this;
                    this.value = ko.observable('');
                    this.originalValue = ko.observable(''); //This is value that is already in DB IF it has one
                    this.isValid = ko.observable(true);
                    this.hide = ko.observable(false);
                    this.hasChanged = ko.computed({
                        owner: this,
                        read: function () {
                            return _this.originalValue() && _this.originalValue() != "" && _this.value() != _this.originalValue();
                        }
                    });
                    this.hasValue = ko.computed({
                        owner: this,
                        read: function () {
                            return _this.value() != null && _this.value() != "";
                        }
                    });
                    this.isEditing = ko.observable(false);
                    this.edit = function () {
                        _this.isEditing(true);
                    };
                    this.revert = function () {
                        _this.value(_this.originalValue());
                    };
                    this.validationErrorMessage = ko.observable('Entry is invalid');
                    var self = this;
		    if(originalValue == null) {
			    originalValue = "";
		    }
                    self.originalValue(originalValue);
                    self.validate = validate;
                    self.value.subscribe(function (value) {
                        var response = self.validate(value);
                        self.isValid(response.isValid);
                        self.validationErrorMessage(response.message);
                        changed(self, value);
                    });
                    if (value == "*") {
                        self.hide(true);
                        self.value(originalValue);
                    }
                    else if (value == null) {
                        self.value("");
                    } else {
                        self.value(value);
                    }
                    self.finishEdit = function () {
                        self.isEditing(false);
                    };
                }
                return EditableField;
            })();
            _brand.EditableField = EditableField;
            var ProductViewModel = (function () {
                function ProductViewModel(data, brand, fieldChanged) {
                    var _this = this;
                    this.useMasterOnProductInfo = ko.observable(false);
                    this.useMasterOnLocator = ko.observable(false);
                    this.searchable = ko.observable(false);
                    this.isSaved = ko.observable(false);
                    this.serverError = ko.observable('');
                    this.editSocialLinks = ko.observable(false);
                    this.toggleSocialLinks = function () {
                        _this.editSocialLinks(!_this.editSocialLinks());
                    };
                    this.editMasterEan = ko.observable(false);
                    this.toggleMasterEan = function () {
                        _this.editMasterEan(!_this.editMasterEan());
                    };
                    this.editMedia = ko.observable(false);
                    this.toggleMedia = function () {
                        _this.editMedia(!_this.editMedia());
                    };
                    // http://en.wikipedia.org/wiki/Check_digit
                    this.computeCheckDigit = function (upc) {
                        var i = 0, sum = 0;
                        for (; i < upc.length; i += 2) {
                            sum += parseInt(upc[i]);
                        }
                        sum *= 3;
                        for (i = 1; i < upc.length; i += 2) {
                            sum += parseInt(upc[i]);
                        }
                        return (sum % 10 == 0 ? 0 : 10 - (sum % 10));
                    };
                    this.validateUpc = function (value) {
                        var response = { isValid: true, message: "" };
                        // if(value && value.length < 12)
                        // {
                        //    response.isValid = false;
                        //    response.message = "UPC entered is too short!"
                        //}

                        return response;
                    };

                    this.validateBrandName = function (value) {
                        var response = { isValid: true, message: "" };
                        if (value.trim() == "") {
                            response.isValid = false;
                            response.message = "Brand Name provided contains invalid characters";
                        }
                        if (value && value.length === 0) {
                            response.isValid = false;
                            response.message = "Brand Name / Brand Name of Product is Required";
                        }
                        return response;
                    };


                    this.validateName = function (value) {
                        var response = { isValid: true, message: "" };
                        if (value.trim() == "") {
                            response.isValid = false;
                            response.message = "Name provided contains invalid characters";
                        }
                        if (value && value.length === 0) {
                            response.isValid = false;
                            response.message = "Name / Description of Product is Required";
                        }
                        return response;
                    };
                    this.validateUrl = function (value) {
                        var response = { isValid: true, message: "" };
                        var RegExp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                        if (value && value.length > 0 && !RegExp.test(value)) {
                            response.isValid = false, response.message = "Invalid Image Url.  Make sure it includes HTTP:// or HTTPS://";
                        }
                        return response;
                    };
                    this.validateProdLabel =function(value){
                        var response = { isValid: true, message: "" };
                        if(typeof value === 'boolean' && value.length>0 && value.trim() == "")
                        {
                            response.isValid = false, response.message = "Invalid Product Label";
                        }
                        return response;
                    }
                    this.validatePhone = function (value) {
                        // phone number is not required
                        if (value.length == 0) {
                            var response = {
                                isValid: true,
                                message: ""
                            };
                            return response;
                        }
                        var isValid = general_util.validatePhoneNumber(value);
                        var response = {
                            isValid: isValid,
                            message: (isValid ? "" : "Phone numbers, if supplied, must be ###-###-####")
                        };
                        return response;
                    };
                    this.generalValidation = function (value) {
                        var response = { isValid: true, message: "" };
                        //todo - not sure what validation limits there are
                        return response;
                    };
                    this.update = function (data, onComplete) {
                        var self = _this;
                        $.ajax({
                            type: 'POST',
                            url: '/product/' + data._id,
                            data: data
                        }).fail(function (e) {
                            self.serverError(e.responseText);
                            //todo: need to handle this is and add some sort of actionable error message to the UI
                            onComplete();
                        }).done(function (result) {
                            self.isSaved(true);
                            onComplete();
                        });
                    };
                    this.create = function (data, onComplete) {
                        var self = _this;
                        $.ajax({
                            type: 'PUT',
                            url: '/product',
                            data: data
                        }).fail(function (e) {
                            self.serverError(e.responseText);
                            onComplete();
                            //todo: need to handle this is and add some sort of actionable error message to the UI
                        }).done(function (result) {
                            data._id = result[0]._id;
                            self.update(data); //todo: not ideal to update a record after updating we might want to change the server product create to handle all fields not just name and EAN.
                            self.isSaved(true);
                            onComplete();
                        });
                    };
                    this.save = function (onComplete) {
                        var self = _this;
                        if (!self.isValid() || self.isDuplicate() || !self.hasBrandName())
                            return false;

                        var data = {
                            _id: self.existingProduct ? self.existingProduct._id : null,
                            name: self.name.value(),
                            ean: self.ean.value(),
                            upc: self.ean.value().substring(1, 13),
                            brand: self.brand,
                            master_ean: {
                                locator: self.useMasterOnLocator() ? self.masterEan.value() : "",
                                product_info: self.useMasterOnProductInfo() ? self.masterEan.value() : ""
                            },
                            brand_name: self.brand_name.value(),
                            brand_message: self.message.value().trim(),
                            facebook_link: self.facebook.value(),
                            instagram_link: self.instagram.value(),
                            twitter_link: self.twitter.value(),
                            faq: self.faq.value().trim(),
                            images: new Array(self.image.value()),
                            ingredients: self.ingredients.value().trim(),
                            instructions: self.instructions.value().trim(),
                            auto_message: self.auto_message.value().trim(),
                            nutrition_labels: Array.isArray(self.label.value())?self.label.value().toString():self.label.value(),
                            phone_number: self.phone.value(),
                            sms_number: self.sms.value(),
                            feature_weight: self.searchable() ? "1" : "0",
                            matchingExistingProduct: null,
                            promo_images: new Array(self.promoImage.value()),
                            promo_videos: new Array(self.promoVideo.value()),
                            image_style: self.backgroundStyle.value()
                        };

                        if (self.belongsToAnotherBrand()) {
                            $.ajax({
                                type: 'POST',
                                url: '/products/' + self.existingProduct._id + '/brand?brand=' + self.brand
                            }).error(function(e) {
                                console.log('Transfer Error:' + e.responseText);
                                onComplete();
                            }).done(function(result) {
                                console.log('Transfer Success');
                                _this.update(data, onComplete);
                            });
                        }else {
                            // get data
                            if (self.existingProduct == null) {
                                _this.create(data, onComplete);
                            }
                            if (self.existingProduct != null) {
                                _this.update(data, onComplete);
                            }
                        }
                        return false;
                    };
                    var self = this;
                    self.brand = brand;

                    //setup EAN Validation / Auto Correct
                    self.validateEan = function (value) {
                        var response = { isValid: true, message: "" };
                        if (value && self.ean) {
                            if (!value.match(/^\d+$/)) {
                                response.isValid = false;
                                response.message = "EAN provided contains invalid characters";
                                return response;
                            }
                            if (value.length == 10) {
                                var upc = '0' + value;
                                upc = upc + _this.computeCheckDigit(upc);
                                self.upc.value(upc);
                                self.ean.value('0' + upc);
                                return response;
                            }
                            if (value.length == 11) {
                                var upc = value + _this.computeCheckDigit(value);
                                self.upc.value(upc);
                                self.ean.value('0' + upc);
                                return response;
                            }
                            if (value.length == 12) {
                                self.upc.value(value);
                                self.ean.value('0' + value);
                                return response;
                            }
                            if (value.length == 13) {
                                self.ean.value(value);
                                self.upc.value(value.substring(1, value.length));
                                return response;
                            }
                            response.isValid = false;
                            response.message = "EAN provided is not valid";
                        }
                        return response;
                    };
                    //setup EAN Validation / Auto Correct
                    self.validateMasterEan = function (value) {
                        var response = { isValid: true, message: "" };
                        if (value && self.masterEan) {
                            if (value.length == 10) {
                                var upc = '0' + value;
                                upc = upc + _this.computeCheckDigit(upc);
                                self.masterEan.value(upc);
                                return response;
                            }
                            if (value.length == 12) {
                                self.masterEan.value('0' + value);
                                return response;
                            }
                            if (value.length == 13) {
                                self.masterEan.value(value);
                                return response;
                            }
                            response.isValid = false;
                            response.message = "Master EAN provided is not valid";
                        }
                        return response;
                    };
                    self.brand_name = new EditableField(data.brand_name, data.matchingExistingProduct ? data.matchingExistingProduct.brand_name:"", self.validateBrandName, fieldChanged);
                    self.ean = new EditableField(data.ean, data.matchingExistingProduct ? data.matchingExistingProduct.ean : "", self.validateEan, fieldChanged);
                    self.upc = new EditableField(data.upc, data.matchingExistingProduct ? data.matchingExistingProduct.upc : "", self.validateUpc, fieldChanged);
                    // process master EAN properties
                    var existingMasterEan = { locator: '', product_info: '' };
                    if (data.matchingExistingProduct && data.matchingExistingProduct.master_ean) {
                        existingMasterEan = data.matchingExistingProduct.master_ean;
                    }
                    var bestExistingEAN = existingMasterEan.locator;
                    if (!bestExistingEAN) {
                        bestExistingEAN = existingMasterEan.product_info;
                    }
                    var newMasterEan = { locator: '', product_info: '' };
                    if (data.master_ean) {
                        newMasterEan = data.master_ean;
                    }
                    var bestNewEAN = newMasterEan.locator;
                    if (!bestNewEAN) {
                        bestNewEAN = newMasterEan.product_info;
                    }
                    self.masterEan = new EditableField(bestNewEAN, bestExistingEAN, self.validateMasterEan, fieldChanged);
                    self.useMasterOnLocator(data.master_ean.locator ? true : false);
                    self.useMasterOnProductInfo(data.master_ean.product_info ? true : false);
                    // process product name
                    self.name = new EditableField(data.name, data.matchingExistingProduct ? data.matchingExistingProduct.name : "", self.validateName, fieldChanged);
                    // process product images
                    var image = "";
                    var originalImage = "";
                    if (data.images && data.images.length > 0) {
                        image = data.images[0];
                    }
                    if (data.matchingExistingProduct && data.matchingExistingProduct.images && data.matchingExistingProduct.images.length > 0) {
                        originalImage = data.matchingExistingProduct.images[0];
                    }
                    self.image = new EditableField(image, originalImage, self.validateUrl, fieldChanged);
                    // process product labels
                    /*
                    var label = "";
                    var originalLabel = "";
                    if (data.nutrition_labels && data.nutrition_labels.length > 0) {
                        label = data.nutrition_labels[0];
                    }
                    if (data.matchingExistingProduct && data.matchingExistingProduct.nutrition_labels && data.matchingExistingProduct.nutrition_labels.length > 0) {
                        originalLabel = data.matchingExistingProduct.nutrition_labels[0];
                    }
                    self.label = new EditableField(label, originalLabel, self.validateUrl, fieldChanged);
                    */
                    self.label = new EditableField(data.nutrition_labels, data.matchingExistingProduct ? data.matchingExistingProduct.nutrition_labels : "", self.validateProdLabel, fieldChanged);

                    // process promo image
                    var promoImage = "";
                    var oringinalPromoImage = "";
                    if (data.promo_images && data.promo_images.length > 0) {
                        promoImage = data.promo_images[0];
                    }
                    if (data.matchingExistingProduct && data.matchingExistingProduct.promo_images && data.matchingExistingProduct.promo_images.length > 0) {
                        oringinalPromoImage = data.matchingExistingProduct.promo_images[0];
                    }
                    self.promoImage = new EditableField(promoImage, oringinalPromoImage, self.validateUrl, fieldChanged);
                    //TODO This probably should be wrapped in a function
                    // process promo videos
                    var promoVideo = "";
                    var originalPromoVideo = "";
                    if (data.promo_videos && data.promo_videos.length > 0) {
                        promoVideo = data.promo_videos[0];
                    }
                    if (data.matchingExistingProduct && data.matchingExistingProduct.promo_videos && data.matchingExistingProduct.promo_videos.length > 0) {
                        originalPromoVideo = data.matchingExistingProduct.promo_videos[0];
                    }
                    self.promoVideo = new EditableField(promoVideo, originalPromoVideo, self.validateUrl, fieldChanged);
                    // process other properties
                    self.backgroundStyle = new EditableField(data.image_style, data.matchingExistingProduct ? data.matchingExistingProduct.image_style : "", self.generalValidation, fieldChanged);
                    self.phone = new EditableField(data.phone_number, data.matchingExistingProduct ? data.matchingExistingProduct.phone_number : "", self.validatePhone, fieldChanged);
                    self.sms = new EditableField(data.sms_number, data.matchingExistingProduct ? data.matchingExistingProduct.sms_number : "", self.validatePhone, fieldChanged);
                    self.facebook = new EditableField(data.facebook_link, data.matchingExistingProduct ? data.matchingExistingProduct.facebook_link : "", self.validateUrl, fieldChanged);
                    self.twitter = new EditableField(data.twitter_link, data.matchingExistingProduct ? data.matchingExistingProduct.twitter_link : "", self.validateUrl, fieldChanged);
                    self.instagram = new EditableField(data.instagram_link, data.matchingExistingProduct ? data.matchingExistingProduct.instagram_link : "", self.validateUrl, fieldChanged);
                    self.faq = new EditableField(data.faq, data.matchingExistingProduct ? data.matchingExistingProduct.faq : "", self.generalValidation, fieldChanged);
                    self.ingredients = new EditableField(data.ingredients, data.matchingExistingProduct ? data.matchingExistingProduct.ingredients : "", self.generalValidation, fieldChanged);
                    self.message = new EditableField(data.brand_message, data.matchingExistingProduct ? data.matchingExistingProduct.brand_message : "", self.generalValidation, fieldChanged);
                    self.instructions = new EditableField(data.instructions, data.matchingExistingProduct ? data.matchingExistingProduct.instructions : "", self.generalValidation, fieldChanged);
                    self.auto_message = new EditableField(data.auto_message, data.matchingExistingProduct ? data.matchingExistingProduct.auto_message : "", self.generalValidation, fieldChanged);
                    self.searchable(!data.feature_weight ? false : (data.feature_weight == "1"));
                    self.existingProduct = null;
                    if (data.matchingExistingProduct) {
                        self.existingProduct = data.matchingExistingProduct;
                    }
                    self.belongsToAnotherBrand = ko.observable((self.existingProduct && self.existingProduct.brand != self.brand));
		    self.is_duplicate = data.is_duplicate == "undefined" || data.is_duplicate == "" ? "no dup" : data.is_duplicate;
		    var ean_response = self.validateEan(data.ean);
                    self.ean.isValid(ean_response.isValid);
                    self.ean.validationErrorMessage(ean_response.message);
                    self.isValid = ko.computed({
                        owner: self,
                        read: function () {
                            return self.ean.isValid() && self.masterEan.isValid() && self.upc.isValid() && self.name.isValid() && self.phone.isValid() && self.sms.isValid() && self.facebook.isValid() && self.twitter.isValid() && self.instagram.isValid() && self.brand_name.isValid();
                        }
                    });
                    self.existingBrandName = function () {
                        return self.existingProduct ? self.existingProduct.brand_name : 'None';
                    };
		    self.isDuplicate = function () {
			return self.is_duplicate == "dup";
		    };

		    self.hasBrandName = function () {
			return self.brand_name.value() != null && self.brand_name.value() != "";
		    };

		    self.doesMatch = function () {
			if(self.existingProduct == null) {
				return false;
			}

			var values = "", oldValues = "";
			values += self.brand_name.value();
			values += '&' + self.ean.value();
			values += '&' + self.upc.value();
			values += '&' + JSON.stringify(self.masterEan.value());
			values += '&' + self.name.value();
			values += '&' + self.message.value();
			values += '&' + self.facebook.value();
			values += '&' + self.instagram.value();
			values += '&' + self.twitter.value();
			values += '&' + self.faq.value();
			values += '&' + self.ingredients.value();
			values += '&' + self.instructions.value();
			values += '&' + self.auto_message.value();
			values += '&' + self.label.value();
			values += '&' + self.phone.value();
			values += '&' + self.sms.value();
			values += '&' + self.backgroundStyle.value();
			values += '&' + self.image.value();
			values += '&' + self.promoVideo.value();
			values += '&' + self.promoImage.value();

			oldValues += self.brand_name.originalValue();
			oldValues += '&' + self.ean.originalValue();
			oldValues += '&' + self.upc.value();
			oldValues += '&' + JSON.stringify(self.masterEan.originalValue());
			oldValues += '&' + self.name.originalValue();
			oldValues += '&' + self.message.originalValue();
			oldValues += '&' + self.facebook.originalValue();
			oldValues += '&' + self.instagram.originalValue();
			oldValues += '&' + self.twitter.originalValue();
			oldValues += '&' + self.faq.originalValue();
			oldValues += '&' + self.ingredients.originalValue();
			oldValues += '&' + self.instructions.originalValue();
			oldValues += '&' + self.auto_message.originalValue();
			oldValues += '&' + self.label.originalValue();
			oldValues += '&' + self.phone.originalValue();
			oldValues += '&' + self.sms.originalValue();
			oldValues += '&' + self.backgroundStyle.originalValue();
			oldValues += '&' + self.image.originalValue();
			oldValues += '&' + self.promoVideo.originalValue();
			oldValues += '&' + self.promoImage.originalValue();

			return values.localeCompare(oldValues) == 0;
		    };
		    
                }
                return ProductViewModel;
            })();
            _brand.ProductViewModel = ProductViewModel;
            var ProductImporterViewModel = (function () {
                function ProductImporterViewModel(brand) {
                    var _this = this;
                    this.totalCount = ko.observable(0);
                    this.newCount = ko.observable(0);
                    this.updateCount = ko.observable(0);
                    this.errorCount = ko.observable(0);
                    this.notUnderBrandCount = ko.observable(0);
                    this.importComplete = ko.observable(false);
                    this.importFailed = ko.observable(false);
                    this.saveComplete = ko.observable(false);
                    this.countImported = ko.observable(0);
                    this.countUpdated = ko.observable(0);
                    this.brand = '';
                    this.save = function () {
                        var self = _this, expectedCount = 0, finishedCount = 0;
                        for (var i in self.importedData()) {
                            var item = self.importedData()[i];
                            if (item.isValid() && !item.isDuplicate() && item.hasBrandName()) {
                                expectedCount++;
                                if (item.existingProduct == null) {
                                    self.countImported(self.countImported() + 1);
                                }
                                if (item.existingProduct != null  && item.isDuplicate() == false && item.doesMatch() == false && item.hasBrandName() == true) {
                                    self.countUpdated(self.countUpdated() + 1);
                                }
                            }
                            item.save(function () {
                                finishedCount++;
                                if (finishedCount >= expectedCount) {
                                    self.saveComplete(true);
                                }
                            });
                        }
                    };
                    this.onProductFieldChanged = function () {
                        var self = _this;
                        self.saveComplete(false);
                        var errorCount = 0;
			var newCount = 0;
			var updateCount = 0;
                        self.visibleData().every(function (item) {
                            if (item.isValid() == false) {
                                errorCount++;
                            }

			    if(item.existingProduct == null && item.hasBrandName() == true) {
			        newCount++;
			    }

			    if(item.existingProduct != null && item.isDuplicate() == false && item.doesMatch() == false && item.hasBrandName() == true) {
				updateCount++;
			    } 

                            return true;
                        });
                        self.errorCount(errorCount);
			self.newCount(newCount);
			self.updateCount(updateCount);
                    };
                    this.addProduct = function () {
                        var self = _this;
                        var data = {
                            _id: null,
                            name: "",
                            ean: "",
                            upc: "",
                            brand: self.brand,
                            master_ean: { locator: "", product_info: "" },
                            brand_message: "",
                            brand_name: "",
                            facebook_link: "",
                            instagram_link: "",
                            twitter_link: "",
                            faq: "",
                            images: new Array(),
                            ingredients: "",
                            instructions: "",
                            auto_message: "",
                            nutrition_labels: "",
                            phone_number: "",
                            sms_number: "",
                            feature_weight: "0",
                            matchingExistingProduct: null,
                            promo_images: new Array(),
                            promo_videos: new Array(),
                            image_style: "Auto"
                        };

                        var newProduct = new action.admin.brand.ProductViewModel(data, self.brand, self.onProductFieldChanged);
                        // add the new product to the data lists
                        self.importedData.unshift(newProduct);
                        self.visibleData.unshift(newProduct);
                        // update counts
                        self.newCount(self.newCount() + 1);
                        self.totalCount(self.totalCount() + 1);
                    };
                    var self = this;
                    self.brand = brand;
                    self.importedData = ko.observableArray([]);
                    self.visibleData = ko.observableArray([]);


                    self._onProductUploadComplete = function (response) {
                        self.importedData([]);
                        self.visibleData([]);
                        self.totalCount(0);
                        self.newCount(0);
                        self.updateCount(0);
                        self.notUnderBrandCount(0);
                        if (response.result.products.length == 0) {
                            alert('No products were imported. Warnings:\n' + response.result.warnings.join('\n'));
                            return;
                        }
                        if (response.result.warnings.length > 0) {
                            alert('Some warnings were given. Warnings:\n' + response.result.warnings.join('\n'));
                        }

                        for (var i in response.result.products) {
                            var item = response.result.products[i];
                            var product = new action.admin.brand.ProductViewModel(item, item.brand, self.onProductFieldChanged);      // origin (item, item.brand, self.onProductFieldChanged)

                            self.importedData.push(product);

                            //Increment import summary data
                            self.totalCount(self.totalCount() + 1);
                            if (product.existingProduct == null && product.isDuplicate() == false && product.hasBrandName() == true) {
                                self.newCount(self.newCount() + 1);
                            } else if(product.existingProduct != null && product.isDuplicate() == false && product.doesMatch() == false && product.hasBrandName() == true ) {
                                self.updateCount(self.updateCount() + 1);
                            }

			    if (typeof product.existingProduct != undefined && product.existingProduct != null && product.existingProduct.brand != null && product.brand !== product.existingProduct.brand) {          // origin : (self.brand != product.existingProduct.brand)
                                    self.notUnderBrandCount(self.notUnderBrandCount() + 1);
                            }

			    // timing issue.. try calling this again
			    window.setTimeout(self.onProductFieldChanged, 1000);
                        }
                        self.filterReset();
                        self.importComplete(true);
                        self.saveComplete(false);
                    };
                    self._onProductUploadFailed = function (error) {
                        window.alert(error);
                        self.importFailed(true);
                    };
                    self.importedData.subscribe(function (data) {
                        self.errorCount(0);
                        data.every(function (item) {
                            if (item.isValid() == false) {
                                self.errorCount(self.errorCount() + 1);
                            }
                            return true;
                        });
                    });
                    self.filterBrandError = function () {
                        self.visibleData(self.importedData().filter(function (item) {
                            return item.belongsToAnotherBrand();
                        }));
                    };
                    self.filterError = function () {
                        self.visibleData(self.importedData().filter(function (item) {
                            return item.isValid() == false || item.isDuplicate() == true;
                        }));
                    };
                    self.filterNew = function () {
                        self.visibleData(self.importedData().filter(function (item) {
                            return item.existingProduct == null && item.isDuplicate() == false && item.hasBrandName() == true;
                        }));
                    };
                    self.filterUpdate = function () {
                        self.visibleData(self.importedData().filter(function (item) {
                            return item.existingProduct != null && item.isDuplicate() == false && item.doesMatch() == false && item.hasBrandName() == true;
                        }));
                    };
                    self.filterReset = function () {
                        self.visibleData(self.importedData().slice(0));
                    };
		    self.validateEans = function() {
		        self.visibleData().every(function (item) {
			    item.validateEan();
			});	
		    };
                }
                return ProductImporterViewModel;
            })();
            _brand.ProductImporterViewModel = ProductImporterViewModel;
        })(brand = admin.brand || (admin.brand = {}));
    })(admin = action.admin || (action.admin = {}));
})(action || (action = {}));
//# sourceMappingURL=brand-product-importer.js.map
