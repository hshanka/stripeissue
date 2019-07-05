export interface HomeProductItem {
    documentId: string;
    storeId: string;
    productUPC: string;
    productName: string;
    productNameSearch : string;
    productImg: string;
    productRegularPrice: string;
    productSalesPrice: string;
    status: string;
    curbsideEnabled : boolean;
    shoppingModeEnabled : boolean;
    curbsideQty : number;
    shoppingModeQty : number;
}