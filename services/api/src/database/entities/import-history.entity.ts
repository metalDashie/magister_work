import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './user.entity'
import { ImportProfile } from './import-profile.entity'

export interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
  mapped: number
  errors: Array<{
    row: number
    field?: string
    message: string
  }>
}

@Entity('import_history')
export class ImportHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  fileName: string

  @Column({ type: 'uuid', nullable: true })
  profileId: string

  @ManyToOne(() => ImportProfile)
  @JoinColumn({ name: 'profileId' })
  profile: ImportProfile

  @Column({ type: 'uuid' })
  importedById: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'importedById' })
  importedBy: User

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string

  @Column({ type: 'jsonb' })
  stats: ImportStats

  @Column({ type: 'text', nullable: true })
  errorMessage: string

  @CreateDateColumn()
  createdAt: Date

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date
}
