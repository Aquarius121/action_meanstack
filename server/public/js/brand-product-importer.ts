
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/model/product.d.ts" />

// we use a global util called general_util
declare var general_util: any;

module action.admin.brand {

    export class EditableField
    {
        public value: KnockoutObservable<string> = ko.observable('');
        public originalValue: KnockoutObservable<string> = ko.observable(''); //This is value that is already in DB IF it has one
	public isValid: KnockoutObservable<boolean> = ko.observable(true);
        public hide:  KnockoutObservable<boolean> = ko.observable(false);
        public hasChanged: KnockoutObservable<boolean> = ko.computed({
            owner: this,
            read:  () => {
	        return this.originalValue() && this.originalValue() != "" && this.value() != this.originalValue();
            }
        });

        public hasValue: KnockoutObservable<boolean> = ko.computed({
            owner: this,
            read:  () => {
	    return this.value() != null && this.value() != "";
            }
        });

        public isEditing: KnockoutObservable<boolean> = ko.observable(false);

        public edit: Function = () => {
            this.isEditing(true);
        };

        public finishEdit: Function;

        public revert: Function = () => {
            this.value(this.originalValue());
        };

        public onChanged: Function;
        public validate: Function;
        public validationErrorMessage: KnockoutObservable<string> = ko.observable('Entry is invalid');

        constructor(value: string, originalValue: string, validate: Function, changed: Function)
        {
            var self = this;
	    if(originalValue == null) {
	        originalValue = "";
	    }
            self.originalValue(originalValue);
            self.validate = validate;

            self.value.subscribe(function(value){
                var response: IValidationResponse = self.validate(value);
                self.isValid(response.isValid);
                self.validationErrorMessage(response.message);
                changed(self, value);
            });

            if(value == "*") //If asterix is used in spreadsheet it means do not update value
            {
                self.hide(true);
                self.value(originalValue);
            }
	    else if(value == null) {
                self.value("");
            }
            else
            {
                self.value(value);
            }

            self.finishEdit = () => {
                self.isEditing(false);
            };
        }
    }

    export class ProductViewModel
    {
        public brand_name: EditableField;
        public ean: EditableField;
        public masterEan:  EditableField;
        public useMasterOnProductInfo: KnockoutObservable<boolean> = ko.observable(false);
        public useMasterOnLocator: KnockoutObservable<boolean> = ko.observable(false);
        public upc: EditableField;
        public name: EditableField;

        public image: EditableField;
        public label: EditableField;

        public facebook: EditableField;
        public twitter: EditableField;
        public instagram: EditableField;

        public backgroundStyle: EditableField;
        public promoImage: EditableField;
        public promoVideo: EditableField;

        public message: EditableField;
        public faq: EditableField;
        public ingredients: EditableField;
        public instructions: EditableField;
        public auto_message: EditableField;
        public auto_message_expire: EditableField; //TODO?
        public map_search_types: EditableField;

        public phone: EditableField;
	public sms: EditableField;;

        public searchable: KnockoutObservable<boolean> = ko.observable(false);

        public isValid: KnockoutObservable<boolean>;
	public belongsToAnotherBrand: KnockoutObservable<boolean>;
	public isDuplicate: KnockoutObservable<boolean>;

        public isSaved: KnockoutObservable<boolean> = ko.observable(false);
        public serverError: KnockoutObservable<string> = ko.observable('');

        public existingProduct: IProductData;
	public brand: string; //brand that is in context
	public is_duplicate: string;

        public existingBrandName: Function;

        public editSocialLinks: KnockoutObservable<boolean> = ko.observable(false);

        public toggleSocialLinks: Function = () => {
            this.editSocialLinks(!this.editSocialLinks());
        };

        public editMasterEan: KnockoutObservable<boolean> = ko.observable(false);

        public toggleMasterEan: Function = () => {
            this.editMasterEan(!this.editMasterEan());
        };

        public editMedia: KnockoutObservable<boolean> = ko.observable(false);

        public toggleMedia: Function = () => {
            this.editMedia(!this.editMedia());
        };

        // http://en.wikipedia.org/wiki/Check_digit
        private computeCheckDigit: Function = (upc) => {
            var i= 0, sum = 0;
            for(;i<upc.length; i+=2) {
                sum += parseInt(upc[i]);
            }
            sum *= 3;
            for(i=1;i<upc.length; i+=2) {
                sum += parseInt(upc[i]);
            }

            return (sum % 10 == 0 ? 0 : 10 - (sum % 10));
        };

        private validateEan: Function; //Build in constructor
        private validateMasterEan: Function; //Build in constructor
        private onFieldChanged: Function;

        private validateUpc: Function = (value: string) => {
            var response: IValidationResponse = { isValid: true, message: "" };

           // if(value && value.length < 12)
           // {
            //    response.isValid = false;
            //    response.message = "UPC entered is too short!"
            //}

            return response;
        };

        private validateName: Function = (value: string) => {
            var response: IValidationResponse = { isValid: true, message: "" };
            if(value && value.length === 0)
            {
                response.isValid = false;
                response.message = "Name / Description of Product is Required"
            }
            return response;
        };

        private validateBrandName: Function = (value: string) => {
            var response: IValidationResponse = { isValid: true, message: "" };
            if(value && value.length === 0)
            {
                response.isValid = false;
                response.message = "Brand Name / Brand Name of Product is Required"
            }
            return response;
        };

        private validateUrl: Function = (value: string) => {
            var response: IValidationResponse = { isValid: true, message: "" };

            var RegExp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

            if(value && value.length > 0 && !RegExp.test(value)){
                response.isValid = false,
                response.message = "Invalid Image Url.  Make sure it includes HTTP:// or HTTPS://"
            }

            return response;
        };

        private validatePhone: Function = (value: string) => {

            // phone number is not required
            if(value.length == 0) {
                var response: IValidationResponse = {
                    isValid: true,
                    message: ""
                };
                return response;
            }

            var isValid = general_util.validatePhoneNumber(value);

            var response: IValidationResponse = {
                isValid: isValid,
                message: (isValid ? "" : "Phone numbers, if supplied, must be ###-###-####")
            };
            return response;
        };

        private generalValidation: Function = (value: string) => {
            var response: IValidationResponse = { isValid: true, message: "" };
            //todo - not sure what validation limits there are

            return response;
        };

        public update: Function = (data: IProductData, onComplete: Function) =>
        {
            var self = this;
            $.ajax({
                type: 'POST',
                url: '/product/' + data._id ,
                data: data
            }).fail(function(e) {
                self.serverError(e.responseText);
                //todo: need to handle this is and add some sort of actionable error message to the UI
                onComplete();
            }).done(function(result) {
                self.isSaved(true);
                onComplete();
            });
        };

        public create: Function = (data: IProductData, onComplete: Function) =>
        {
            var self = this;
            $.ajax({
                type: 'PUT',
                url: '/product',
                data: data
            }).fail(function(e) {
                self.serverError(e.responseText);
		onComplete();

                //todo: need to handle this is and add some sort of actionable error message to the UI
            }).done(function(result) {
                data._id = result[0]._id;
                self.update(data); //todo: not ideal to update a record after updating we might want to change the server product create to handle all fields not just name and EAN.
                self.isSaved(true);
                onComplete();
            });
        };


        public save: Function = (onComplete) =>
        {
            var self = this;

	    if(!self.isValid() || self.isDuplicate())
	        return false;

            // get data
            var data: IProductData = {
                _id: self.existingProduct?self.existingProduct._id:null,
                name: self.name.value(),
                ean: self.ean.value(),
                upc: self.ean.value().substring(1, 13),
                brand: self.brand,
                master_ean: {
                    locator: self.useMasterOnLocator() ? self.masterEan.value() : "",
                    product_info: self.useMasterOnProductInfo() ? self.masterEan.value() : ""
                },
                brand_name: self.brand_name.value(),
                brand_message: self.message.value(),
                facebook_link: self.facebook.value(),
                instagram_link: self.instagram.value(),
                twitter_link: self.twitter.value(),
                faq: self.faq.value(),
                images: new Array<string>(self.image.value()),
                ingredients: self.ingredients.value(),
                instructions: self.instructions.value(),
                auto_message: self.auto_message.value(),
                nutrition_labels: Array.isArray(self.label.value())?self.label.value().toString():self.label.value(),
                phone_number: self.phone.value(),
                sms_number: self.sms.value(),
                feature_weight:  self.searchable()?"1":"0",
                matchingExistingProduct: null,
                promo_images: new Array<string>(self.promoImage.value()),
                promo_videos: new Array<string>(self.promoVideo.value()),
		image_style: self.backgroundStyle.value()
            };
            if(self.belongsToAnotherBrand())
            {

                $.ajax({
                    type: 'POST',
                    url: '/products/' + self.existingProduct._id + '/brand?brand=' + self.brand
                }).fail(function(e) {
                    console.log('Transfer Error:' + e.responseText);
                    onComplete();
                    //todo: need to handle this is and add some sort of actionable error message to the UI
                }).done(function(result) {
                    console.log('Transfer Success');
                    this.update(data, onComplete);
                });
            }
            else
            {
                if(self.existingProduct == null) //create
                {
                    this.create(data, onComplete);
                }

                if(self.existingProduct != null) //update
                {
                    this.update(data, onComplete);
                }
            }


            return false;
        };

        constructor(data: IProductData, brand: string, fieldChanged: Function)
        {
            var self = this;
            self.brand = brand;

            //setup EAN Validation / Auto Correct
            self.validateEan = (value: string) => {

                var response: IValidationResponse = { isValid: true, message: "" };
                if(value && self.ean) {
                    if(!value.match(/^\d+$/)) {
                        response.isValid = false;
                        response.message = "EAN provided contains invalid characters";
                        return response;
                    }

		    if (value.length == 10) {
		      var upc = '0' + value;
		      upc = upc + this.computeCheckDigit(upc);

		      self.upc.value(upc);
		      self.ean.value('0' + upc);
		      return response;
		    }

                    if (value.length == 11) {
                        var upc = value + this.computeCheckDigit(value);

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
            self.validateMasterEan = (value: string) => {

                var response: IValidationResponse = { isValid: true, message: "" };
                if(value && self.masterEan) {
                    if (value.length == 10) {
                        var upc = '0' + value;
                        upc = upc + this.computeCheckDigit(upc);

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
                    response.message = "Master EAN provided is not valid"
                }
                return response;
            };

            self.brand_name = new EditableField(data.brand_name, data.matchingExistingProduct?data.matchingExistingProduct.brand_name:"", self.validateBrandName, fieldChanged);
            self.ean = new EditableField(data.ean, data.matchingExistingProduct?data.matchingExistingProduct.ean:"", self.validateEan, fieldChanged);
            self.upc = new EditableField(data.upc, data.matchingExistingProduct?data.matchingExistingProduct.upc:"", self.validateUpc, fieldChanged);

            // process master EAN properties
            var existingMasterEan = { locator: '', product_info: '' };
            if(data.matchingExistingProduct && data.matchingExistingProduct.master_ean)
            {
                existingMasterEan = data.matchingExistingProduct.master_ean;
            }
            var bestExistingEAN = existingMasterEan.locator;
            if(!bestExistingEAN) {
                bestExistingEAN = existingMasterEan.product_info;
            }

            var newMasterEan = { locator: '', product_info: '' };
            if(data.master_ean)
            {
                newMasterEan = data.master_ean;
            }
            var bestNewEAN = newMasterEan.locator;
            if(!bestNewEAN) {
                bestNewEAN = newMasterEan.product_info;
            }

            self.masterEan = new EditableField(bestNewEAN, bestExistingEAN, self.validateMasterEan, fieldChanged);

            self.useMasterOnLocator(data.master_ean.locator ? true : false);
            self.useMasterOnProductInfo(data.master_ean.product_info ? true : false);

            // process product name
            self.name = new EditableField(data.name, data.matchingExistingProduct?data.matchingExistingProduct.name:"", self.validateName, fieldChanged);

            // process product images
            var image = "";
            var originalImage = "";

            if(data.images && data.images.length > 0)
            {
                image = data.images[0];
            }

            if(data.matchingExistingProduct && data.matchingExistingProduct.images && data.matchingExistingProduct.images.length > 0)
            {
                originalImage = data.matchingExistingProduct.images[0];
            }

            self.image = new EditableField(image, originalImage, self.validateUrl, fieldChanged);

            // process product labels
            /*
            var label = "";
            var originalLabel = "";

            if(data.nutrition_labels && data.nutrition_labels.length > 0)
            {
                label = data.nutrition_labels[0];
            }

            if(data.matchingExistingProduct && data.matchingExistingProduct.nutrition_labels  && data.matchingExistingProduct.nutrition_labels .length > 0)
            {
                originalLabel = data.matchingExistingProduct.nutrition_labels[0];
            }

            self.label = new EditableField(label, originalLabel, self.validateUrl, fieldChanged);
            */
            self.label = new EditableField(data.nutrition_labels, data.matchingExistingProduct?data.matchingExistingProduct.nutrition_labels:"", self.generalValidation, fieldChanged);
            // process promo image
            var promoImage = "";
            var oringinalPromoImage = "";
            if(data.promo_images && data.promo_images.length > 0)
            {
                promoImage = data.promo_images[0];
            }

            if(data.matchingExistingProduct && data.matchingExistingProduct.promo_images && data.matchingExistingProduct.promo_images.length > 0)
            {
                oringinalPromoImage = data.matchingExistingProduct.promo_images[0];
            }

            self.promoImage = new EditableField(promoImage, oringinalPromoImage, self.validateUrl, fieldChanged);

            //TODO This probably should be wrapped in a function
            // process promo videos
            var promoVideo = "";
            var originalPromoVideo = "";
            if(data.promo_videos && data.promo_videos.length > 0)
            {
                promoVideo = data.promo_videos[0];
            }

            if(data.matchingExistingProduct && data.matchingExistingProduct.promo_videos && data.matchingExistingProduct.promo_videos.length > 0)
            {
                originalPromoVideo = data.matchingExistingProduct.promo_videos[0];
            }

            self.promoVideo = new EditableField(promoVideo, originalPromoVideo, self.validateUrl, fieldChanged);

            // process other properties
            self.backgroundStyle = new EditableField(data.image_style, data.matchingExistingProduct?data.matchingExistingProduct.image_style:"", self.generalValidation, fieldChanged);

            self.phone = new EditableField(data.phone_number, data.matchingExistingProduct?data.matchingExistingProduct.phone_number:"", self.validatePhone, fieldChanged);
            self.sms = new EditableField(data.sms_number, data.matchingExistingProduct?data.matchingExistingProduct.sms_number:"", self.validatePhone, fieldChanged);

            self.facebook = new EditableField(data.facebook_link, data.matchingExistingProduct?data.matchingExistingProduct.facebook_link:"", self.validateUrl, fieldChanged);
            self.twitter = new EditableField(data.twitter_link, data.matchingExistingProduct?data.matchingExistingProduct.twitter_link:"", self.validateUrl, fieldChanged);
            self.instagram = new EditableField(data.instagram_link, data.matchingExistingProduct?data.matchingExistingProduct.instagram_link:"", self.validateUrl, fieldChanged);

            self.faq = new EditableField(data.faq, data.matchingExistingProduct?data.matchingExistingProduct.faq:"", self.generalValidation, fieldChanged);
            self.ingredients = new EditableField(data.ingredients, data.matchingExistingProduct ? data.matchingExistingProduct.ingredients:"", self.generalValidation, fieldChanged);
            self.message = new EditableField(data.brand_message, data.matchingExistingProduct?data.matchingExistingProduct.brand_message:"", self.generalValidation, fieldChanged);
            self.instructions = new EditableField(data.instructions, data.matchingExistingProduct ? data.matchingExistingProduct.instructions:"", self.generalValidation, fieldChanged);
            self.auto_message = new EditableField(data.auto_message, data.matchingExistingProduct?data.matchingExistingProduct.auto_message:"", self.generalValidation, fieldChanged);

            self.searchable(!data.feature_weight ? false : (data.feature_weight=="1"));

            self.existingProduct = null;
            if(data.matchingExistingProduct) {
                self.existingProduct = data.matchingExistingProduct;
            }

            self.belongsToAnotherBrand = ko.observable((self.existingProduct && self.existingProduct.brand != self.brand));

            var ean_response = self.validateEan(data.ean);
            self.ean.isValid(ean_response.isValid);
	    self.ean.validationErrorMessage(ean_response.message);
	    self.is_duplicate = data.is_duplicate == "undefined" || data.is_duplicate == "" ? "no dup" : data.is_duplicate;
            self.isValid = ko.computed({
                owner: self,
                read:  () => {
                    return self.brand_name.isValid()
                        && self.ean.isValid()
                        && self.masterEan.isValid()
                        && self.upc.isValid()
                        && self.name.isValid()
                        && self.phone.isValid()
                        && self.sms.isValid()
                        && self.facebook.isValid()
                        && self.twitter.isValid()
                        && self.instagram.isValid();
                }
		});

	    self.isDuplicate = () => {
	        return self.is_duplicate == '"dup";
	    };

            self.doesMatch = () => {
		if(self.existingProduct == 'None') {
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
		values += '&' + self.auto_message;
		values += '&' + self.label.value()
		values += '&' + self.phone.value();
		values += '&' + self.sms.value();
		values += '&' + self.searchable.value();
		values += '&' + self.backgroundStyle.value();
		values += '&' + self.image.value();
		values += '&' + self.promoVideo.value();
		values += '&' + self.promoImage.value();

		oldValues += self.brand_name.originalValue();
		oldValues += '&' + self.ean.originalValue();
		oldValues += '&' + self.upc.originalValue();
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
                oldValues += '&' + self.searchable.originalValue();
		oldValues += '&' + self.backgroundStyle.originalValue();
		oldValues += '&' + self.image.originalValue();
		oldValues += '&' + self.promoVideo.originalValue();
                oldValues += '&' + self.promoImage.originalValue();
		
		return values == oldValues;
	    };	    

            self.existingBrandName = () => {
                return self.existingProduct?self.existingProduct.brand_name:'None';
            };
        }
    }

    export class ProductImporterViewModel {

        public totalCount: KnockoutObservable<number> = ko.observable(0);
        public newCount: KnockoutObservable<number> = ko.observable(0);
        public updateCount: KnockoutObservable<number> = ko.observable(0);
        public errorCount: KnockoutObservable<number> = ko.observable(0);
        public notUnderBrandCount: KnockoutObservable<number> = ko.observable(0);

        public importComplete: KnockoutObservable<boolean> = ko.observable(false);
        public importFailed: KnockoutObservable<boolean> = ko.observable(false);

        public saveComplete:  KnockoutObservable<boolean> = ko.observable(false);

        public countImported: KnockoutObservable<number> = ko.observable(0);
        public countUpdated: KnockoutObservable<number> = ko.observable(0);

        _onProductUploadComplete: Function;
        _onProductUploadFailed: Function;

        filterReset: Function;
        filterNew: Function;
        filterUpdate: Function;
        filterError: Function;
        filterBrandError: Function;

        brand: string = '';

        importedData: KnockoutObservableArray<ProductViewModel>;
        visibleData: KnockoutObservableArray<ProductViewModel>;

        public save: Function = () => {
            var self = this, expectedCount = 0, finishedCount = 0;
            for(var i in self.importedData())
            {
                var item = self.importedData()[i];
                if(item.isValid() && !item.isDuplicate())
                {
                    expectedCount++;

                    if(item.existingProduct == null)
                    {
                        self.countImported(self.countImported() +1);
                    }
                    if(item.existingProduct != null  && item.isDuplicate() == false && item.doesMatch() == false)
                    {
                        self.countUpdated(self.countUpdated() +1);
                    }
                }
                item.save(function() {
                    finishedCount++;

                    if(finishedCount >= expectedCount) {
                        self.saveComplete(true);
                    }
                });
            }
        };

        private onProductFieldChanged: Function = () => {
            var self = this;
            self.saveComplete(false);

            var errorCount = 0;
            self.visibleData().every(function(item: ProductViewModel){

                if(item.isValid() == false)
                {
                    errorCount++;

                }
                return true;
            });
            self.errorCount(errorCount);
        };

	private validateEans: Function = () => {
	    var self = this;
	    var response: IValidationResponse = { isValid: true, message: "" }; 
	    self.importedData().every(function(item: ProductViewModel) {
		if(!item.ean.isValid()) {
		    response.isValid = false;
		    response.message = "EAN is not valid";
		}
	    }

	    return response;

	};

        public addProduct: Function = () => {
            var self = this;
            var data: IProductData = {
                _id: null,
                name: "",
                ean: "",
                upc: "",
                brand: self.brand,
                master_ean: { locator: "", product_info: ""},
                brand_message: "",
                brand_name: "",
                facebook_link: "",
                instagram_link: "",
                twitter_link: "",
                faq: "",
                images: new Array<string>(),
                ingredients: "",
                instructions: "",
                auto_message: "",
                nutrition_labels: "",
                phone_number:  "",
                sms_number:  "",
                feature_weight:  "0",
                matchingExistingProduct: null,
                promo_images: new Array<string>(),
                promo_videos: new Array<string>(),
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

        constructor(brand){

            var self = this;

            self.brand = brand;

            self.importedData = ko.observableArray([]);
            self.visibleData = ko.observableArray([]);

            self._onProductUploadComplete = function(response) {
                self.importedData([]);
                self.visibleData([]);
                self.totalCount(0);
                self.newCount(0);
                self.updateCount(0);
                self.notUnderBrandCount(0);

                if(response.result.products.length == 0) {
                    alert('No products were imported. Warnings:\n' + response.result.warnings.join('\n'));
                    return;
                }

                if(response.result.warnings.length > 0) {
                    alert('Some warnings were given. Warnings:\n' + response.result.warnings.join('\n'));
                }

                for(var i in response.result.products)
                {
                    var item = response.result.products[i];
                    var product = new action.admin.brand.ProductViewModel(item, item.brand, self.onProductFieldChanged);

                    self.importedData.push(product);

                    //Increment import summary data
                    self.totalCount(self.totalCount()+1);

                    if(product.existingProduct == null) {
                        self.newCount(self.newCount() + 1);
		    } else if(product.existingProduct != null && product.isDuplicate() == false && product.doesMatch() == false) {
                            self.updateCount(self.updateCount()+1);
		    }
		    
		    //if(product.brand !== product.existingProduct.brand) {
		    if (typeof product.existingProduct != undefined && product.existingProduct != null && product.existingProduct.brand != null && product.brand !== product.existingProduct.brand) {
                            self.notUnderBrandCount(self.notUnderBrandCount()+1);
                    }
                }

                self.filterReset();

                self.importComplete(true);
                self.saveComplete(false);
            };

            self._onProductUploadFailed = function (error) {
                window.alert(error);
                self.importFailed(true);
            };

            self.importedData.subscribe(function(data){
                self.errorCount(0);

                data.every(function(item: ProductViewModel){

                    if(item.isValid() == false)
                    {
                        self.errorCount(self.errorCount()+1)
                    }
                    return true;
                });
	    });

            self.filterBrandError = function(){
                self.visibleData(
                    self.importedData().filter(function(item: ProductViewModel){
                        return item.belongsToAnotherBrand();
                    })
                );
            };

            self.filterError = function(){
                self.visibleData(
                    self.importedData().filter(function(item: ProductViewModel){
                        return item.isValid() == false;
                    })
                );
            };

            self.filterNew = function(){
                self.visibleData(
                    self.importedData().filter(function(item: ProductViewModel){
                        return item.existingProduct == null;
                    })
                );
            };

            self.filterUpdate = function(){
                self.visibleData(
                    self.importedData().filter(function(item: ProductViewModel){
                        return item.existingProduct != null && item.isDuplicate() == false && item.doesMatch() == false;
                    })
                );
            };

            self.filterReset = function(){
                self.visibleData(
                    self.importedData().slice(0)
                );
            };
        }
    }
}
