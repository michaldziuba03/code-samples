import {Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import { FederatedAccount } from "./FederatedAccount";

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

    @Column({ nullable: true })
    password?: string;

    @OneToMany(() => FederatedAccount, account => account.user)
    accounts: FederatedAccount[];
}
