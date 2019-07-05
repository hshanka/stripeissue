export interface Payment {
    token:      Token;
    source:     Source;
    order:      Order;
    rememberMe: boolean;
    user:       Users;
}

export interface Order {
    id:       string;
    amount:   string;
    currency: string;
}

export interface Token {
    id: string;
}

export interface Source {
    id: string;
}

export interface Users {
    id:        string;
    email:     string;
    connected_stripe_uid: string;
    platform_stripe_uid: string;
}

// example model
// {
// 	"token":{
// 		"id":"tok_ElfGBEowT6P7F4QuV5cLZy6"
// 	},
// 	"source":{
// 		"id": "src_1ElfGBEowT6P7F4QuV5cLZy6"
// 	},
// 	"order":{
// 		"id":"RALP-OI-817-1558280720390",
// 		"amount":"500",
// 		"currency":"usd"
// 	},
// 	"rememberMe":false,
// 	"user":{
// 		"id":"badqhaMb93QyUHUnZohKU0iv1vj1",
// 		"email":"testx12@test.com"	,
// 		"stripe_uid":"cus_FGBcxLhu0GvcDh"
// 	}
// }