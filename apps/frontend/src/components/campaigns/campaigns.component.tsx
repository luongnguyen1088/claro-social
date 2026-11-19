'use client';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import clsx from 'clsx';
import useSWR from 'swr';

export const CampaignsComponent: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'no_media'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'media' | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    notePrompt: '',
    postingTimes: '11:45, 19:45',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    recycleMedia: true,
    publishMode: 'auto',
    brandVoice: 'Chuyên nghiệp, lôi cuốn, dễ hiểu',
    hashtags: '#claro #learning #trending',
    copywritingFramework: 'pas',
    channels: [] as string[],
  });

  // Media upload input
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaName, setNewMediaName] = useState('');

  // SWR Fetch Campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      const res = await (await fetch('/campaigns')).json();
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }, [fetch]);

  const { data: campaigns = [], mutate, isLoading } = useSWR('/campaigns', loadCampaigns, {
    refreshInterval: 30000,
  });

  // Fetch Integrations (Connected social accounts)
  const loadIntegrations = useCallback(async () => {
    try {
      const res = await (await fetch('/integrations')).json();
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }, [fetch]);

  const { data: integrations = [] } = useSWR('/integrations', loadIntegrations);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 600);
    toaster.show('Đã cập nhật dữ liệu mới nhất!', 'success');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c: any) => c.isActive).length;
    const totalMedia = campaigns.reduce((acc: number, c: any) => acc + (c._count?.media || 0), 0);
    const earliestNext = campaigns
      .filter((c: any) => c.isActive && c.nextRunAt)
      .map((c: any) => new Date(c.nextRunAt).getTime())
      .sort((a: number, b: number) => a - b)[0];

    let nextRunText = 'Chưa lên lịch';
    if (earliestNext) {
      const d = new Date(earliestNext + 7 * 3600 * 1000);
      nextRunText = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} (VN)`;
    }

    return {
      total,
      active,
      paused: total - active,
      totalMedia,
      channelsCount: integrations.length,
      nextRunText,
    };
  }, [campaigns, integrations]);

  // Filtering
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c: any) => {
      const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notePrompt?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'active') return c.isActive;
      if (statusFilter === 'inactive') return !c.isActive;
      if (statusFilter === 'no_media') return c.isActive && (c._count?.media || 0) === 0;
      return true;
    });
  }, [campaigns, searchQuery, statusFilter]);

  const handleToggleActive = async (c: any) => {
    try {
      await fetch(`/campaigns/${c.id}/active`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      await mutate();
      toaster.show(`Đã ${!c.isActive ? 'bật' : 'tắt'} chiến dịch "${c.name}"`, 'success');
    } catch {
      toaster.show('Lỗi khi đổi trạng thái', 'warning');
    }
  };

  const handleTriggerNow = async (c: any) => {
    try {
      toaster.show(`Đang kích hoạt chiến dịch "${c.name}" qua AI...`, 'warning');
      const res = await (await fetch(`/campaigns/${c.id}/trigger`, { method: 'POST' })).json();
      if (res.success) {
        toaster.show(`Đã tạo bài thành công: "${res.title}"`, 'success');
        await mutate();
      } else {
        toaster.show(`Kích hoạt thất bại: ${res.reason || 'Lỗi không xác định'}`, 'warning');
      }
    } catch {
      toaster.show('Lỗi khi kích hoạt chiến dịch', 'warning');
    }
  };

  const handleDeleteCampaign = async (c: any) => {
    if (!confirm(`Bạn có chắc muốn xóa chiến dịch "${c.name}" không?`)) return;
    try {
      await fetch(`/campaigns/${c.id}`, { method: 'DELETE' });
      toaster.show(`Đã xóa chiến dịch "${c.name}"`, 'success');
      await mutate();
    } catch {
      toaster.show('Lỗi khi xóa chiến dịch', 'warning');
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      notePrompt: '',
      postingTimes: '11:45, 19:45',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
      recycleMedia: true,
      publishMode: 'auto',
      brandVoice: 'Chuyên nghiệp, lôi cuốn, dễ hiểu',
      hashtags: '#claro #learning #trending',
      copywritingFramework: 'pas',
      channels: integrations.map((i: any) => i.id),
    });
    setActiveModal('create');
  };

  const openEditModal = (c: any) => {
    setSelectedCampaign(c);
    let times = '11:45, 19:45';
    try {
      const parsed = JSON.parse(c.postingTimes);
      if (Array.isArray(parsed)) times = parsed.join(', ');
    } catch {
      times = c.postingTime || '11:45';
    }

    let days = [0, 1, 2, 3, 4, 5, 6];
    try {
      const parsed = JSON.parse(c.scheduleDays);
      if (Array.isArray(parsed)) days = parsed;
    } catch {}

    let channels: string[] = [];
    try {
      const parsed = JSON.parse(c.channels);
      if (Array.isArray(parsed)) channels = parsed;
    } catch {}

    setFormData({
      name: c.name || '',
      notePrompt: c.notePrompt || '',
      postingTimes: times,
      scheduleDays: days,
      recycleMedia: c.recycleMedia ?? true,
      publishMode: c.publishMode || 'auto',
      brandVoice: c.brandVoice || 'Chuyên nghiệp, lôi cuốn, dễ hiểu',
      hashtags: c.hashtags || '#claro #learning #trending',
      copywritingFramework: c.copywritingFramework || 'pas',
      channels,
    });
    setActiveModal('edit');
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toaster.show('Vui lòng nhập tên chiến dịch', 'warning');
      return;
    }

    const timesArr = formData.postingTimes.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...formData,
      postingTimes: timesArr,
      scheduleDays: formData.scheduleDays,
      channels: formData.channels,
    };

    try {
      if (activeModal === 'create') {
        await fetch('/campaigns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toaster.show('Đã tạo chiến dịch nuôi kênh mới!', 'success');
      } else if (activeModal === 'edit' && selectedCampaign) {
        await fetch(`/campaigns/${selectedCampaign.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toaster.show('Đã cập nhật chiến dịch!', 'success');
      }
      setActiveModal(null);
      await mutate();
    } catch {
      toaster.show('Lỗi khi lưu chiến dịch', 'warning');
    }
  };

  const openMediaModal = async (c: any) => {
    setSelectedCampaign(c);
    setActiveModal('media');
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;
    try {
      await fetch(`/campaigns/${selectedCampaign.id}/media`, {
        method: 'POST',
        body: JSON.stringify({
          url: newMediaUrl.trim(),
          name: newMediaName.trim() || 'Media file',
          type: newMediaUrl.includes('.mp4') ? 'video' : 'image',
        }),
      });
      setNewMediaUrl('');
      setNewMediaName('');
      toaster.show('Đã thêm media vào hàng đợi!', 'success');
      await mutate();
      // refresh selected campaign
      const updated = await (await fetch(`/campaigns/${selectedCampaign.id}`)).json();
      setSelectedCampaign(updated);
    } catch {
      toaster.show('Lỗi khi thêm media', 'warning');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await fetch(`/campaigns/${selectedCampaign.id}/media/${mediaId}`, { method: 'DELETE' });
      toaster.show('Đã xóa media khỏi hàng đợi!', 'success');
      await mutate();
      const updated = await (await fetch(`/campaigns/${selectedCampaign.id}`)).json();
      setSelectedCampaign(updated);
    } catch {
      toaster.show('Lỗi khi xóa media', 'warning');
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <span>⚡ Social Growth Studio</span>
            <span>•</span>
            <span>Postiz Native</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Nuôi Kênh & Auto-Post Đa Nền Tảng
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Tự động tạo bài bằng Fosta AI, lên lịch theo khung giờ vàng và phân phối chéo đa kênh (YouTube, Facebook, TikTok...).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>✨</span> Tạo Chiến Dịch AI
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs rounded-xl border border-border/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className={clsx(isRefreshing && 'animate-spin')}>🔄</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Chiến Dịch Nuôi Kênh</span>
            <span className="text-emerald-500 font-extrabold">{stats.active} Đang chạy</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground font-semibold">chiến dịch</span>
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            {stats.paused > 0 ? `⚠️ ${stats.paused} chiến dịch đang tạm dừng` : '🟢 100% chiến dịch đang hoạt động'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Kho Media Sẵn Sàng</span>
            <span className="text-indigo-400 font-extrabold">Queue</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{stats.totalMedia}</span>
            <span className="text-xs text-muted-foreground font-semibold">media clips</span>
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            Sẵn sàng phát hành theo giờ vàng
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Mạng Xã Hội Đã Nối</span>
            <span className="text-sky-400 font-extrabold">Channels</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{stats.channelsCount}</span>
            <span className="text-xs text-muted-foreground font-semibold">tài khoản</span>
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            YouTube, Facebook, TikTok, X...
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Engine Tự Động</span>
            <span className="text-emerald-500 font-extrabold">● Trực chiến</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats.nextRunText}</span>
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            Kế tiếp quét theo giờ Việt Nam
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card/60 border border-border/50">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm kiếm chiến dịch, prompt..."
            className="px-3.5 py-1.5 text-xs rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/40 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={clsx('px-2.5 py-1 rounded-lg font-bold transition-all', statusFilter === 'all' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground')}
            >
              Tất cả ({campaigns.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={clsx('px-2.5 py-1 rounded-lg font-bold transition-all', statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground')}
            >
              ⚡ Đang chạy ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={clsx('px-2.5 py-1 rounded-lg font-bold transition-all', statusFilter === 'inactive' ? 'bg-zinc-700 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground')}
            >
              ⏸️ Tạm dừng ({stats.paused})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end md:self-auto bg-background/80 p-1 rounded-xl border border-border/40">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx('px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
          >
            <span>🗂️</span> Thẻ Bento
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={clsx('px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1', viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
          >
            <span>📋</span> Bảng Dày Đặc
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && !isLoading && (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-3xl bg-card/30 space-y-3">
          <div className="text-4xl">🚀</div>
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy chiến dịch nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Hãy bắt đầu tạo chiến dịch nuôi kênh đầu tiên trên Postiz để tự động hóa đăng bài mạng xã hội.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-primary/90"
          >
            Tạo Chiến Dịch Ngay
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCampaigns.map((c: any) => {
            const times = (() => {
              try {
                const parsed = JSON.parse(c.postingTimes);
                return Array.isArray(parsed) ? parsed : [c.postingTime || '11:45'];
              } catch {
                return [c.postingTime || '11:45'];
              }
            })();

            const mediaCount = c._count?.media || 0;
            const nextRunFormatted = c.nextRunAt
              ? new Date(new Date(c.nextRunAt).getTime() + 7 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16)
              : 'Chưa có lịch';

            return (
              <div
                key={c.id}
                className="bg-card rounded-2xl border border-border/60 hover:border-primary/40 transition-all duration-200 shadow-sm p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                        🎬
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-foreground truncate hover:text-primary cursor-pointer" onClick={() => openEditModal(c)}>
                          {c.name}
                        </h4>
                        <div className="text-[11px] text-muted-foreground">
                          {c.copywritingFramework?.toUpperCase() || 'PAS'} • {c.contentLength || 'Vừa'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(c)}
                      className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer',
                        c.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      )}
                    >
                      {c.isActive ? '⚡ Bật' : '⏸️ Tắt'}
                    </button>
                  </div>

                  {/* Schedule & Golden Hours Bento Tile */}
                  <div className="p-2.5 rounded-xl bg-background/80 border border-border/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
                      <span>⏰ Giờ Vàng (VN):</span>
                      <span className="text-foreground font-extrabold">{times.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
                      <span>⏳ Chạy tiếp theo:</span>
                      <span className="text-emerald-400 font-extrabold">{nextRunFormatted}</span>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.recycleMedia && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                        🔄 Tuần hoàn media
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-bold border border-border/50">
                      {c.publishMode === 'approval' ? '🛡️ Chờ duyệt' : '⚡ Tự động đăng'}
                    </span>
                    <span className={clsx(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold border',
                      mediaCount > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    )}>
                      📸 {mediaCount} clips trong kho
                    </span>
                  </div>

                  {/* Prompt preview */}
                  {c.notePrompt && (
                    <p className="text-[11px] text-muted-foreground/90 italic bg-muted/20 p-2 rounded-lg line-clamp-2">
                      "{c.notePrompt}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openMediaModal(c)}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>📁</span> Kho Media ({mediaCount})
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTriggerNow(c)}
                      title="Chạy thử nghiệm ngay bây giờ qua AI"
                      className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl border border-primary/30 transition-all cursor-pointer"
                    >
                      🚀 Bắn bài
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      title="Chỉnh sửa chiến dịch"
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(c)}
                      title="Xóa chiến dịch"
                      className="p-1.5 text-muted-foreground hover:text-rose-400 transition-all cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/40 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Chiến dịch</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Giờ Vàng (VN)</th>
                <th className="py-3 px-4">Chạy kế tiếp</th>
                <th className="py-3 px-4 text-center">Kho Media</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCampaigns.map((c: any) => {
                const times = (() => {
                  try {
                    const parsed = JSON.parse(c.postingTimes);
                    return Array.isArray(parsed) ? parsed : [c.postingTime || '11:45'];
                  } catch {
                    return [c.postingTime || '11:45'];
                  }
                })();
                const mediaCount = c._count?.media || 0;
                const nextRunFormatted = c.nextRunAt
                  ? new Date(new Date(c.nextRunAt).getTime() + 7 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16)
                  : 'Chưa có lịch';

                return (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-all">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <div className="flex flex-col">
                        <span className="hover:text-primary cursor-pointer text-sm font-extrabold" onClick={() => openEditModal(c)}>
                          {c.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {c.copywritingFramework?.toUpperCase() || 'PAS'} • {c.publishMode === 'approval' ? 'Chờ duyệt' : 'Tự động'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer',
                          c.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        )}
                      >
                        {c.isActive ? 'Bật' : 'Tắt'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      {times.join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {nextRunFormatted}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openMediaModal(c)}
                        className={clsx(
                          'px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer',
                          mediaCount > 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}
                      >
                        📁 {mediaCount} clips
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTriggerNow(c)}
                          className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Bắn bài
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c)}
                          className="p-1 text-muted-foreground hover:text-rose-400 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create / Edit */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-lg font-extrabold text-foreground">
                {activeModal === 'create' ? '✨ Tạo Chiến Dịch Nuôi Kênh Mới' : '✏️ Chỉnh Sửa Chiến Dịch'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="size-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-muted-foreground">Tên Chiến Dịch *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Youtube - Giải Mã Tư Duy"
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Prompt Định Hướng AI</label>
                <textarea
                  rows={3}
                  value={formData.notePrompt}
                  onChange={(e) => setFormData({ ...formData, notePrompt: e.target.value })}
                  placeholder="Ví dụ: Hướng dẫn giải khối Rubik theo phương pháp trực quan..."
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground">Khung Giờ Vàng (VN)</label>
                  <input
                    type="text"
                    value={formData.postingTimes}
                    onChange={(e) => setFormData({ ...formData, postingTimes: e.target.value })}
                    placeholder="11:45, 19:45"
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground">Chế Độ Đăng</label>
                  <select
                    value={formData.publishMode}
                    onChange={(e) => setFormData({ ...formData, publishMode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="auto">⚡ Tự động đăng (Auto)</option>
                    <option value="approval">🛡️ Chờ duyệt bài (Approval)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Hashtags</label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  placeholder="#rubik #math #giaimatuduy"
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/40 border border-border/40">
                <input
                  type="checkbox"
                  id="recycleMedia"
                  checked={formData.recycleMedia}
                  onChange={(e) => setFormData({ ...formData, recycleMedia: e.target.checked })}
                  className="size-4 accent-primary cursor-pointer"
                />
                <label htmlFor="recycleMedia" className="cursor-pointer text-xs font-bold text-foreground">
                  🔄 Tự động tái sử dụng (Recycle Evergreen Media khi cạn kho)
                </label>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Lưu Chiến Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Media Management */}
      {activeModal === 'media' && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 space-y-4 my-8 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-foreground">
                  📁 Kho Media: {selectedCampaign.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Các clips được xếp hàng theo thứ tự ưu tiên đăng lần lượt.
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="size-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Add URL */}
            <form onSubmit={handleAddMedia} className="p-3 rounded-2xl bg-secondary/40 border border-border/40 space-y-2 shrink-0">
              <span className="text-xs font-bold text-foreground">➕ Thêm Media URL vào Hàng Đợi:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Tên media (VD: Rubik Bài 1)"
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border/60 text-foreground"
                />
                <input
                  type="url"
                  required
                  placeholder="Direct Media URL (mp4, png, jpg)"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border/60 text-foreground"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-primary text-white font-bold text-xs rounded-xl shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                Thêm Vào Hàng Đợi
              </button>
            </form>

            {/* Media List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {(selectedCampaign.media || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
                  Chưa có clip nào trong hàng đợi.
                </div>
              ) : (
                (selectedCampaign.media || []).map((m: any, idx: number) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-background/80 border border-border/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="size-6 rounded-full bg-secondary font-bold text-[11px] text-muted-foreground flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{m.name || 'Untitled Clip'}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-md">{m.url}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-400 transition-all cursor-pointer shrink-0"
                      title="Xóa clip"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border/40 flex justify-end shrink-0">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-secondary text-foreground font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
