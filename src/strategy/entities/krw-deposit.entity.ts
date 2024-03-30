import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'krw_deposit' })
export class KrwDeposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'amount', nullable: false })
  amount: number;

  @Column({ name: 'created_at', nullable: false })
  createdAt: Date;
}
