import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AttributesService } from './attributes.service'
import { AttributesController } from './attributes.controller'
import { Attribute } from '../../database/entities/attribute.entity'
import { ProductAttribute } from '../../database/entities/product-attribute.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Attribute, ProductAttribute])],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
