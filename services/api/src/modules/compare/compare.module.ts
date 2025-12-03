import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CompareItem, Product } from '../../database/entities'
import { CompareService } from './compare.service'
import { CompareController } from './compare.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CompareItem, Product])],
  controllers: [CompareController],
  providers: [CompareService],
  exports: [CompareService],
})
export class CompareModule {}
