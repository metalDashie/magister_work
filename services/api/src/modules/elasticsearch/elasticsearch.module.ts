import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ElasticsearchService } from './elasticsearch.service'
import { ElasticsearchController } from './elasticsearch.controller'
import { Product } from '../../database/entities'

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ElasticsearchController],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService]
})
export class ElasticsearchModule {}
