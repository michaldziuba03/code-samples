import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FederatedAccount } from './FederatedAccount';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    picture: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    password?: string;

    @OneToMany(() => FederatedAccount, account => account.user)
    accounts: FederatedAccount[];
}
