import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum BannerType {
  MODAL = 'modal',
  TOP_BAR = 'top_bar',
  SIDEBAR = 'sidebar',
}

export enum BannerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
}

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string

  @Column({ name: 'button_text', nullable: true })
  buttonText: string

  @Column({ name: 'button_url', nullable: true })
  buttonUrl: string

  @Column({ name: 'background_color', default: '#ffffff' })
  backgroundColor: string

  @Column({ name: 'text_color', default: '#000000' })
  textColor: string

  @Column({
    type: 'enum',
    enum: BannerType,
    default: BannerType.MODAL,
  })
  type: BannerType

  @Column({
    type: 'enum',
    enum: BannerStatus,
    default: BannerStatus.INACTIVE,
  })
  status: BannerStatus

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null

  @Column({ default: 0 })
  priority: number

  @Column({ name: 'show_once', default: false })
  showOnce: boolean

  @Column({ name: 'dismissible', default: true })
  dismissible: boolean

  @Column({ name: 'page_target', nullable: true })
  pageTarget: string // e.g., 'home', 'products', 'all'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
