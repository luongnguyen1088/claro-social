import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { CampaignService } from '@gitroom/nestjs-libraries/database/prisma/campaigns/campaign.service';

@ApiTags('Campaigns')
@Controller('/campaigns')
export class CampaignsController {
  constructor(private _campaignService: CampaignService) {}

  @Get('/')
  async getCampaigns(@GetOrgFromRequest() org: Organization) {
    return this._campaignService.getCampaigns(org.id);
  }

  @Get('/:id')
  async getCampaign(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._campaignService.getCampaign(org.id, id);
  }

  @Post('/')
  async createCampaign(@GetOrgFromRequest() org: Organization, @Body() body: any) {
    return this._campaignService.createCampaign(org.id, body);
  }

  @Put('/:id')
  async updateCampaign(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this._campaignService.updateCampaign(org.id, id, body);
  }

  @Delete('/:id')
  async deleteCampaign(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._campaignService.deleteCampaign(org.id, id);
  }

  @Post('/:id/active')
  async toggleActive(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean
  ) {
    return this._campaignService.changeActive(org.id, id, isActive);
  }

  @Post('/:id/media')
  async addMedia(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: { name?: string; url: string; thumbnail?: string; type?: string }
  ) {
    return this._campaignService.addMedia(id, body);
  }

  @Delete('/:id/media/:mediaId')
  async deleteMedia(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string
  ) {
    return this._campaignService.deleteMedia(id, mediaId);
  }

  @Post('/:id/trigger')
  async triggerCampaign(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._campaignService.runCampaign(id, org.id);
  }

  @Get('/cron/tick')
  async tickCron(
    @Headers('x-cron-secret') headerSecret: string,
    @Query('secret') querySecret: string
  ) {
    const expected = process.env.AUTO_POST_CRON_SECRET || 'claro_secure_cron_secret_123456';
    const provided = headerSecret || querySecret;
    if (expected && provided !== expected) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return this._campaignService.tickCron();
  }
}
