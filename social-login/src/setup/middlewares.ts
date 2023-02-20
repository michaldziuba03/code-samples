import { NextFunction, Request, Response } from 'express';

export function authenticatedOnly(req: Request, res: Response, next: NextFunction) {
    if (req.isUnauthenticated()) {
        return res.redirect('/auth/login');
    }

    next();
}

export function guestOnly(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return res.redirect('/me');
    }

    next();
}
