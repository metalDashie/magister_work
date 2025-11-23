import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ImportService } from './import.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ImportProfile } from '../../database/entities'

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  // ========== Import Profiles ==========

  @Get('profiles')
  async getProfiles(@Req() req: any) {
    return this.importService.getProfiles(req.user.userId)
  }

  @Get('profiles/:id')
  async getProfile(@Param('id') id: string) {
    return this.importService.getProfile(id)
  }

  @Post('profiles')
  async createProfile(@Body() data: Partial<ImportProfile>, @Req() req: any) {
    return this.importService.createProfile(data, req.user.userId)
  }

  @Put('profiles/:id')
  async updateProfile(@Param('id') id: string, @Body() data: Partial<ImportProfile>) {
    return this.importService.updateProfile(id, data)
  }

  @Delete('profiles/:id')
  async deleteProfile(@Param('id') id: string) {
    await this.importService.deleteProfile(id)
    return { message: 'Profile deleted successfully' }
  }

  // ========== CSV Import ==========

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewCSV(
    @UploadedFile() file: Express.Multer.File,
    @Body('profileId') profileId?: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    const fileContent = file.buffer.toString('utf-8')
    return this.importService.previewCSV(fileContent, profileId)
  }

  @Post('execute')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @UploadedFile() file: Express.Multer.File,
    @Body('profileId') profileId: string,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    if (!profileId) {
      throw new BadRequestException('Profile ID is required')
    }

    const fileContent = file.buffer.toString('utf-8')
    return this.importService.importProducts(fileContent, file.originalname, profileId, req.user.userId)
  }

  // ========== Import History ==========

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.importService.getImportHistory(req.user.userId)
  }

  @Get('history/:id')
  async getHistoryById(@Param('id') id: string) {
    return this.importService.getImportHistoryById(id)
  }
}
