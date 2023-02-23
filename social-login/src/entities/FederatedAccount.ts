import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Unique
} from 'typeorm';
import { User } from './User';
import { Providers } from '../types';

@Entity('federated_accounts')
@Unique(['provider', 'subject'])
export class FederatedAccount {
    @PrimaryColumn()
    provider: Providers;

    @PrimaryColumn()
    subject: string; // id from provider account

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'user_id'})
    user: User;

    @Column({ name: 'user_id' })
    userId: number;
}
