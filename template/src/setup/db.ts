
import { DataSource } from 'typeorm';
import { User } from '../entities/User';

export const sampleDataSource = new DataSource({
    type: 'sqlite',
    database: "sample.db",
    entities: [User],
    synchronize: true,
});

export const userRepository = sampleDataSource.getRepository(User);

export async function startDatabase() {
    await sampleDataSource.initialize();
}
