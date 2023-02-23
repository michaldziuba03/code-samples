import { LinkAccountOptions, Providers } from './types';
import {
    federatedAccountRepository,
    sampleDataSource,
    userRepository
} from './setup/db';

export async function findLinkedAccount(provider: Providers, subject: string) {
    const federatedAccount = await federatedAccountRepository.findOneBy({
        provider, subject
    });

    if (!federatedAccount) {
        return;
    }

    return federatedAccount.userId;
}

export async function linkAccount(provider: Providers, options: LinkAccountOptions) {
    const { subject, picture, name, email } = options;
    const user = await userRepository.findOneBy({ email });
    if (user && !user.isVerified) {
        /*
          IMPORTANT: Abort linking account process, to prevent pre-Authentication Account Takeover attack.
          If user already exists in our database and their email address is unverified, you should disallow social account linking.
        */
        return;
    }

    if (user) {
        await federatedAccountRepository.save({
            subject,
            provider,
            userId: user.id,
        });

        return user.id;
    }

    return await sampleDataSource.transaction(async t => {
        const newUser = userRepository.create({
            name,
            email,
            picture,
            // as we deny unverified emails from social providers I think we can create user as verified:
            isVerified: true,
        });

        const createdUser = await t.save(newUser);
        const newFederatedAccount = federatedAccountRepository.create({
            userId: createdUser.id,
            provider,
            subject,
        });

        await t.save(newFederatedAccount);
        return createdUser.id;
    });
}
