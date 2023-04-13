
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { ResetToken } from '../entities/ResetToken';

export const sampleDataSource = new DataSource({
    type: 'sqlite',
    database: "sample.db",
    entities: [User, ResetToken],
    synchronize: true,
});

export const userRepository = sampleDataSource.getRepository(User);
export const resetTokenRepository = sampleDataSource.getRepository(ResetToken);

export async function startDatabase() {
    await sampleDataSource.initialize();
}
