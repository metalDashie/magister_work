import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './user.entity'

export enum DeliveryType {
  NOVA_POSHTA_WAREHOUSE = 'nova_poshta_warehouse',
  NOVA_POSHTA_COURIER = 'nova_poshta_courier',
  SELF_PICKUP = 'self_pickup',
}

@Entity('delivery_addresses')
export class DeliveryAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({
    type: 'enum',
    enum: DeliveryType,
  })
  type: DeliveryType

  // Nova Poshta fields
  @Column({ name: 'city_ref', nullable: true })
  cityRef: string

  @Column({ name: 'city_name', nullable: true })
  cityName: string

  @Column({ name: 'warehouse_ref', nullable: true })
  warehouseRef: string

  @Column({ name: 'warehouse_description', nullable: true })
  warehouseDescription: string

  // Courier delivery fields
  @Column({ name: 'street_ref', nullable: true })
  streetRef: string

  @Column({ name: 'street_name', nullable: true })
  streetName: string

  @Column({ name: 'house_number', nullable: true })
  houseNumber: string

  @Column({ name: 'apartment_number', nullable: true })
  apartmentNumber: string

  // Contact information
  @Column({ name: 'recipient_name' })
  recipientName: string

  @Column({ name: 'recipient_phone' })
  recipientPhone: string

  @Column({ name: 'is_default', default: false })
  isDefault: boolean

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
