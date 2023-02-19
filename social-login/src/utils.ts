import { createHash } from 'crypto';
import { GithubEmail, GoogleEmail } from './types';

export function createGravatar(email: string) {
    const hash = createHash('md5').update(email).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}`;
}

interface Picture {
    value: string;
}

export function getPicture(email: string, photosArray?: Picture[]) {
    if (photosArray && photosArray.length) {
        return photosArray[0].value;
    }

    return createGravatar(email);
}

export function getGithubEmail(emails?: GithubEmail[]) {
    if (!emails) {
        return;
    }

    const primaryEmail = emails.find(email => email.primary && email.verified);
    if (!primaryEmail) {
        return;
    }

    return primaryEmail.value;
}

export function getGoogleEmail(emails?: GoogleEmail[]) {
    if (!emails) {
        return;
    }

    const verifiedEmail = emails.find(email => email.verified);
    if (!verifiedEmail) {
        return;
    }

    return verifiedEmail.value;
}
