interface IProductData
{
    _id: string;
    ean: string; //1
    master_ean: IMasterEan; //1
    upc: string; //0
    name: string; //1
    brand: string; //0
    brand_message: string; //ALL CMs //
    brand_name: string;
    facebook_link: string; //WILKE Not in Astute Knowledge
    instagram_link: string; //2
    twitter_link: string; //2
    faq: string; //Brand Config
    images: string[]; //1 (allow one url)
    ingredients: string; // 2
    instructions: string; //2
    auto_message: string;
    nutrition_labels: string; //Image Url //2
    phone_number: string; //2
    sms_number: string; //2
    feature_weight: string; //searchable = 1 else 0
    promo_images: string[];
    promo_videos: string[];
    image_style: string;
    matchingExistingProduct: IProductData;
}

interface IMasterEan
{
    locator: string;
    product_info: string;
}

interface  IValidationResponse
{
    isValid: boolean;
    message: string;
}