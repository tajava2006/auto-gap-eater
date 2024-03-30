import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'user_balance' })
export class UserBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'total_balance', length: 256, nullable: false })
  totalBalance: string;

  @Column({ name: 'frozen_balance', length: 256, nullable: false })
  frozenBalance: string;

  @Column({ name: 'available_balance', length: 256, nullable: false })
  availableBalance: string;
}
