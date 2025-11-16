import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { ImportController } from './import.controller'
import { ImportService } from './import.service'
import {
  ImportProfile,
  ImportHistory,
  Product,
  Category,
} from '../../database/entities'

@Module({
  imports: [
    TypeOrmModule.forFeature([ImportProfile, ImportHistory, Product, Category]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(csv|txt)$/)) {
          return callback(new Error('Only CSV files are allowed'), false)
        }
        callback(null, true)
      },
    }),
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
