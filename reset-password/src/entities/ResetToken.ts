import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';

@Entity('reset_tokens')
export class ResetToken {
    @PrimaryColumn()
    token: string;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'user_id'})
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'token_expiry' })
    tokenExpiry: number;
}
