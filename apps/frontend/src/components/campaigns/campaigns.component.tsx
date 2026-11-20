'use client';

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
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
  refresh:
    'M20 7v5h-5M4 17v-5h5m10.5 0A7.5 7.5 0 0 0 6 7.5m-1.5 4.5A7.5 7.5 0 0 0 18 16.5',
  edit: 'm14 6 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z',
  delete: 'M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5',
  media: 'M3 7V5h6l2 2h10v12H3z',
  table: 'M3 5h18v14H3zM3 10h18M9 10v9',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
};

function CampaignIcon({
  name,
  className,
}: {
  name: keyof typeof iconPaths;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx('size-4 shrink-0', className)}
    >
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

const createButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#d73211] active:scale-95 disabled:opacity-60';
const cancelButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60';
const rowIconButton =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60';
const field =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-normal text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20';
const fieldLabel = 'block text-xs font-bold text-neutral-700';
const pill =
  'inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-orange-300 hover:bg-orange-50';
const selectedPill = 'border-orange-300 bg-orange-50 text-orange-800';
const formSection =
  'space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4';
const frameworks = [
  { value: 'pas', label: 'PAS' },
  { value: 'aida', label: 'AIDA' },
  { value: 'bab', label: 'BAB' },
  { value: 'storytelling', label: 'Storytelling' },
];
const prompts = [
  {
    label: 'Bán lẻ TMĐT / Review sản phẩm',
    text: 'Viết kịch bản review sản phẩm ngắn. Mở đầu bằng vấn đề của khách hàng, minh họa lợi ích và kết thúc bằng lời kêu gọi hành động. Chỉ dùng thông tin đã được cung cấp.',
  },
  {
    label: 'Kiến thức / Giải mã tư duy',
    text: 'Mở đầu bằng câu hỏi gợi tò mò. Giải thích khái niệm bằng một ví dụ dễ hình dung, rồi chốt bằng một mẹo có thể áp dụng ngay.',
  },
  {
    label: 'Viral Trending ngắn',
    text: 'Viết kịch bản video dọc 15–30 giây. Mở đầu trong hai giây, triển khai mỗi cảnh một ý ngắn và kết thúc bằng câu hỏi gợi bình luận.',
  },
];
const timePresets = [
  { label: 'Trưa & Tối (11:45, 19:45)', value: '11:45, 19:45' },
  { label: '3 lần/ngày (08:00, 12:00, 20:00)', value: '08:00, 12:00, 20:00' },
];
const platforms: Record<string, { label: string; icon: string }> = {
  tiktok: { label: 'TikTok', icon: 'tiktok.png' },
  'tiktok-business': { label: 'TikTok Business', icon: 'tiktok-business.png' },
  youtube: { label: 'YouTube', icon: 'youtube.svg' },
  facebook: { label: 'Facebook', icon: 'facebook.png' },
  instagram: { label: 'Instagram', icon: 'instagram.png' },
  'instagram-standalone': {
    label: 'Instagram',
    icon: 'instagram-standalone.png',
  },
  linkedin: { label: 'LinkedIn', icon: 'linkedin.png' },
  'linkedin-page': { label: 'LinkedIn', icon: 'linkedin-page.png' },
  threads: { label: 'Threads', icon: 'threads.png' },
  x: { label: 'X', icon: 'x.png' },
  twitter: { label: 'X', icon: 'x.png' },
};

interface Integration {
  id: string;
  name?: string;
  identifier?: string;
  providerIdentifier?: string;
}

interface MediaClip {
  id: string;
  name?: string;
  url: string;
}

interface Campaign {
  id: string;
  name: string;
  isActive: boolean;
  notePrompt?: string;
  postingTime?: string;
  postingTimes?: unknown;
  scheduleDays?: unknown;
  channels?: unknown;
  nextRunAt?: string | null;
  recycleMedia?: boolean;
  publishMode?: string;
  brandVoice?: string;
  hashtags?: string;
  copywritingFramework?: string;
  _count?: { media: number };
  media?: MediaClip[];
}

function channelLabel(channel: Integration) {
  const identifier = channel.identifier || channel.providerIdentifier || '';
  const platform = platforms[identifier]?.label || identifier;
  return (
    [platform, channel.name && channel.name !== platform ? channel.name : '']
      .filter(Boolean)
      .join(' · ') || 'Kênh đã lưu'
  );
}

function PlatformIcon({ identifier = '' }: { identifier?: string }) {
  const platform = platforms[identifier];
  return platform ? (
    <img
      src={`/icons/platforms/${platform.icon}`}
      alt=""
      width={18}
      height={18}
      className="size-[18px] shrink-0 rounded-sm object-contain"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid size-[18px] shrink-0 place-items-center rounded bg-neutral-200 text-[10px] font-bold"
    >
      {identifier.charAt(0).toUpperCase() || '•'}
    </span>
  );
}

function CampaignDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby="campaign-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-50 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-2xl backdrop:bg-neutral-950/60 backdrop:backdrop-blur-sm sm:p-6"
    >
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <h2
          id="campaign-dialog-title"
          className="min-w-0 break-words text-lg font-black"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className={rowIconButton}
        >
          ✕
        </button>
      </header>
      {children}
    </dialog>,
    document.body
  );
}

export const CampaignsComponent: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();

  const writeCampaign = async (url: string, options: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('Không thể cập nhật dữ liệu chiến dịch');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'no_media'
  >('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'create' | 'edit' | 'media' | null
  >(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );

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

  const loadCampaigns = useCallback(async (): Promise<Campaign[]> => {
    const response = await fetch('/campaigns');
    if (!response.ok) throw new Error('Không thể tải chiến dịch');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, [fetch]);

  const {
    data: campaigns = [],
    mutate,
    isLoading,
    error: campaignsError,
  } = useSWR('/campaigns', loadCampaigns, {
    refreshInterval: 30000,
  });

  // Fetch Integrations (Connected social accounts)
  const loadIntegrations = useCallback(async (): Promise<Integration[]> => {
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
    } catch {
      toaster.show('Không thể làm mới dữ liệu chiến dịch', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c: Campaign) => c.isActive).length;
    const totalMedia = campaigns.reduce(
      (acc: number, c: any) => acc + (c._count?.media || 0),
      0
    );
    const earliestNext = campaigns
      .filter((c: Campaign) => c.isActive && c.nextRunAt)
      .map((c: Campaign) => Date.parse(c.nextRunAt || ''))
      .filter(Number.isFinite)
      .sort((a: number, b: number) => a - b)[0];

    return {
      total,
      active,
      paused: total - active,
      totalMedia,
      missingMedia: campaigns.filter((c: Campaign) => !c._count?.media).length,
      nextRunText: earliestNext
        ? vietnamDateTime.format(earliestNext)
        : 'Chưa có lịch',
    };
  }, [campaigns]);

  const channelsById = useMemo(
    () => new Map(integrations.map((channel) => [channel.id, channel])),
    [integrations]
  );

  // Filtering
  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('vi');
    return campaigns.filter((c: Campaign) => {
      const matchesSearch =
        !query ||
        c.name?.toLocaleLowerCase('vi').includes(query) ||
        c.notePrompt?.toLocaleLowerCase('vi').includes(query);
      if (!matchesSearch) return false;

      if (statusFilter === 'active') return c.isActive;
      if (statusFilter === 'inactive') return !c.isActive;
      if (statusFilter === 'no_media') return !c._count?.media;
      return true;
    });
  }, [campaigns, searchQuery, statusFilter]);

  const handleToggleActive = async (c: Campaign) => {
    try {
      await writeCampaign(`/campaigns/${c.id}/active`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      await mutate();
      toaster.show(
        `Đã ${!c.isActive ? 'bật' : 'tắt'} chiến dịch "${c.name}"`,
        'success'
      );
    } catch {
      toaster.show('Lỗi khi đổi trạng thái', 'warning');
    }
  };

  const handleTriggerNow = async (c: Campaign) => {
    try {
      toaster.show(
        `Đang kích hoạt chiến dịch "${c.name}" qua AI...`,
        'warning'
      );
      const res = await (
        await fetch(`/campaigns/${c.id}/trigger`, { method: 'POST' })
      ).json();
      if (res.success) {
        toaster.show(`Đã tạo bài thành công: "${res.title}"`, 'success');
        await mutate();
      } else {
        toaster.show(
          `Kích hoạt thất bại: ${res.reason || 'Lỗi không xác định'}`,
          'warning'
        );
      }
    } catch {
      toaster.show('Lỗi khi kích hoạt chiến dịch', 'warning');
    }
  };

  const handleDeleteCampaign = async (c: Campaign) => {
    if (!confirm(`Bạn có chắc muốn xóa chiến dịch "${c.name}" không?`)) return;
    try {
      await writeCampaign(`/campaigns/${c.id}`, { method: 'DELETE' });
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
      channels: integrations.map((i: Integration) => i.id),
    });
    setActiveModal('create');
  };

  const openEditModal = (c: Campaign) => {
    setSelectedCampaign(c);
    const times = readCampaignArray<string>(c.postingTimes, [
      c.postingTime || '11:45',
    ]);
    const days = readCampaignArray<number>(
      c.scheduleDays,
      [0, 1, 2, 3, 4, 5, 6]
    );
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

    const timesArr = formData.postingTimes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      ...formData,
      postingTimes: timesArr,
      scheduleDays: formData.scheduleDays,
      channels: formData.channels,
    };

    try {
      if (activeModal === 'create') {
        await writeCampaign('/campaigns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toaster.show('Đã tạo chiến dịch nuôi kênh mới!', 'success');
      } else if (activeModal === 'edit' && selectedCampaign) {
        await writeCampaign(`/campaigns/${selectedCampaign.id}`, {
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

  const mediaCampaignKey =
    activeModal === 'media' && selectedCampaign
      ? `/campaigns/${selectedCampaign.id}`
      : null;
  const {
    data: mediaCampaign,
    isLoading: isMediaLoading,
    error: mediaError,
    mutate: refreshMedia,
  } = useSWR<Campaign>(mediaCampaignKey, async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Không thể tải kho media');
    return response.json();
  });

  const openMediaModal = (c: Campaign) => {
    setNewMediaUrl('');
    setNewMediaName('');
    setSelectedCampaign(c);
    setActiveModal('media');
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !newMediaUrl.trim()) return;
    try {
      await writeCampaign(`/campaigns/${selectedCampaign.id}/media`, {
        method: 'POST',
        body: JSON.stringify({
          url: newMediaUrl.trim(),
          name: newMediaName.trim() || 'Tệp media',
          type: /\.(avif|gif|jpe?g|png|webp|svg|bmp)(?:[?#]|$)/i.test(
            newMediaUrl.trim()
          )
            ? 'image'
            : 'video',
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
    if (!selectedCampaign) return;
    try {
      await writeCampaign(
        `/campaigns/${selectedCampaign.id}/media/${mediaId}`,
        { method: 'DELETE' }
      );
      toaster.show('Đã xóa media khỏi hàng đợi!', 'success');
      await mutate();
      await refreshMedia();
    } catch {
      toaster.show('Lỗi khi xóa media', 'warning');
    }
  };

  const statCards = [
    {
      label: 'Tổng Chiến Dịch',
      icon: '🚀',
      value: stats.total,
      chip: 'Giám sát thời gian thực',
      tone: 'bg-orange-50 text-orange-800',
    },
    {
      label: 'Đang Hoạt Động',
      icon: '🟢',
      value: stats.active,
      chip: 'Auto-pilot 100%',
      tone: 'bg-emerald-50 text-emerald-800',
    },
    {
      label: 'Kho Media Sẵn Sàng',
      icon: '🎬',
      value: stats.totalMedia,
      chip: 'Nguồn clip nội dung',
      tone: 'bg-indigo-50 text-indigo-800',
    },
    {
      label: 'Lịch Chạy Kế Tiếp',
      icon: '⏰',
      value: stats.nextRunText,
      chip: 'Khung giờ vàng VN',
      tone: 'bg-amber-50 text-amber-800',
    },
  ];
  const filters = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'active', label: '🟢 Đang chạy', count: stats.active },
    { id: 'inactive', label: '⏸️ Tạm dừng', count: stats.paused },
    { id: 'no_media', label: '⚠️ Cạn media', count: stats.missingMedia },
  ] as const;
  const closeModal = () => setActiveModal(null);
  const updateForm = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => setFormData((current) => ({ ...current, [key]: value }));

  const rows = filteredCampaigns.map((campaign) => {
    const times = readCampaignArray<string>(campaign.postingTimes, [
      campaign.postingTime || '11:45',
    ]);
    const days = readCampaignArray<number>(
      campaign.scheduleDays,
      [0, 1, 2, 3, 4, 5, 6]
    );
    const ids = readCampaignArray<string>(campaign.channels, []);
    const channels: Integration[] = ids.length
      ? ids.map((id) => channelsById.get(id) || { id })
      : integrations;
    const mediaCount = campaign._count?.media || 0;
    const nextRun = campaign.nextRunAt ? Date.parse(campaign.nextRunAt) : NaN;
    const scheduled = campaign.isActive && Number.isFinite(nextRun);
    const framework = frameworks.find(
      ({ value }) => value === campaign.copywritingFramework?.toLowerCase()
    );
    return {
      id: campaign.id,
      identity: (
        <div className="min-w-36 space-y-2">
          <button
            type="button"
            onClick={() => openEditModal(campaign)}
            className="block max-w-64 break-words text-left text-sm font-bold transition-colors hover:text-[#ee4d2d]"
          >
            {campaign.name}
          </button>
          <div className="flex flex-wrap gap-1.5">
            {channels.length ? (
              channels.map((channel) => (
                <span
                  key={channel.id}
                  title={channelLabel(channel)}
                  className="inline-flex rounded-md border border-neutral-200 bg-white p-1"
                >
                  <PlatformIcon
                    identifier={
                      channel.identifier || channel.providerIdentifier
                    }
                  />
                  <span className="sr-only">{channelLabel(channel)}</span>
                </span>
              ))
            ) : (
              <span className="text-neutral-500">Chưa có kênh kết nối</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-800">
              {framework?.label || campaign.copywritingFramework || 'PAS'}
            </span>
            {campaign.publishMode === 'approval' ? 'Chờ duyệt' : 'Tự động'}
          </div>
        </div>
      ),
      status: (
        <button
          type="button"
          role="switch"
          aria-checked={campaign.isActive}
          aria-label={`Trạng thái hoạt động của ${campaign.name}`}
          onClick={() => handleToggleActive(campaign)}
          className={clsx(
            'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold',
            campaign.isActive
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-neutral-100 text-neutral-600'
          )}
        >
          <span
            aria-hidden="true"
            className={clsx(
              'inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors',
              campaign.isActive ? 'bg-emerald-600' : 'bg-neutral-500'
            )}
          >
            <span
              className={clsx(
                'size-3 rounded-full bg-white shadow-sm motion-safe:transition-transform',
                campaign.isActive && 'translate-x-3'
              )}
            />
          </span>
          {campaign.isActive ? 'Đang phát' : '⏸️ Đã dừng'}
        </button>
      ),
      schedule: (
        <div className="space-y-2">
          <div className="flex max-w-60 flex-wrap gap-1">
            {times.length ? (
              times.map((time, index) => (
                <span
                  key={`${time}-${index}`}
                  className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 font-bold tabular-nums"
                >
                  {time}
                </span>
              ))
            ) : (
              <span className="text-neutral-500">Chưa đặt giờ</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1" aria-label="Ngày chạy">
            {scheduleDays.map(({ value, label }) => (
              <span
                key={value}
                title={`${label} · ${
                  days.includes(value) ? 'Có lịch' : 'Không có lịch'
                }`}
                className={clsx(
                  'grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold',
                  days.includes(value)
                    ? 'bg-orange-100 text-orange-900'
                    : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ),
      next: (
        <div className="space-y-1.5 whitespace-nowrap">
          {scheduled && (
            <time
              dateTime={new Date(nextRun).toISOString()}
              className="block font-bold tabular-nums"
            >
              {vietnamDateTime.format(nextRun)}
            </time>
          )}
          <span
            className={clsx(
              'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
              scheduled
                ? 'bg-orange-50 text-orange-800'
                : 'bg-neutral-100 text-neutral-600'
            )}
          >
            {scheduled
              ? nextRun <= Date.now()
                ? 'Đến giờ chạy'
                : '⚡ Sắp đăng'
              : campaign.isActive
              ? 'Chờ lịch'
              : 'Đã dừng'}
          </span>
        </div>
      ),
      media: (
        <button
          type="button"
          onClick={() => openMediaModal(campaign)}
          className={clsx(
            'whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold transition-colors',
            mediaCount
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100'
          )}
        >
          {mediaCount ? `🎬 ${mediaCount} clips sẵn sàng` : '⚠️ Cần nạp clip'}
        </button>
      ),
      actions: (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleTriggerNow(campaign)}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#ee4d2d] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#d73211] active:scale-95"
          >
            ⚡ Đăng ngay
          </button>
          {(
            [
              ['media', 'Mở kho media', openMediaModal],
              ['edit', 'Sửa chiến dịch', openEditModal],
              ['delete', 'Xóa chiến dịch', handleDeleteCampaign],
            ] as const
          ).map(([icon, label, action]) => (
            <button
              key={icon}
              type="button"
              onClick={() => action(campaign)}
              aria-label={label}
              title={label}
              className={clsx(
                rowIconButton,
                icon === 'delete' && 'hover:bg-red-50 hover:text-red-700'
              )}
            >
              <CampaignIcon name={icon} />
            </button>
          ))}
        </div>
      ),
    };
  });

  return (
    <div className="w-full min-w-0 space-y-5 text-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5 rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/75 p-5 sm:p-6">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-orange-800">
            ⚡ CLARO AUTO-PILOT MATRIX
          </span>
          <h1 className="mt-2.5 text-2xl font-black tracking-tight text-neutral-900">
            Trung Tâm Chiến Dịch Nuôi Kênh AI
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Tự động hóa sản xuất nội dung bằng Fosta AI, lên lịch theo khung giờ
            vàng và phân phối đa kênh tự động.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cancelButton}
          >
            <CampaignIcon
              name="refresh"
              className={isRefreshing ? 'motion-safe:animate-spin' : undefined}
            />{' '}
            {isRefreshing ? 'Đang làm mới' : 'Làm mới'}
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className={createButton}
          >
            <span aria-hidden="true">+</span> Tạo Chiến Dịch Mới
          </button>
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, icon, value, chip, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5"
          >
            <dt className="flex items-center gap-2 text-sm font-bold text-neutral-700">
              <span
                aria-hidden="true"
                className={clsx(
                  'grid size-8 shrink-0 place-items-center rounded-lg',
                  tone,
                  icon === '🟢' &&
                    stats.active > 0 &&
                    'motion-safe:animate-pulse'
                )}
              >
                {icon}
              </span>
              {label}
            </dt>
            <dd
              className={clsx(
                'mt-2 font-black tabular-nums text-neutral-900',
                typeof value === 'number'
                  ? 'text-3xl'
                  : 'min-h-9 text-xl leading-9'
              )}
            >
              {isLoading ? '—' : value}
            </dd>
            <dd className="mt-2">
              <span
                className={clsx(
                  'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  tone
                )}
              >
                {chip}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <section
        aria-label="Danh sách chiến dịch"
        className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-neutral-500 focus-within:border-[#ee4d2d] focus-within:ring-2 focus-within:ring-[#ee4d2d]/20 sm:w-80">
            <CampaignIcon name="search" />
            <input
              type="search"
              aria-label="Tìm kiếm chiến dịch"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm tên hoặc nội dung chiến dịch"
              className="min-w-0 flex-1 bg-transparent text-xs text-neutral-900 outline-none placeholder:text-neutral-400"
            />
          </div>
          <div
            role="group"
            aria-label="Kiểu hiển thị"
            className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1"
          >
            {(['table', 'grid'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors',
                  viewMode === mode
                    ? 'bg-white text-orange-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <CampaignIcon name={mode} />{' '}
                {mode === 'table' ? 'Bảng Dữ Liệu' : 'Thẻ Bento'}
              </button>
            ))}
          </div>
        </div>
        <div
          role="group"
          aria-label="Lọc theo trạng thái"
          className="flex flex-wrap gap-1 border-b border-neutral-200 px-4 pb-2"
        >
          {filters.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              aria-pressed={statusFilter === id}
              onClick={() => setStatusFilter(id)}
              className={clsx(
                'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-2.5 py-2 text-xs font-bold transition-colors',
                statusFilter === id
                  ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50'
              )}
            >
              {label}
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 tabular-nums text-neutral-700">
                {count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <p
            role="status"
            className="p-12 text-center text-sm text-neutral-600"
          >
            Đang tải chiến dịch…
          </p>
        ) : campaignsError && !campaigns.length ? (
          <p role="alert" className="p-12 text-center text-sm text-neutral-600">
            Không thể tải chiến dịch.{' '}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="font-bold text-orange-800"
            >
              Thử lại
            </button>
          </p>
        ) : rows.length === 0 ? (
          <div className="space-y-3 p-10 text-center">
            <p className="text-sm font-semibold">
              {campaigns.length
                ? 'Không tìm thấy chiến dịch phù hợp'
                : 'Chưa có chiến dịch'}
            </p>
            <button
              type="button"
              onClick={
                campaigns.length
                  ? () => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }
                  : openCreateModal
              }
              className={campaigns.length ? cancelButton : createButton}
            >
              {campaigns.length ? 'Xóa bộ lọc' : '+ Tạo Chiến Dịch Mới'}
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div
            role="region"
            aria-label="Bảng chiến dịch cuộn ngang"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50/90 text-xs font-bold uppercase tracking-wider text-neutral-600">
                <tr>
                  {[
                    'Chiến dịch & kênh phát',
                    'Trạng thái',
                    'Giờ đăng & ma trận tuần',
                    'Lịch chạy tiếp theo',
                    'Kho media',
                    'Thao tác nhanh',
                  ].map((label) => (
                    <th key={label} scope="col" className="px-4 py-3.5">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map(
                  ({
                    id,
                    identity,
                    status,
                    schedule,
                    next,
                    media,
                    actions,
                  }) => (
                    <tr
                      key={id}
                      className="align-middle transition-colors hover:bg-orange-50/30"
                    >
                      <th scope="row" className="px-4 py-4 font-normal">
                        {identity}
                      </th>
                      <td className="px-4 py-4">{status}</td>
                      <td className="px-4 py-4">{schedule}</td>
                      <td className="px-4 py-4">{next}</td>
                      <td className="px-4 py-4">{media}</td>
                      <td className="px-4 py-4">{actions}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 bg-neutral-50/70 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {rows.map(
              ({ id, identity, status, schedule, next, media, actions }) => (
                <article
                  key={id}
                  className="flex min-w-0 flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-xs shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {identity}
                    {status}
                  </div>
                  <div className="grid gap-3 rounded-xl bg-neutral-50 p-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className={fieldLabel}>Giờ đăng (VN)</p>
                      {schedule}
                    </div>
                    <div className="space-y-1.5">
                      <p className={fieldLabel}>Lịch chạy tiếp theo</p>
                      {next}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                    {media}
                    {actions}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {(activeModal === 'create' || activeModal === 'edit') && (
        <CampaignDialog
          title={
            activeModal === 'create'
              ? 'Tạo Chiến Dịch Mới'
              : 'Chỉnh Sửa Chiến Dịch'
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <section
              className={formSection}
              aria-labelledby="campaign-distribution"
            >
              <h3 id="campaign-distribution" className="text-sm font-extrabold">
                1. Tên chiến dịch &amp; kênh phân phối
              </h3>
              <label className={fieldLabel}>
                Tên chiến dịch
                <input
                  required
                  value={formData.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="Ví dụ: YouTube – Giải mã tư duy"
                  className={clsx(field, 'mt-1')}
                />
              </label>
              <fieldset>
                <legend className={fieldLabel}>Kênh phân phối</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[
                    ...integrations,
                    ...formData.channels
                      .filter((id) => !channelsById.has(id))
                      .map((id): Integration => ({ id })),
                  ].map((channel) => (
                    <label
                      key={channel.id}
                      className={clsx(
                        pill,
                        'max-w-full cursor-pointer',
                        formData.channels.includes(channel.id) && selectedPill
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel.id)}
                        onChange={(event) =>
                          updateForm(
                            'channels',
                            event.target.checked
                              ? [...formData.channels, channel.id]
                              : formData.channels.filter(
                                  (id) => id !== channel.id
                                )
                          )
                        }
                        className="size-3.5 shrink-0 accent-[#ee4d2d]"
                      />
                      <PlatformIcon
                        identifier={
                          channel.identifier || channel.providerIdentifier
                        }
                      />
                      <span
                        className="min-w-0 truncate"
                        title={channelLabel(channel)}
                      >
                        {channelLabel(channel)}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  {integrations.length
                    ? 'Bỏ trống để phân phối đến tất cả kênh đã kết nối.'
                    : 'Chưa có kênh phân phối đã kết nối.'}
                </p>
              </fieldset>
            </section>

            <section className={formSection} aria-labelledby="campaign-ai">
              <h3 id="campaign-ai" className="text-sm font-extrabold">
                2. AI Prompt &amp; Framework
              </h3>
              <div
                role="group"
                aria-label="Mẫu prompt"
                className="flex flex-wrap gap-2"
              >
                {prompts.map(({ label, text }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => updateForm('notePrompt', text)}
                    className={pill}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className={fieldLabel}>
                Prompt định hướng AI
                <textarea
                  rows={3}
                  value={formData.notePrompt}
                  onChange={(event) =>
                    updateForm('notePrompt', event.target.value)
                  }
                  placeholder="Chủ đề, đối tượng người xem và cách triển khai nội dung"
                  className={clsx(field, 'mt-1')}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={fieldLabel}>
                  Framework
                  <select
                    value={formData.copywritingFramework}
                    onChange={(event) =>
                      updateForm('copywritingFramework', event.target.value)
                    }
                    className={clsx(field, 'mt-1')}
                  >
                    {!frameworks.some(
                      ({ value }) => value === formData.copywritingFramework
                    ) && (
                      <option value={formData.copywritingFramework}>
                        {formData.copywritingFramework}
                      </option>
                    )}
                    {frameworks.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={fieldLabel}>
                  Hashtags
                  <input
                    value={formData.hashtags}
                    onChange={(event) =>
                      updateForm('hashtags', event.target.value)
                    }
                    placeholder="#claro #learning"
                    className={clsx(field, 'mt-1')}
                  />
                </label>
              </div>
            </section>

            <section
              className={formSection}
              aria-labelledby="campaign-schedule"
            >
              <h3 id="campaign-schedule" className="text-sm font-extrabold">
                3. Lịch đăng &amp; giờ vàng
              </h3>
              <div
                role="group"
                aria-label="Chọn nhanh giờ vàng"
                className="flex flex-wrap gap-2"
              >
                {timePresets.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={formData.postingTimes === value}
                    onClick={() => updateForm('postingTimes', value)}
                    className={clsx(
                      pill,
                      formData.postingTimes === value && selectedPill
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className={fieldLabel}>
                Khung giờ đăng (giờ Việt Nam)
                <input
                  value={formData.postingTimes}
                  onChange={(event) =>
                    updateForm('postingTimes', event.target.value)
                  }
                  placeholder="11:45, 19:45"
                  className={clsx(field, 'mt-1')}
                />
              </label>
              <div
                role="group"
                aria-label="Ngày đăng trong tuần"
                className="flex flex-wrap gap-1.5"
              >
                {scheduleDays.map(({ value, label }) => {
                  const selected = formData.scheduleDays.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        updateForm(
                          'scheduleDays',
                          selected
                            ? formData.scheduleDays.filter(
                                (day) => day !== value
                              )
                            : [...formData.scheduleDays, value]
                        )
                      }
                      className={clsx(
                        pill,
                        'min-w-9 justify-center rounded-lg',
                        selected && selectedPill
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={formSection} aria-labelledby="campaign-publish">
              <h3 id="campaign-publish" className="text-sm font-extrabold">
                4. Chế độ xuất bản
              </h3>
              <fieldset>
                <legend className="sr-only">Chế độ xuất bản</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['auto', 'Tự động (Auto)'],
                      ['approval', 'Chờ duyệt (Approval)'],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={clsx(
                        pill,
                        'cursor-pointer',
                        formData.publishMode === value && selectedPill
                      )}
                    >
                      <input
                        type="radio"
                        name="campaign-publish-mode"
                        value={value}
                        checked={formData.publishMode === value}
                        onChange={() => updateForm('publishMode', value)}
                        className="size-3.5 accent-[#ee4d2d]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.recycleMedia}
                  onChange={(event) =>
                    updateForm('recycleMedia', event.target.checked)
                  }
                  className="size-4 accent-[#ee4d2d]"
                />{' '}
                Tự động tái sinh Evergreen Media khi cạn kho
              </label>
            </section>

            <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className={cancelButton}
              >
                Hủy
              </button>
              <button type="submit" className={createButton}>
                {activeModal === 'create' ? 'Tạo Chiến Dịch' : 'Lưu Chiến Dịch'}
              </button>
            </div>
          </form>
        </CampaignDialog>
      )}

      {activeModal === 'media' && selectedCampaign && (
        <CampaignDialog
          title={`Kho media · ${selectedCampaign.name}`}
          onClose={closeModal}
        >
          <form onSubmit={handleAddMedia} className={clsx(formSection, 'mb-5')}>
            <h3 className="text-sm font-extrabold">Thêm nhanh vào hàng đợi</h3>
            <label className={fieldLabel}>
              Link media trực tiếp
              <input
                type="url"
                required
                value={newMediaUrl}
                onChange={(event) => setNewMediaUrl(event.target.value)}
                placeholder="Dán link video, CDN hoặc Cloudflare R2"
                className={clsx(field, 'mt-1')}
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className={clsx(fieldLabel, 'min-w-40 flex-1')}>
                Tên clip (không bắt buộc)
                <input
                  value={newMediaName}
                  onChange={(event) => setNewMediaName(event.target.value)}
                  placeholder="Ví dụ: Review sản phẩm"
                  className={clsx(field, 'mt-1')}
                />
              </label>
              <button type="submit" className={createButton}>
                + Thêm nhanh
              </button>
            </div>
          </form>

          <section aria-labelledby="campaign-queue" className="space-y-2">
            <h3 id="campaign-queue" className="text-sm font-extrabold">
              Hàng đợi clips{' '}
              {mediaCampaign?.media && `(${mediaCampaign.media.length})`}
            </h3>
            {isMediaLoading ? (
              <p
                role="status"
                className="py-8 text-center text-sm text-neutral-600"
              >
                Đang tải kho media…
              </p>
            ) : mediaError && !mediaCampaign ? (
              <p
                role="alert"
                className="py-8 text-center text-sm text-neutral-600"
              >
                Không thể tải kho media.{' '}
                <button
                  type="button"
                  onClick={() => refreshMedia()}
                  className="font-bold text-orange-800"
                >
                  Thử lại
                </button>
              </p>
            ) : !mediaCampaign?.media?.length ? (
              <p className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-600">
                Chưa có clip nào trong hàng đợi.
              </p>
            ) : (
              <ol className="space-y-2">
                {mediaCampaign.media.map((clip, index) => (
                  <li
                    key={clip.id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-xs"
                  >
                    <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 font-bold tabular-nums text-neutral-600">
                      #{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {clip.name || 'Clip chưa đặt tên'}
                      </p>
                      {/^https?:\/\//i.test(clip.url) ? (
                        <a
                          href={clip.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-neutral-600 hover:text-orange-800 hover:underline"
                          title={clip.url}
                        >
                          {clip.url}
                        </a>
                      ) : (
                        <p
                          className="truncate text-neutral-600"
                          title={clip.url}
                        >
                          {clip.url}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(clip.id)}
                      aria-label={`Xóa clip ${index + 1}`}
                      title="Xóa clip"
                      className={clsx(
                        rowIconButton,
                        'hover:bg-red-50 hover:text-red-700'
                      )}
                    >
                      <CampaignIcon name="delete" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="mt-4 flex justify-end border-t border-neutral-200 pt-4">
            <button type="button" onClick={closeModal} className={cancelButton}>
              Đóng
            </button>
          </div>
        </CampaignDialog>
      )}
    </div>
  );
};
