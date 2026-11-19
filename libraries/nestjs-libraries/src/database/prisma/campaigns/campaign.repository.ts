import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CampaignRepository {
  constructor(private _prisma: PrismaRepository<'autoPostCampaign'>) {}

  async getCampaigns(orgId: string) {
    return (this._prisma.model as any).autoPostCampaign.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        _count: {
          select: { media: true },
        },
        runs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCampaign(orgId: string, id: string) {
    return (this._prisma.model as any).autoPostCampaign.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        media: {
          orderBy: { createdAt: 'desc' },
        },
        runs: {
          take: 30,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async createCampaign(orgId: string, data: any) {
    return (this._prisma.model as any).autoPostCampaign.create({
      data: {
        ...data,
        organizationId: orgId,
      },
    });
  }

  async updateCampaign(orgId: string, id: string, data: any) {
    return (this._prisma.model as any).autoPostCampaign.update({
      where: {
        id,
        organizationId: orgId,
      },
      data,
    });
  }

  async deleteCampaign(orgId: string, id: string) {
    return (this._prisma.model as any).autoPostCampaign.delete({
      where: {
        id,
        organizationId: orgId,
      },
    });
  }

  async changeActive(orgId: string, id: string, isActive: boolean) {
    return (this._prisma.model as any).autoPostCampaign.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        isActive,
      },
    });
  }

  async getCampaignMedia(campaignId: string) {
    return (this._prisma.model as any).autoPostCampaignMedia.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async addMedia(campaignId: string, data: { name?: string; url: string; thumbnail?: string; type?: string }) {
    return (this._prisma.model as any).autoPostCampaignMedia.create({
      data: {
        ...data,
        campaignId,
        originalCampaignId: campaignId,
      },
    });
  }

  async deleteMedia(campaignId: string, mediaId: string) {
    return (this._prisma.model as any).autoPostCampaignMedia.deleteMany({
      where: {
        id: mediaId,
        campaignId,
      },
    });
  }

  async recycleMediaFromOriginal(campaignId: string) {
    const originalMedia = await (this._prisma.model as any).autoPostCampaignMedia.findMany({
      where: {
        originalCampaignId: campaignId,
      },
    });

    if (originalMedia.length === 0) return 0;

    // Move them back into this campaign
    await (this._prisma.model as any).autoPostCampaignMedia.updateMany({
      where: {
        originalCampaignId: campaignId,
      },
      data: {
        campaignId,
      },
    });

    return originalMedia.length;
  }

  async getDueCampaigns(currentTime: string, now: Date) {
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    return (this._prisma.model as any).autoPostCampaign.findMany({
      where: {
        isActive: true,
        OR: [
          { lockedAt: null },
          { lockedAt: { lt: tenMinutesAgo } },
        ],
        AND: [
          {
            OR: [
              { nextRunAt: { lte: now } },
              {
                nextRunAt: null,
                postingTime: currentTime,
              },
            ],
          },
        ],
      },
      include: {
        media: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async lockCampaign(id: string) {
    return (this._prisma.model as any).autoPostCampaign.update({
      where: { id },
      data: { lockedAt: new Date() },
    });
  }

  async unlockCampaign(id: string, nextRunAt?: Date | null, failureCount = 0) {
    return (this._prisma.model as any).autoPostCampaign.update({
      where: { id },
      data: {
        lockedAt: null,
        nextRunAt: nextRunAt || undefined,
        lastPostedAt: new Date(),
        failureCount,
      },
    });
  }

  async createRun(campaignId: string, data: any) {
    return (this._prisma.model as any).autoPostCampaignRun.create({
      data: {
        ...data,
        campaignId,
      },
    });
  }
}
