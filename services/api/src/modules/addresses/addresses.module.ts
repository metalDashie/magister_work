import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserAddress } from '../../database/entities'
import { AddressesService } from './addresses.service'
import { AddressesController } from './addresses.controller'

@Module({
  imports: [TypeOrmModule.forFeature([UserAddress])],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
