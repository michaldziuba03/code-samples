export enum Providers {
    GOOGLE = 'google',
    GITHUB = 'github',
}

export interface LinkAccountOptions {
    email: string;
    name: string;
    picture: string;
    subject: string;
}

export interface GithubEmail {
    value: string;
    verified: boolean;
    primary: boolean;
}

export interface GoogleEmail {
    value: string;
    verified: boolean;
}

declare global {
    namespace Express {
        interface User {
            id: number;
        }

        interface Request {
            // @ts-ignore
            user: Express.User;
        }
    }
}