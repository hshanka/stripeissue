export module IAddCard {

    export interface Token {
        id: string;
    }

    export interface Source {
        id: string;
    }

    export interface User {
        id: string;
        email: string;
        connected_stripe_uid: string;
        platform_stripe_uid: string;
    }

    export interface CardObject {
        token: Token;
        source: Source;
        user: User;
    }

}