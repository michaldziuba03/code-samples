
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { FederatedAccount } from '../entities/FederatedAccount';

export const sampleDataSource = new DataSource({
    type: 'sqlite',
    database: "sample.db",
    entities: [User, FederatedAccount],
    synchronize: true,
});

export const userRepository = sampleDataSource.getRepository(User);
export const federatedAccountRepository = sampleDataSource.getRepository(FederatedAccount);

export async function startDatabase() {
    await sampleDataSource.initialize();
}
