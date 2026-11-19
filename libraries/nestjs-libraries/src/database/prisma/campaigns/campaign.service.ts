import { Injectable, Logger } from '@nestjs/common';
import { CampaignRepository } from './campaign.repository';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private _campaignRepo: CampaignRepository,
    private _postsService: PostsService,
    private _integrationService: IntegrationService
  ) {}

  getCampaigns(orgId: string) {
    return this._campaignRepo.getCampaigns(orgId);
  }

  getCampaign(orgId: string, id: string) {
    return this._campaignRepo.getCampaign(orgId, id);
  }

  async createCampaign(orgId: string, body: any) {
    const times = this.parseArray(body.postingTimes) || (body.postingTime ? [body.postingTime] : ['11:45', '19:45']);
    const days = this.parseArray(body.scheduleDays) || [0, 1, 2, 3, 4, 5, 6];
    const nextRun = this.calculateNextRun(times, days);

    return this._campaignRepo.createCampaign(orgId, {
      ...body,
      postingTime: times[0] || '11:45',
      postingTimes: JSON.stringify(times),
      scheduleDays: JSON.stringify(days),
      nextRunAt: nextRun,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });
  }

  async updateCampaign(orgId: string, id: string, body: any) {
    const times = this.parseArray(body.postingTimes) || (body.postingTime ? [body.postingTime] : undefined);
    const days = this.parseArray(body.scheduleDays);
    const updateData: any = { ...body };

    if (times) {
      updateData.postingTime = times[0];
      updateData.postingTimes = JSON.stringify(times);
    }
    if (days) {
      updateData.scheduleDays = JSON.stringify(days);
    }
    if (times && days) {
      updateData.nextRunAt = this.calculateNextRun(times, days);
    }

    return this._campaignRepo.updateCampaign(orgId, id, updateData);
  }

  deleteCampaign(orgId: string, id: string) {
    return this._campaignRepo.deleteCampaign(orgId, id);
  }

  changeActive(orgId: string, id: string, isActive: boolean) {
    return this._campaignRepo.changeActive(orgId, id, isActive);
  }

  addMedia(campaignId: string, media: { name?: string; url: string; thumbnail?: string; type?: string }) {
    return this._campaignRepo.addMedia(campaignId, media);
  }

  deleteMedia(campaignId: string, mediaId: string) {
    return this._campaignRepo.deleteMedia(campaignId, mediaId);
  }

  calculateNextRun(timesArr: string[], daysArr: number[] = [0, 1, 2, 3, 4, 5, 6], fromDate = new Date()): Date {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const candidateDate = new Date(fromDate.getTime() + dayOffset * 24 * 3600 * 1000);
      const vnCandidate = new Date(candidateDate.getTime() + 7 * 3600 * 1000);
      const dayOfWeek = vnCandidate.getUTCDay();

      if (!daysArr.includes(dayOfWeek)) continue;

      for (const timeStr of timesArr) {
        const [h, m] = timeStr.split(':').map(Number);
        const slotVn = new Date(
          Date.UTC(
            vnCandidate.getUTCFullYear(),
            vnCandidate.getUTCMonth(),
            vnCandidate.getUTCDate(),
            h - 7,
            m,
            0,
            0
          )
        );

        if (slotVn.getTime() > fromDate.getTime() + 60 * 1000) {
          return slotVn;
        }
      }
    }
    return new Date(fromDate.getTime() + 2 * 3600 * 1000);
  }

  async generateCaptionWithAI(campaign: any, mediaItem: any): Promise<{ title: string; content: string }> {
    const fostaUrl = process.env.FOSTA_AI_URL || 'https://codex.fosta.app/v1';
    const fostaKey = process.env.FOSTA_API_KEY || 'sk-fosta-internal';
    const model = process.env.FOSTA_AI_MODEL || 'gpt-6-sol';

    const systemPrompt = `Bạn là Giám đốc Sáng tạo Nội dung Đa kênh (Social Growth Expert).
Nhiệm vụ: Viết bài đăng hấp dẫn theo tiêu chuẩn từng mạng xã hội cho chiến dịch "${campaign.name}".
Yêu cầu:
- Brand Voice: ${campaign.brandVoice || 'Chuyên nghiệp, lôi cuốn, dễ hiểu'}
- Framework: ${campaign.copywritingFramework || 'PAS (Problem - Agitate - Solution)'}
- Độ dài: ${campaign.contentLength || 'Vừa phải'}
- Hashtags: ${campaign.hashtags || '#claro #learning #trending'}
- Tiêu đề YouTube: Ngắn gọn dưới 100 ký tự, có hook kích thích tò mò hoặc nghịch lý toán học/tư duy.
- Không dùng các từ cấm: ${campaign.forbiddenWords || 'none'}
Trả về định dạng JSON:
{
  "title": "Tiêu đề video / bài viết",
  "content": "Nội dung bài viết hoàn chỉnh kèm emoji và hashtags"
}`;

    const userPrompt = `Media cần đăng: "${mediaItem?.name || 'Video bài học giá trị'}"
Prompt định hướng của chiến dịch: "${campaign.notePrompt || 'Chia sẻ kiến thức bổ ích'}"`;

    try {
      const resp = await fetch(`${fostaUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${fostaKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!resp.ok) {
        throw new Error(`AI API status: ${resp.status}`);
      }

      const data = await resp.json();
      const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');
      return {
        title: parsed.title || mediaItem?.name || campaign.name,
        content: parsed.content || `${mediaItem?.name || campaign.name}\n\n${campaign.hashtags || ''}`,
      };
    } catch (err: any) {
      this.logger.warn(`AI generation failed, fallback to default copy: ${err.message}`);
      return {
        title: mediaItem?.name || campaign.name,
        content: `${mediaItem?.name || campaign.name}\n\n${campaign.hashtags || ''}`,
      };
    }
  }

  async runCampaign(campaignId: string, orgId?: string) {
    const campaign = await this._campaignRepo.getCampaign(orgId || '', campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    let mediaList = await this._campaignRepo.getCampaignMedia(campaignId);
    if (mediaList.length === 0 && campaign.recycleMedia) {
      await this._campaignRepo.recycleMediaFromOriginal(campaignId);
      mediaList = await this._campaignRepo.getCampaignMedia(campaignId);
    }

    if (mediaList.length === 0) {
      this.logger.warn(`Campaign ${campaign.name} has no media in queue.`);
      return { success: false, reason: 'EMPTY_MEDIA' };
    }

    const currentMedia = mediaList[0];
    const generated = await this.generateCaptionWithAI(campaign, currentMedia);

    // Parse target channels (Integration IDs)
    const channelIds: string[] = this.parseArray(campaign.channels) || [];
    const integrations = await this._integrationService.getIntegrationsList(campaign.organizationId);
    const targetIntegrations = channelIds.length > 0
      ? integrations.filter((i) => channelIds.includes(i.id))
      : integrations;

    if (targetIntegrations.length === 0) {
      this.logger.warn(`Campaign ${campaign.name} has no matching integrations connected.`);
      return { success: false, reason: 'NO_CHANNELS' };
    }

    // Schedule or publish through Postiz PostsService
    const postDate = new Date().toISOString();
    const isApproval = campaign.publishMode === 'approval';

    const postPayload = {
      date: postDate,
      order: makeId(10),
      shortLink: false,
      type: (isApproval ? 'draft' : 'now') as any,
      tags: [],
      posts: targetIntegrations.map((i) => ({
        settings: {
          __type: i.providerIdentifier as any,
          title: generated.title,
          tags: [],
          subreddit: [],
        },
        group: makeId(10),
        integration: { id: i.id },
        value: [
          {
            id: makeId(10),
            delay: 0,
            content: generated.content,
            image: currentMedia.url
              ? [
                  {
                    id: currentMedia.id,
                    name: currentMedia.name || makeId(10),
                    path: currentMedia.url,
                    organizationId: campaign.organizationId,
                  },
                ]
              : [],
          },
        ],
      })),
    };

    const createdPost = await this._postsService.createPost(campaign.organizationId, postPayload, 'AUTOPOST');

    // Record run log
    await this._campaignRepo.createRun(campaign.id, {
      status: isApproval ? 'awaiting_approval' : 'published',
      content: generated.content,
      mediaUrl: currentMedia.url,
      platforms: JSON.stringify(targetIntegrations.map((i) => i.providerIdentifier)),
      postizPostId: (createdPost as any)?.id || null,
      publishedAt: isApproval ? null : new Date(),
    });

    // Advance media item (delete from active queue)
    await this._campaignRepo.deleteMedia(campaign.id, currentMedia.id);

    // Calculate next run date
    const times = this.parseArray(campaign.postingTimes) || [campaign.postingTime || '11:45'];
    const days = this.parseArray(campaign.scheduleDays) || [0, 1, 2, 3, 4, 5, 6];
    const nextRun = this.calculateNextRun(times, days);

    await this._campaignRepo.unlockCampaign(campaign.id, nextRun, 0);

    return {
      success: true,
      title: generated.title,
      channelsCount: targetIntegrations.length,
      nextRunAt: nextRun,
    };
  }

  async tickCron() {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const hh = String(vnNow.getUTCHours()).padStart(2, '0');
    const mm = String(vnNow.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    const dueCampaigns = await this._campaignRepo.getDueCampaigns(currentTime, now);
    const results: any[] = [];

    for (const campaign of dueCampaigns) {
      try {
        await this._campaignRepo.lockCampaign(campaign.id);
        const res = await this.runCampaign(campaign.id, campaign.organizationId);
        results.push({ campaign: campaign.name, status: 'SUCCESS', ...res });
      } catch (err: any) {
        this.logger.error(`Error executing campaign ${campaign.name}: ${err.message}`);
        const nextTimes = this.parseArray(campaign.postingTimes) || ['11:45', '19:45'];
        const nextDays = this.parseArray(campaign.scheduleDays) || [0, 1, 2, 3, 4, 5, 6];
        const nextRun = this.calculateNextRun(nextTimes, nextDays);
        await this._campaignRepo.unlockCampaign(campaign.id, nextRun, (campaign.failureCount || 0) + 1);
        results.push({ campaign: campaign.name, status: 'ERROR', error: err.message });
      }
    }

    return { time: currentTime, processed: results.length, results };
  }

  private parseArray(val: any): any[] | null {
    if (!val) return null;
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
