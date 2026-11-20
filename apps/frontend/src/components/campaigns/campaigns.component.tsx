'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import clsx from 'clsx';
import useSWR from 'swr';

const vietnamDateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const scheduleDays = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

const iconPaths = {
  search: 'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  refresh: 'M20 7v5h-5M4 17v-5h5m10.5 0A7.5 7.5 0 0 0 6 7.5m-1.5 4.5A7.5 7.5 0 0 0 18 16.5',
  edit: 'm14 6 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z',
  delete: 'M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5',
  media: 'M12 8v8m-4-4h8M4 4h16v16H4z',
  table: 'M3 5h18v14H3zM3 10h18M9 10v9',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
};

function CampaignIcon({ name, className }: { name: keyof typeof iconPaths; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={clsx('size-4 shrink-0', className)}>
      <path d={iconPaths[name]} />
    </svg>
  );
}

function readCampaignArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const createButton = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ee4d2d] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#ee4d2d]/30 transition-colors hover:bg-[#d94124] cursor-pointer';
const rowIconButton = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer';

export const CampaignsComponent: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'no_media'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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
      const response = await fetch('/integrations');
      const res = response.ok ? await response.json() : null;
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.integrations)) return res.integrations;

      const list = await (await fetch('/integrations/list')).json();
      return Array.isArray(list.integrations) ? list.integrations : [];
    } catch {
      return [];
    }
  }, [fetch]);

  const { data: integrations = [] } = useSWR('/integrations', loadIntegrations);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      toaster.show('Đã cập nhật dữ liệu mới nhất!', 'success');
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c: any) => c.isActive).length;
    const totalMedia = campaigns.reduce((acc: number, c: any) => acc + (c._count?.media || 0), 0);
    const earliestNext = campaigns
      .filter((c: any) => c.isActive && c.nextRunAt)
      .map((c: any) => new Date(c.nextRunAt).getTime())
      .filter(Number.isFinite)
      .sort((a: number, b: number) => a - b)[0];

    return {
      total,
      active,
      paused: total - active,
      totalMedia,
      missingMedia: campaigns.filter((c: any) => !c._count?.media).length,
      nextRunText: earliestNext ? vietnamDateTime.format(earliestNext) : 'Chưa có lịch',
    };
  }, [campaigns]);

  const channelNames = useMemo(
    () => new Map<string, string>(
      integrations.map((i: any) => [i.id, i.name || i.identifier || i.id])
    ),
    [integrations]
  );

  // Filtering
  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('vi');
    return campaigns.filter((c: any) => {
      const matchesSearch = !query || c.name?.toLocaleLowerCase('vi').includes(query) ||
        c.notePrompt?.toLocaleLowerCase('vi').includes(query);
      if (!matchesSearch) return false;

      if (statusFilter === 'active') return c.isActive;
      if (statusFilter === 'inactive') return !c.isActive;
      if (statusFilter === 'no_media') return !c._count?.media;
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
    const times = readCampaignArray<string>(c.postingTimes, [c.postingTime || '11:45']);
    const days = readCampaignArray<number>(c.scheduleDays, [0, 1, 2, 3, 4, 5, 6]);
    const channels = readCampaignArray<string>(c.channels, []);

    setFormData({
      name: c.name || '',
      notePrompt: c.notePrompt || '',
      postingTimes: times.join(', '),
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

  const mediaCampaignKey = activeModal === 'media' && selectedCampaign
    ? `/campaigns/${selectedCampaign.id}`
    : null;
  const { data: mediaCampaign, isLoading: isMediaLoading, error: mediaError, mutate: refreshMedia } = useSWR(
    mediaCampaignKey,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể tải kho media');
      return response.json();
    }
  );

  const openMediaModal = (c: any) => {
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
          name: newMediaName.trim() || 'Tệp media',
          type: newMediaUrl.includes('.mp4') ? 'video' : 'image',
        }),
      });
      setNewMediaUrl('');
      setNewMediaName('');
      toaster.show('Đã thêm media vào hàng đợi!', 'success');
      await mutate();
      await refreshMedia();
    } catch {
      toaster.show('Lỗi khi thêm media', 'warning');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await fetch(`/campaigns/${selectedCampaign.id}/media/${mediaId}`, { method: 'DELETE' });
      toaster.show('Đã xóa media khỏi hàng đợi!', 'success');
      await mutate();
      await refreshMedia();
    } catch {
      toaster.show('Lỗi khi xóa media', 'warning');
    }
  };

  const statCards = [
    { label: 'Tổng chiến dịch', value: stats.total, chip: `${stats.paused} tạm dừng` },
    { label: 'Đang hoạt động', value: stats.active, chip: 'Tự động hóa' },
    { label: 'Kho media sẵn sàng', value: stats.totalMedia, chip: `${stats.missingMedia} cần nạp` },
    { label: 'Lịch chạy kế tiếp', value: stats.nextRunText, chip: 'Giờ Việt Nam' },
  ];
  const filters = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'active', label: 'Đang chạy', count: stats.active },
    { id: 'inactive', label: 'Tạm dừng', count: stats.paused },
    { id: 'no_media', label: 'Thiếu media', count: stats.missingMedia },
  ] as const;

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          Chiến dịch nuôi kênh
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo nội dung bằng Fosta AI, lên lịch theo giờ vàng và tự động đăng trên nhiều kênh.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, chip }) => (
          <div key={label} className="rounded-xl border border-border bg-card bg-[radial-gradient(ellipse_at_top_right,#ee4d2d12,transparent_70%)] p-4 shadow-sm">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-xl font-extrabold tabular-nums text-foreground">{value}</dd>
            <dd className="mt-2">
              <span className="inline-flex rounded-full bg-[#ee4d2d]/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {chip}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <section aria-label="Danh sách chiến dịch" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-muted-foreground focus-within:ring-1 focus-within:ring-primary sm:w-72">
              <CampaignIcon name="search" />
              <input
                type="text"
                aria-label="Tìm kiếm chiến dịch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên hoặc nội dung chiến dịch"
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => setSearchQuery('')} className="rounded px-1 hover:text-foreground">
                  ×
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Kiểu hiển thị" className="inline-flex rounded-lg border border-border bg-background p-0.5">
                {(['table', 'grid'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                      viewMode === mode ? 'bg-[#ee4d2d]/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CampaignIcon name={mode} />
                    {mode === 'table' ? 'Bảng Dữ Liệu' : 'Thẻ Bento'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Làm mới dữ liệu"
                title="Làm mới dữ liệu"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
              >
                <CampaignIcon name="refresh" className={clsx(isRefreshing && 'motion-safe:animate-spin')} />
              </button>
              <button type="button" onClick={openCreateModal} className={createButton}>
                + Tạo Chiến Dịch Mới
              </button>
            </div>
          </div>

          <div role="group" aria-label="Lọc chiến dịch" className="flex overflow-x-auto px-3">
            {filters.map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                aria-pressed={statusFilter === id}
                onClick={() => setStatusFilter(id)}
                className={clsx(
                  'inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === id ? 'border-[#ee4d2d] text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                <span className={clsx('rounded-full px-1.5 tabular-nums', statusFilter === id ? 'bg-[#ee4d2d]/10' : 'bg-secondary')}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <p role="status" className="px-4 py-10 text-center text-sm text-muted-foreground">Đang tải chiến dịch…</p>
        )}

        {!isLoading && filteredCampaigns.length === 0 && (
          <div className="m-4 space-y-3 rounded-xl border border-dashed border-border bg-[#ee4d2d]/5 px-4 py-10 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-[#ee4d2d]/10 text-primary">
              <CampaignIcon name={campaigns.length ? 'search' : 'table'} />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {campaigns.length ? 'Không tìm thấy chiến dịch phù hợp' : 'Bạn chưa có chiến dịch nào'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {campaigns.length ? 'Thử từ khóa khác hoặc chọn bộ lọc khác.' : 'Tạo chiến dịch đầu tiên để lên lịch và tự động đăng bài.'}
            </p>
            <button type="button" onClick={openCreateModal} className={createButton}>
              + Tạo Chiến Dịch Mới
            </button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredCampaigns.length > 0 && (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((c: any) => {
              const times = readCampaignArray<string>(c.postingTimes, [c.postingTime || '11:45']);
              const mediaCount = c._count?.media || 0;
              const nextRun = c.nextRunAt ? Date.parse(c.nextRunAt) : NaN;
              const nextRunFormatted = Number.isFinite(nextRun) ? vietnamDateTime.format(nextRun) : 'Chưa có lịch';

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

        {viewMode === 'table' && filteredCampaigns.length > 0 && (
          <div role="region" aria-label="Bảng chiến dịch có thể cuộn ngang" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs">
              <thead className="border-b border-border bg-[#ee4d2d]/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Chiến dịch &amp; Kênh</th>
                  <th scope="col" className="px-3 py-3">Trạng thái</th>
                  <th scope="col" className="px-3 py-3">Giờ vàng (VN)</th>
                  <th scope="col" className="px-3 py-3">Lịch chạy kế tiếp</th>
                  <th scope="col" className="px-3 py-3">Kho Media</th>
                  <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCampaigns.map((c: any) => {
                  const times = readCampaignArray<string>(c.postingTimes, [c.postingTime || '11:45']);
                  const days = readCampaignArray<number>(c.scheduleDays, [0, 1, 2, 3, 4, 5, 6]);
                  const channels = readCampaignArray<string>(c.channels, []);
                  const mediaCount = c._count?.media || 0;
                  const nextRun = c.nextRunAt ? Date.parse(c.nextRunAt) : NaN;
                  const isScheduled = c.isActive && Number.isFinite(nextRun);
                  const channelLabels = channels.length
                    ? channels.map((id) => channelNames.get(id) || 'Kênh đã lưu').join(', ')
                    : 'Tất cả kênh đã kết nối';

                  return (
                    <tr key={c.id} className="align-middle transition-colors hover:bg-amber-500/5">
                      <th scope="row" className="px-4 py-3 font-normal">
                        <button type="button" onClick={() => openEditModal(c)} className="block max-w-[240px] text-left text-sm font-bold text-foreground hover:text-primary hover:underline cursor-pointer">
                          {c.name}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-[#ee4d2d]/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            {c.copywritingFramework?.toUpperCase() || 'PAS'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {c.publishMode === 'approval' ? 'Chờ duyệt' : 'Tự động'}
                          </span>
                        </div>
                        <div className="mt-1 max-w-[240px] truncate text-[11px] text-muted-foreground" title={channelLabels}>
                          {channelLabels}
                        </div>
                      </th>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!c.isActive}
                          aria-label={`Hoạt động: ${c.name}`}
                          onClick={() => handleToggleActive(c)}
                          className={clsx(
                            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer',
                            c.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          <span aria-hidden="true" className={clsx('inline-flex h-3 w-5 items-center rounded-full p-0.5', c.isActive ? 'justify-end bg-emerald-600' : 'bg-muted-foreground/60')}>
                            <span className="size-2 rounded-full bg-white" />
                          </span>
                          <span aria-hidden="true">{c.isActive ? 'Đang chạy' : 'Tạm dừng'}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-48 font-bold tabular-nums text-foreground">{times.join(', ') || 'Chưa đặt giờ'}</div>
                        <div className="mt-1 flex gap-0.5" aria-label="Ngày chạy">
                          {scheduleDays.map(({ value, label }) => (
                            <span
                              key={value}
                              title={`${label} · ${days.includes(value) ? 'Có lịch' : 'Không có lịch'}`}
                              className={clsx('rounded px-1 py-0.5 text-[10px]', days.includes(value) ? 'bg-secondary font-bold text-foreground' : 'text-muted-foreground line-through')}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {isScheduled && (
                          <time dateTime={new Date(nextRun).toISOString()} className="mb-1 block font-semibold tabular-nums text-foreground">
                            {vietnamDateTime.format(nextRun)}
                          </time>
                        )}
                        <span className={clsx('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold', isScheduled ? 'bg-[#ee4d2d]/10 text-primary' : 'bg-secondary text-muted-foreground')}>
                          {isScheduled ? (nextRun <= Date.now() ? 'Đến giờ chạy' : 'Sắp chạy') : 'Chờ lịch'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openMediaModal(c)}
                          className={clsx(
                            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer',
                            mediaCount > 0
                              ? 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                              : 'border-amber-500/25 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300'
                          )}
                        >
                          {mediaCount === 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />}
                          {mediaCount === 0 ? '0 clips (Cần nạp)' : `${mediaCount} clips`}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => handleTriggerNow(c)} title="Tạo bài ngay bằng AI" className="mr-1 whitespace-nowrap rounded-md bg-[#ee4d2d]/10 px-2.5 py-2 font-bold text-primary transition-colors hover:bg-[#ee4d2d]/20 cursor-pointer">
                            Đăng ngay
                          </button>
                          <button type="button" onClick={() => openMediaModal(c)} aria-label="Nạp media" title="Nạp media" className={rowIconButton}>
                            <CampaignIcon name="media" />
                          </button>
                          <button type="button" onClick={() => openEditModal(c)} aria-label="Sửa chiến dịch" title="Sửa chiến dịch" className={rowIconButton}>
                            <CampaignIcon name="edit" />
                          </button>
                          <button type="button" onClick={() => handleDeleteCampaign(c)} aria-label="Xóa chiến dịch" title="Xóa chiến dịch" className={clsx(rowIconButton, 'hover:bg-rose-500/10 hover:text-rose-600')}>
                            <CampaignIcon name="delete" />
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
      </section>

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
                  Các clip sẽ được đăng lần lượt theo thứ tự trong hàng đợi.
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
              <span className="text-xs font-bold text-foreground">Thêm media vào hàng đợi</span>
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
                  placeholder="Liên kết trực tiếp (mp4, png, jpg)"
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
              {isMediaLoading ? (
                <p role="status" className="py-8 text-center text-xs text-muted-foreground">Đang tải kho media…</p>
              ) : mediaError && !mediaCampaign ? (
                <div role="alert" className="py-8 text-center text-xs text-muted-foreground">
                  Không thể tải kho media.{' '}
                  <button type="button" onClick={() => refreshMedia()} className="font-bold text-primary">
                    Thử lại
                  </button>
                </div>
              ) : !mediaCampaign?.media?.length ? (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
                  Chưa có clip nào trong hàng đợi.
                </div>
              ) : (
                mediaCampaign.media.map((m: any, idx: number) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-background/80 border border-border/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="size-6 rounded-full bg-secondary font-bold text-[11px] text-muted-foreground flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{m.name || 'Clip chưa đặt tên'}</p>
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
