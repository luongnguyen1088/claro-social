'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useUser } from '@gitroom/frontend/components/layout/user.context';

const aspectKey = 'claro_video_aspect_mode';
const channels = [
  'TikTok',
  'YouTube Shorts',
  'Facebook Reels',
  'Shopee Video',
  'Google Drive',
  'AI Studio',
  'Khác',
];
const modes = [
  { value: 'contain', label: '🔲 Tất cả' },
  { value: '9:16', label: '📱 9:16 Dọc' },
  { value: '16:9', label: '🖥️ 16:9 Ngang' },
] as const;
const videoExtension =
  /\.(mp4|m4v|mov|webm|ogv|ogg|avi|mkv|mpeg|mpg|3gp|m3u8)(?:[?#]|$)/i;
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const pageSize = 18;

const panel = 'rounded-2xl border border-[#e7e3dc] bg-white shadow-sm';
const button =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#e7e3dc] bg-white px-3 py-2 text-sm font-medium transition hover:border-[#ee4d2d] hover:text-[#c43c22] disabled:cursor-not-allowed disabled:opacity-50';
const primary =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#ee4d2d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c43c22] disabled:cursor-not-allowed disabled:opacity-50';
const field =
  'w-full rounded-lg border border-[#e7e3dc] bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-[#ee4d2d] focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/20';
const badge =
  'inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700';

type AspectMode = (typeof modes)[number]['value'];
type Ratio = Exclude<AspectMode, 'contain'>;
type Sort = 'newest' | 'oldest' | 'duration' | 'name';
type Video = {
  id: string;
  mediaId?: string;
  title: string;
  url: string;
  filename?: string;
  thumbnail?: string | null;
  channel: string;
  ratio?: Ratio;
  duration?: number;
  size?: number;
  width?: number;
  height?: number;
  tags: string;
  notes: string;
  createdAt?: string;
};
type Media = {
  id: string;
  name: string;
  originalName?: string | null;
  path: string;
  thumbnail?: string | null;
  createdAt?: string;
  fileSize?: number | null;
};
type MediaPage = { pages: number; results: Media[] };
type Campaign = {
  id: string;
  name: string;
  isActive: boolean;
  _count?: { media: number };
};
type CampaignQueue = { id: string; media: { url: string; type: string }[] };
type Metadata = Pick<Video, 'width' | 'height' | 'duration'>;
type Draft = {
  title: string;
  url: string;
  channel: string;
  customChannel: string;
  ratio: Ratio | '';
  duration: string;
  tags: string;
  notes: string;
};
type ModalState =
  | { type: 'edit'; video?: Video }
  | { type: 'preview'; video: Video }
  | { type: 'push'; videos: Video[] }
  | { type: 'delete'; videos: Video[] };

async function inBatches<T>(
  length: number,
  load: (index: number) => Promise<T>
) {
  const items: T[] = [];
  for (let start = 0; start < length; start += 6) {
    items.push(
      ...(await Promise.all(
        Array.from({ length: Math.min(6, length - start) }, (_, index) =>
          load(start + index)
        )
      ))
    );
  }
  return items;
}

function fromMedia(media: Media): Video {
  return {
    id: `media:${media.id}`,
    mediaId: media.id,
    title: media.originalName || media.name,
    filename: media.originalName || media.name,
    url: media.path,
    thumbnail: media.thumbnail,
    channel: 'Khác',
    tags: '',
    notes: '',
    size: media.fileSize ?? undefined,
    createdAt: media.createdAt,
  };
}

function metadataOf(video: HTMLVideoElement): Metadata {
  return {
    width: video.videoWidth || undefined,
    height: video.videoHeight || undefined,
    duration: Number.isFinite(video.duration) ? video.duration : undefined,
  };
}

function readFileMetadata(file: File): Promise<Metadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const player = document.createElement('video');
    function finish(metadata: Metadata) {
      window.clearTimeout(timeout);
      player.onloadedmetadata = null;
      player.onerror = null;
      player.removeAttribute('src');
      player.load();
      URL.revokeObjectURL(url);
      resolve(metadata);
    }
    const timeout = window.setTimeout(() => finish({}), 3000);
    player.preload = 'metadata';
    player.onloadedmetadata = () => finish(metadataOf(player));
    player.onerror = () => finish({});
    player.src = url;
  });
}

function formatDuration(duration?: number) {
  if (duration === undefined) return '—';
  const seconds = Math.floor(duration);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatSize(size?: number) {
  if (size === undefined) return '—';
  const mb = 1024 * 1024;
  return size >= mb
    ? `${(size / mb).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
    : `${Math.ceil(size / 1024)} KB`;
}

function searchText(value: string) {
  return value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd');
}

function Icon({
  name,
  className = 'size-4',
}: {
  name:
    | 'film'
    | 'refresh'
    | 'search'
    | 'grid'
    | 'table'
    | 'play'
    | 'edit'
    | 'close'
    | 'phone'
    | 'monitor'
    | 'rocket';
  className?: string;
}) {
  const paths = {
    film: 'M3 5h18v14H3zM7 5v14m10-14v14M3 10h4m-4 4h4m10-4h4m-4 4h4',
    refresh:
      'M20 7v5h-5M4 17v-5h5m10.5 0A7.5 7.5 0 0 0 6 7m-1.5 5A7.5 7.5 0 0 0 18 17',
    search: 'm21 21-4-4m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
    table: 'M3 5h18v14H3zM3 10h18m-18 4h18M9 10v9',
    play: 'm9 5 11 7-11 7z',
    edit: 'm14 6 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4L4 15z',
    close: 'm6 6 12 12M18 6 6 18',
    phone: 'M7 3h10v18H7zm4 15h2',
    monitor: 'M3 4h18v12H3zm9 12v4m-4 0h8',
    rocket:
      'M12 17 7 12c4-7 8-9 14-9 0 6-2 10-9 14ZM7 12l-4 1 1-5 6-1m2 10-1 4 5-1 1-6M6 18l-3 3',
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}

function StudioDialog({
  title,
  wide,
  busy,
  close,
  children,
}: {
  title: string;
  wide?: boolean;
  busy: boolean;
  close: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="video-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-auto rounded-2xl border border-[#e7e3dc] bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/55 ${
        wide ? 'max-w-5xl' : 'max-w-xl'
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e7e3dc] bg-white px-5 py-3.5">
        <h2 id="video-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          disabled={busy}
          className={button}
          onClick={close}
          aria-label="Đóng"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

function VideoForm({
  video,
  busy,
  save,
}: {
  video?: Video;
  busy: boolean;
  save: (draft: Draft, file: File | null) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const custom = !!video && !channels.includes(video.channel);
  const [draft, setDraft] = useState<Draft>({
    title: video?.title ?? '',
    url: video?.url ?? '',
    channel: custom ? 'Khác' : video?.channel ?? 'Khác',
    customChannel: custom ? video.channel : '',
    ratio: video?.ratio ?? '',
    duration: video?.duration?.toFixed(2) ?? '',
    tags: video?.tags ?? '',
    notes: video?.notes ?? '',
  });
  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save(draft, file);
      }}
    >
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Tiêu đề
          <input
            className={field}
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Tên video"
            required
          />
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          URL video
          <input
            className={field}
            value={draft.url}
            onChange={(event) => update('url', event.target.value)}
            placeholder="https://…/video.mp4"
            required={!file}
            disabled={!!file}
          />
          <span className="block text-xs font-normal text-stone-500">
            Dùng liên kết phát trực tiếp từ CDN, Google Drive hoặc R2.
          </span>
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Hoặc tải tệp video lên
          <input
            type="file"
            accept="video/*,.mkv,.avi,.m4v"
            className={field}
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              if (selected && !draft.title.trim())
                update('title', selected.name);
            }}
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Kênh / Nguồn
          <select
            className={field}
            value={draft.channel}
            onChange={(event) => update('channel', event.target.value)}
          >
            {channels.map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
          </select>
        </label>
        {draft.channel === 'Khác' && (
          <label className="space-y-1 text-sm font-medium">
            Tên nguồn tùy chỉnh
            <input
              className={field}
              value={draft.customChannel}
              onChange={(event) => update('customChannel', event.target.value)}
            />
          </label>
        )}
        <label className="space-y-1 text-sm font-medium">
          Định dạng
          <select
            className={field}
            value={draft.ratio}
            onChange={(event) =>
              update('ratio', event.target.value as Draft['ratio'])
            }
          >
            <option value="">Tự nhận diện</option>
            <option value="9:16">9:16 Dọc</option>
            <option value="16:9">16:9 Ngang</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Thời lượng (giây)
          <input
            type="number"
            min="0"
            step="any"
            className={field}
            value={draft.duration}
            onChange={(event) => update('duration', event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Thẻ
          <input
            className={field}
            value={draft.tags}
            onChange={(event) => update('tags', event.target.value)}
            placeholder="Ưu đãi, mùa hè"
          />
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Ghi chú
          <textarea
            rows={3}
            className={field}
            value={draft.notes}
            onChange={(event) => update('notes', event.target.value)}
          />
        </label>
      </fieldset>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className={primary}>
          {busy ? 'Đang lưu…' : 'Lưu video'}
        </button>
      </div>
    </form>
  );
}

function VideoPreview({
  video,
  onMetadata,
  push,
  notify,
}: {
  video: Video;
  onMetadata: (metadata: Metadata) => void;
  push: () => void;
  notify: (message: string, type: 'success' | 'warning') => void;
}) {
  const [autoPlay, setAutoPlay] = useState(false);
  const [failed, setFailed] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <video
          ref={player}
          src={video.url}
          poster={video.thumbnail ?? undefined}
          controls
          playsInline
          autoPlay={autoPlay}
          preload="metadata"
          className="aspect-video max-h-[58vh] w-full rounded-xl bg-stone-950 object-contain"
          onLoadedMetadata={(event) =>
            onMetadata(metadataOf(event.currentTarget))
          }
          onError={() => setFailed(true)}
        />
        {failed && (
          <p role="status" className="text-sm text-amber-800">
            Không phát được video. Hãy kiểm tra quyền truy cập và liên kết phát
            trực tiếp.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoPlay}
            className="accent-[#ee4d2d]"
            onChange={(event) => {
              setAutoPlay(event.target.checked);
              if (event.target.checked)
                void player.current?.play().catch(() => {});
            }}
          />
          Tự động phát
        </label>
      </div>
      <div className="min-w-0 space-y-4">
        <h3 className="break-words font-semibold">{video.title}</h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Độ phân giải</dt>
            <dd>
              {video.width && video.height
                ? `${video.width} × ${video.height}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Thời lượng</dt>
            <dd>{formatDuration(video.duration)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Định dạng</dt>
            <dd>
              <span className={badge}>{video.ratio ?? 'Chưa rõ'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Nguồn</dt>
            <dd>{video.channel}</dd>
          </div>
          {video.tags && (
            <div className="col-span-2">
              <dt className="text-stone-500">Thẻ</dt>
              <dd>{video.tags}</dd>
            </div>
          )}
          {video.notes && (
            <div className="col-span-2">
              <dt className="text-stone-500">Ghi chú</dt>
              <dd className="whitespace-pre-wrap break-words">{video.notes}</dd>
            </div>
          )}
        </dl>
        <div className="space-y-2">
          <label className="block space-y-1 text-sm text-stone-600">
            URL trực tiếp
            <input className={field} readOnly value={video.url} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(video.url, window.location.href).href
                  );
                  notify('Đã sao chép URL.', 'success');
                } catch {
                  notify('Không thể sao chép URL.', 'warning');
                }
              }}
            >
              Sao chép URL
            </button>
            <a
              href={video.url}
              download={video.filename || video.title}
              target="_blank"
              rel="noopener noreferrer"
              className={button}
            >
              Tải xuống
            </a>
          </div>
        </div>
        <button type="button" className={primary} onClick={push}>
          <Icon name="rocket" />
          Đẩy vào Chiến Dịch Nuôi Kênh
        </button>
      </div>
    </div>
  );
}

function VideoThumbnail({
  video,
  mode,
  preview,
  onMetadata,
}: {
  video: Video;
  mode?: AspectMode;
  preview: () => void;
  onMetadata: (metadata: Metadata) => void;
}) {
  const [failed, setFailed] = useState(false);
  const frame =
    mode === '9:16'
      ? 'aspect-[9/16]'
      : mode === '16:9'
      ? 'aspect-video'
      : 'aspect-[4/3]';
  return (
    <button
      type="button"
      onClick={preview}
      aria-label={`Xem trước ${video.title}`}
      className={`group relative block overflow-hidden bg-stone-900 text-white ${
        mode ? `w-full ${frame}` : 'h-12 w-20 rounded-md'
      }`}
    >
      <span className="absolute inset-0 grid place-items-center text-stone-400">
        <Icon name="film" className={mode ? 'size-10' : 'size-5'} />
      </span>
      {!failed && (
        <video
          src={video.url}
          poster={video.thumbnail ?? undefined}
          preload={video.thumbnail && video.width ? 'none' : 'metadata'}
          muted
          playsInline
          onLoadedMetadata={(event) =>
            onMetadata(metadataOf(event.currentTarget))
          }
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full ${
            mode === 'contain' ? 'object-contain' : 'object-cover'
          }`}
        />
      )}
      <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="rounded-full bg-black/65 p-2">
          <Icon name="play" />
        </span>
      </span>
      {mode && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-xs tabular-nums">
          {formatDuration(video.duration)}
        </span>
      )}
    </button>
  );
}

function absoluteUrl(url: string) {
  const origin =
    typeof window === 'undefined'
      ? 'https://local.invalid'
      : window.location.origin;
  try {
    return new URL(url, origin).href;
  } catch {
    return url;
  }
}

function sourceUrl(input: string) {
  const url = new URL(input);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error();
  return url.href;
}

function videoFilename(url: string) {
  try {
    const filename = new URL(url, 'https://local.invalid').pathname
      .split('/')
      .pop();
    if (filename) return decodeURIComponent(filename);
  } catch {
    return undefined;
  }
}

export function VideoSourcesComponent() {
  const fetch = useFetch();
  const toaster = useToaster();
  const orgId = useUser()?.orgId;
  const { mutate: mutateCache } = useSWRConfig();
  const storageKey = orgId ? `claro_video_sources:${orgId}` : null;
  const [library, setLibrary] = useState<{
    key: string;
    videos: Video[];
  } | null>(null);
  const [aspectMode, setAspectMode] = useState<AspectMode>('contain');
  const [aspectFilter, setAspectFilter] = useState<AspectMode>('contain');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [observed, setObserved] = useState<Record<string, Metadata>>({});
  const [modal, setModal] = useState<ModalState | null>(null);
  const [campaignId, setCampaignId] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(aspectKey);
      if (saved === '9:16' || saved === '16:9' || saved === 'contain')
        setAspectMode(saved);
    } catch {
      // The display preference can still be used for the current session.
    }
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    let videos: Video[] = [];
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(storageKey) ?? '[]'
      );
      if (Array.isArray(stored)) videos = stored;
    } catch {
      // Start with the backend media library if local storage cannot be read.
    }
    setLibrary({ key: storageKey, videos });
    setSelected(new Set());
    setObserved({});
    setModal(null);
  }, [storageKey]);

  const localVideos = library?.key === storageKey ? library.videos : undefined;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  const mediaQuery = useSWR(
    orgId ? ['/media/video-library', orgId] : null,
    async () => {
      const first = await request<MediaPage>('/media?page=1');
      const rest = await inBatches(Math.max(0, first.pages - 1), (index) =>
        request<MediaPage>(`/media?page=${index + 2}`)
      );
      const videos = new Map<string, Video>();
      for (const { results } of [first, ...rest]) {
        for (const media of results) {
          if (
            [media.name, media.originalName, media.path].some(
              (value) => value && videoExtension.test(value)
            )
          ) {
            videos.set(media.id, fromMedia(media));
          }
        }
      }
      return [...videos.values()];
    }
  );

  const campaignsQuery = useSWR(
    orgId ? '/campaigns' : null,
    () => request<Campaign[]>('/campaigns'),
    { refreshInterval: 30000 }
  );
  const activeCampaigns = (campaignsQuery.data ?? []).filter(
    (campaign) => campaign.isActive
  );
  const queueIds = activeCampaigns
    .filter((campaign) => campaign._count?.media !== 0)
    .map((campaign) => campaign.id)
    .sort();
  const queuesQuery = useSWR(
    orgId && queueIds.length
      ? ['video-library-campaign-queues', orgId, queueIds]
      : null,
    () =>
      inBatches(queueIds.length, (index) =>
        request<CampaignQueue>(
          `/campaigns/${encodeURIComponent(queueIds[index])}`
        )
      ),
    { refreshInterval: 30000 }
  );

  const videos = useMemo(() => {
    const merged = new Map(
      (mediaQuery.data ?? []).map((video) => [video.id, video])
    );
    for (const video of localVideos ?? []) {
      const imported = merged.get(video.id);
      merged.set(video.id, { ...imported, ...video });
    }
    return [...merged.values()].map((video) => {
      const metadata = observed[video.url];
      const width = metadata?.width ?? video.width;
      const height = metadata?.height ?? video.height;
      return {
        ...video,
        width,
        height,
        duration: video.duration ?? metadata?.duration,
        ratio:
          video.ratio ??
          (width && height && width !== height
            ? width < height
              ? ('9:16' as const)
              : ('16:9' as const)
            : undefined),
      };
    });
  }, [mediaQuery.data, localVideos, observed]);

  const { connected, linkedUrls } = useMemo(() => {
    const libraryUrls = new Set(videos.map((video) => absoluteUrl(video.url)));
    const linkedUrls = new Set<string>();
    let connected = 0;
    for (const queue of queuesQuery.data ?? []) {
      const matches = (queue?.media ?? []).filter(
        (item) =>
          item.type === 'video' && libraryUrls.has(absoluteUrl(item.url))
      );
      if (matches.length) connected += 1;
      for (const item of matches) linkedUrls.add(absoluteUrl(item.url));
    }
    return { connected, linkedUrls };
  }, [videos, queuesQuery.data]);

  const filtered = useMemo(() => {
    const query = searchText(search.trim());
    const results = videos.filter(
      (video) =>
        (!channelFilter ||
          (channelFilter === 'Khác'
            ? video.channel === 'Khác' || !channels.includes(video.channel)
            : video.channel === channelFilter)) &&
        (aspectFilter === 'contain' || video.ratio === aspectFilter) &&
        (!query ||
          [
            video.title,
            video.channel,
            video.tags,
            video.filename,
            videoFilename(video.url),
          ].some((value) => value && searchText(value).includes(query)))
    );
    return results.sort((a, b) => {
      if (sort === 'duration') return (b.duration ?? -1) - (a.duration ?? -1);
      if (sort === 'name') return a.title.localeCompare(b.title, 'vi');
      const dateOrder = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      return sort === 'oldest' ? dateOrder : -dateOrder;
    });
  }, [videos, search, channelFilter, aspectFilter, sort]);

  const selectedVideos = videos.filter((video) => selected.has(video.id));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const allVisibleSelected =
    visible.length > 0 && visible.every((video) => selected.has(video.id));
  const queueUnavailable = !!(campaignsQuery.error || queuesQuery.error);
  const queueLoading = campaignsQuery.isLoading || queuesQuery.isLoading;
  const loading = mediaQuery.isLoading || (!!storageKey && !localVideos);

  function observe(video: Video, metadata: Metadata) {
    setObserved((previous) => {
      const existing = previous[video.url];
      if (
        existing &&
        existing.width === metadata.width &&
        existing.height === metadata.height &&
        existing.duration === metadata.duration
      )
        return previous;
      return { ...previous, [video.url]: metadata };
    });
  }

  function persist(videos: Video[]) {
    if (!storageKey) throw new Error('Missing workspace');
    try {
      localStorage.setItem(storageKey, JSON.stringify(videos));
    } catch {
      toaster.show(
        'Không thể lưu thư viện trong trình duyệt. Các thay đổi chỉ có hiệu lực trong phiên này.',
        'warning'
      );
    }
    setLibrary({ key: storageKey, videos });
  }

  function setSelection(items: Video[], checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const { id } of items) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function openPush(items: Video[]) {
    setCampaignId('');
    setModal({ type: 'push', videos: items });
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        mediaQuery.mutate(),
        campaignsQuery.mutate(),
        queuesQuery.mutate(),
      ]);
      toaster.show('Đã cập nhật kho video và chiến dịch.', 'success');
    } catch {
      toaster.show(
        'Không thể cập nhật toàn bộ dữ liệu. Vui lòng thử lại.',
        'warning'
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function save(draft: Draft, file: File | null) {
    if (modal?.type !== 'edit' || !localVideos || busy) return;
    const previous = modal.video;
    const title = draft.title.trim();
    if (!title) {
      toaster.show('Vui lòng nhập tiêu đề video.', 'warning');
      return;
    }
    let url: string;
    try {
      url = draft.url.trim();
      if (!file && url !== previous?.url) url = sourceUrl(url);
    } catch {
      toaster.show(
        'Vui lòng nhập URL video HTTP hoặc HTTPS hợp lệ.',
        'warning'
      );
      return;
    }
    if (
      file &&
      (!file.size ||
        (!file.type.startsWith('video/') && !videoExtension.test(file.name)))
    ) {
      toaster.show('Vui lòng chọn tệp video hợp lệ.', 'warning');
      return;
    }

    setBusy(true);
    try {
      let base: Partial<Video> = {};
      if (file) {
        const data = new FormData();
        data.append('file', file);
        if (previous) data.append('preventSave', 'true');
        const [uploaded, metadata] = await Promise.all([
          request<Media>('/media/upload-simple', {
            method: 'POST',
            body: data,
          }),
          readFileMetadata(file),
        ]);
        if (!uploaded.path) throw new Error('Missing upload path');
        url = uploaded.path;
        base = {
          ...(uploaded.id ? fromMedia(uploaded) : {}),
          ...metadata,
          filename: file.name,
          size: file.size,
          thumbnail: null,
        };
      }
      const unchangedUrl = previous?.url === url;
      const video: Video = {
        id: base.id ?? previous?.id ?? `source:${crypto.randomUUID()}`,
        mediaId: base.mediaId ?? previous?.mediaId,
        title,
        url,
        filename:
          base.filename ??
          (unchangedUrl ? previous?.filename : videoFilename(url)),
        thumbnail: unchangedUrl ? previous?.thumbnail : base.thumbnail,
        size: base.size ?? (unchangedUrl ? previous?.size : undefined),
        width: base.width ?? (unchangedUrl ? previous?.width : undefined),
        height: base.height ?? (unchangedUrl ? previous?.height : undefined),
        channel:
          draft.channel === 'Khác'
            ? draft.customChannel.trim() || 'Khác'
            : draft.channel,
        ratio: draft.ratio || undefined,
        duration:
          draft.duration === '' ? base.duration : Number(draft.duration),
        tags: draft.tags.trim(),
        notes: draft.notes.trim(),
        createdAt: previous?.createdAt ?? new Date().toISOString(),
      };
      persist([...localVideos.filter((item) => item.id !== video.id), video]);
      setModal(null);
      toaster.show(
        previous ? 'Đã cập nhật video.' : 'Đã nạp video mới.',
        'success'
      );
      if (base.mediaId) void mediaQuery.mutate().catch(() => {});
    } catch {
      toaster.show('Không thể lưu video. Vui lòng thử lại.', 'warning');
    } finally {
      setBusy(false);
    }
  }

  async function push(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      modal?.type !== 'push' ||
      busy ||
      !activeCampaigns.some((campaign) => campaign.id === campaignId)
    )
      return;
    const items = modal.videos;
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    setBusy(true);
    try {
      const results = await inBatches(items.length, async (index) => {
        const video = items[index];
        try {
          await request(`${path}/media`, {
            method: 'POST',
            body: JSON.stringify({
              url: absoluteUrl(video.url),
              name: video.title,
              type: 'video',
            }),
          });
          return { video, success: true };
        } catch {
          return { video, success: false };
        }
      });
      const succeeded = results
        .filter((result) => result.success)
        .map((result) => result.video);
      const failed = results
        .filter((result) => !result.success)
        .map((result) => result.video);
      setSelection(succeeded, false);
      setModal(failed.length ? { type: 'push', videos: failed } : null);
      if (succeeded.length) {
        toaster.show(
          `Đã nạp ${succeeded.length} video vào hàng đợi chiến dịch.`,
          'success'
        );
        void Promise.allSettled([
          campaignsQuery.mutate(),
          queuesQuery.mutate(),
          mutateCache(path),
        ]);
      }
      if (failed.length)
        toaster.show(
          `Không thể nạp ${failed.length} video. Bạn có thể thử lại.`,
          'warning'
        );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (modal?.type !== 'delete' || !localVideos || busy) return;
    setBusy(true);
    try {
      const items = modal.videos;
      const results = await inBatches(items.length, async (index) => {
        const video = items[index];
        if (!video.mediaId) return { video, success: true };
        try {
          const response = await fetch(
            `/media/${encodeURIComponent(video.mediaId)}`,
            { method: 'DELETE' }
          );
          return { video, success: response.ok };
        } catch {
          return { video, success: false };
        }
      });
      const succeeded = results
        .filter((result) => result.success)
        .map((result) => result.video);
      const failed = results
        .filter((result) => !result.success)
        .map((result) => result.video);
      const deleted = new Set(succeeded.map((video) => video.id));
      if (succeeded.length) {
        await mediaQuery.mutate(
          (items) => items?.filter((video) => !deleted.has(video.id)),
          { revalidate: false }
        );
        persist(localVideos.filter((video) => !deleted.has(video.id)));
        setSelection(succeeded, false);
        toaster.show(
          `Đã xóa ${succeeded.length} video khỏi thư viện.`,
          'success'
        );
        void mediaQuery.mutate().catch(() => {});
      }
      setModal(failed.length ? { type: 'delete', videos: failed } : null);
      if (failed.length)
        toaster.show(
          `Không thể xóa ${failed.length} video. Vui lòng thử lại.`,
          'warning'
        );
    } finally {
      setBusy(false);
    }
  }

  function checkbox(video: Video) {
    return (
      <input
        type="checkbox"
        aria-label={`Chọn ${video.title}`}
        checked={selected.has(video.id)}
        onChange={(event) => setSelection([video], event.target.checked)}
        className="size-4 cursor-pointer accent-[#ee4d2d]"
      />
    );
  }

  function thumbnail(video: Video, mode?: AspectMode) {
    return (
      <VideoThumbnail
        key={video.url}
        video={video}
        mode={mode}
        preview={() => setModal({ type: 'preview', video })}
        onMetadata={(metadata) => observe(video, metadata)}
      />
    );
  }

  function actions(video: Video) {
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <button
          type="button"
          className={button}
          onClick={() => setModal({ type: 'preview', video })}
          aria-label="Xem trước"
          title="Xem trước"
        >
          <Icon name="play" />
        </button>
        <button
          type="button"
          className={button}
          disabled={!localVideos}
          onClick={() => setModal({ type: 'edit', video })}
          aria-label="Chỉnh sửa"
          title="Chỉnh sửa"
        >
          <Icon name="edit" />
        </button>
        <button
          type="button"
          className={`${button} text-[#c43c22]`}
          onClick={() => openPush([video])}
          aria-label="Đẩy vào chiến dịch"
          title="Đẩy vào chiến dịch"
        >
          <Icon name="rocket" />
        </button>
      </div>
    );
  }

  const summary = [
    {
      label: 'Tổng Nguồn Video',
      value: videos.length,
      note: 'Video trong thư viện',
      icon: 'film',
    },
    {
      label: 'Video Dọc 9:16',
      value: videos.filter((video) => video.ratio === '9:16').length,
      note: 'Shorts, Reels, TikTok',
      icon: 'phone',
    },
    {
      label: 'Video Ngang 16:9',
      value: videos.filter((video) => video.ratio === '16:9').length,
      note: 'YouTube, Facebook',
      icon: 'monitor',
    },
    {
      label: 'Chiến Dịch Nuôi Kênh Đang Dùng',
      value: queueUnavailable || queueLoading ? '—' : connected,
      note: 'Chiến dịch đang chạy có video từ kho',
      icon: 'rocket',
    },
  ] as const;

  return (
    <main className="min-h-full bg-[#f9f8f6] text-stone-900">
      <div className="mx-auto max-w-[1520px] space-y-6 px-4 py-6 sm:px-7 lg:px-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#ee4d2d]/10 text-[#c43c22]">
              <Icon name="film" className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Kho Nguồn Video
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Quản lý video đa kênh và nạp vào chiến dịch nuôi kênh.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              disabled={refreshing || !orgId}
              onClick={() => void refresh()}
            >
              <Icon
                name="refresh"
                className={refreshing ? 'size-4 animate-spin' : 'size-4'}
              />
              Làm mới
            </button>
            <button
              type="button"
              className={primary}
              disabled={!localVideos}
              onClick={() => setModal({ type: 'edit' })}
            >
              + Nạp Video Mới
            </button>
          </div>
        </header>

        <section
          aria-label="Tổng quan kho video"
          className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        >
          {summary.map(({ label, value, note, icon }) => (
            <article
              key={label}
              className={`${panel} flex items-start gap-3 p-3.5 sm:p-4`}
            >
              <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-[#ee4d2d]/10 text-[#c43c22] sm:grid">
                <Icon name={icon} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-stone-700">
                  {label}
                </h2>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {loading ? '—' : value}
                </p>
                <p className="mt-1 text-xs text-stone-500">{note}</p>
              </div>
            </article>
          ))}
        </section>

        <section aria-label="Bộ lọc video" className={`${panel} space-y-3 p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Tỉ lệ khung xem"
            >
              {modes.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={aspectMode === value}
                  className={`${button} rounded-full aria-pressed:border-[#ee4d2d] aria-pressed:bg-[#ee4d2d]/10 aria-pressed:text-[#c43c22]`}
                  onClick={() => {
                    setAspectMode(value);
                    try {
                      localStorage.setItem(aspectKey, value);
                    } catch {
                      // Keep the selected display mode in memory.
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className="flex gap-1.5"
              role="group"
              aria-label="Kiểu hiển thị"
            >
              <button
                type="button"
                className={`${button} aria-pressed:bg-stone-100`}
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
              >
                <Icon name="grid" />
                Thẻ
              </button>
              <button
                type="button"
                className={`${button} aria-pressed:bg-stone-100`}
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
              >
                <Icon name="table" />
                Bảng
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,2fr)_repeat(3,minmax(0,1fr))]">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
              />
              <input
                type="search"
                aria-label="Tìm video"
                placeholder="Tìm tiêu đề, kênh, thẻ hoặc tên tệp"
                className={`${field} pl-9`}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className={field}
              aria-label="Lọc theo nguồn"
              value={channelFilter}
              onChange={(event) => {
                setChannelFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả nguồn</option>
              {channels.map((channel) => (
                <option key={channel}>{channel}</option>
              ))}
            </select>
            <select
              className={field}
              aria-label="Lọc theo định dạng"
              value={aspectFilter}
              onChange={(event) => {
                setAspectFilter(event.target.value as AspectMode);
                setPage(1);
              }}
            >
              <option value="contain">Tất cả định dạng</option>
              <option value="9:16">9:16 Dọc</option>
              <option value="16:9">16:9 Ngang</option>
            </select>
            <select
              className={field}
              aria-label="Sắp xếp video"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as Sort);
                setPage(1);
              }}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="duration">Thời lượng</option>
              <option value="name">Tên A–Z</option>
            </select>
          </div>
        </section>

        {(mediaQuery.error || queueUnavailable) && (
          <p
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {mediaQuery.error && 'Không thể tải thư viện media. '}
            {queueUnavailable && 'Không thể tải đầy đủ dữ liệu chiến dịch. '}
            Dùng nút Làm mới để thử lại.
          </p>
        )}
        {selectedVideos.length > 0 && (
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ee4d2d]/25 bg-[#fff4ef] p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <strong className="text-sm" aria-live="polite">
                Đã chọn {selectedVideos.length} video
              </strong>
              <button
                type="button"
                className="text-sm text-stone-600 underline"
                onClick={() => setSelected(new Set())}
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={primary}
                onClick={() => openPush(selectedVideos)}
              >
                🚀 Đẩy hàng loạt vào Chiến Dịch Nuôi Kênh
              </button>
              <button
                type="button"
                className={button}
                disabled={!localVideos}
                onClick={() =>
                  setModal({ type: 'delete', videos: selectedVideos })
                }
              >
                🗑️ Xóa đã chọn
              </button>
            </div>
          </div>
        )}

        {visible.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-[#ee4d2d]"
                checked={allVisibleSelected}
                onChange={(event) =>
                  setSelection(visible, event.target.checked)
                }
              />
              Chọn tất cả trên trang
            </label>
            <span>{filtered.length} video</span>
          </div>
        )}

        {visible.length === 0 ? (
          <div
            role="status"
            className={`${panel} grid min-h-48 place-items-center px-6 py-9 text-center`}
          >
            <div className="space-y-2">
              <Icon name="film" className="mx-auto size-8 text-[#c43c22]" />
              <p className="font-semibold">
                {loading
                  ? 'Đang tải video…'
                  : videos.length
                  ? 'Không tìm thấy video phù hợp'
                  : 'Chưa có nguồn video'}
              </p>
              {!loading && !videos.length && (
                <button
                  type="button"
                  className={button}
                  disabled={!localVideos}
                  onClick={() => setModal({ type: 'edit' })}
                >
                  Nạp video đầu tiên
                </button>
              )}
            </div>
          </div>
        ) : view === 'grid' ? (
          <ul
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
              aspectMode === '9:16' ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
            }`}
          >
            {visible.map((video) => (
              <li
                key={video.id}
                className={`${panel} min-w-0 overflow-hidden ${
                  selected.has(video.id) ? 'ring-2 ring-[#ee4d2d]/55' : ''
                }`}
              >
                <div className="relative">
                  {thumbnail(video, aspectMode)}
                  <div className="absolute left-2 top-2 flex rounded-md bg-white p-1.5 shadow-sm">
                    {checkbox(video)}
                  </div>
                </div>
                <div className="space-y-3 p-3.5">
                  <h2 title={video.title} className="truncate font-semibold">
                    {video.title}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={badge}>{video.channel}</span>
                    <span className="rounded-full bg-[#ee4d2d]/10 px-2.5 py-1 text-xs font-medium text-[#ad3520]">
                      {video.ratio ?? 'Chưa rõ'}
                    </span>
                  </div>
                  {actions(video)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${panel} overflow-x-auto`}>
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-[#f4f1ec] text-xs font-semibold text-stone-700">
                <tr>
                  {[
                    'Chọn',
                    'Ảnh xem trước',
                    'Tiêu đề',
                    'Kênh / Nguồn',
                    'Thời lượng',
                    'Dung lượng',
                    'Định dạng',
                    'Trạng thái',
                    'Ngày thêm',
                    'Thao tác',
                  ].map((label) => (
                    <th key={label} scope="col" className="px-3 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e3dc]">
                {visible.map((video) => (
                  <tr
                    key={video.id}
                    className={
                      selected.has(video.id)
                        ? 'bg-[#fff4ef]'
                        : 'hover:bg-[#f9f8f6]'
                    }
                  >
                    <td className="px-3 py-2">{checkbox(video)}</td>
                    <td className="px-3 py-2">{thumbnail(video)}</td>
                    <td className="max-w-56 px-3 py-2">
                      <div
                        className="truncate font-semibold"
                        title={video.title}
                      >
                        {video.title}
                      </div>
                      {video.filename && video.filename !== video.title && (
                        <div className="truncate text-xs text-stone-500">
                          {video.filename}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={badge}>{video.channel}</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatDuration(video.duration)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {formatSize(video.size)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={badge}>{video.ratio ?? 'Chưa rõ'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={badge}>
                        {queueUnavailable || queueLoading
                          ? 'Chưa rõ'
                          : linkedUrls.has(absoluteUrl(video.url))
                          ? 'Đang dùng'
                          : 'Chưa dùng'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {video.createdAt
                        ? dateFormat.format(new Date(video.createdAt))
                        : '—'}
                    </td>
                    <td className="px-3 py-2">{actions(video)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Phân trang video"
            className="flex items-center justify-end gap-3 text-sm text-stone-600"
          >
            <button
              type="button"
              className={button}
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Trang trước
            </button>
            <span>
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className={button}
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Trang sau
            </button>
          </nav>
        )}
      </div>

      {modal?.type === 'edit' && (
        <StudioDialog
          title={modal.video ? 'Chỉnh sửa nguồn video' : 'Nạp Video Mới'}
          busy={busy}
          close={() => setModal(null)}
        >
          <VideoForm video={modal.video} busy={busy} save={save} />
        </StudioDialog>
      )}
      {modal?.type === 'preview' && (
        <StudioDialog
          title="Xem trước video"
          wide
          busy={false}
          close={() => setModal(null)}
        >
          <VideoPreview
            video={
              videos.find((video) => video.id === modal.video.id) ?? modal.video
            }
            onMetadata={(metadata) => observe(modal.video, metadata)}
            push={() => openPush([modal.video])}
            notify={(message, type) => toaster.show(message, type)}
          />
        </StudioDialog>
      )}
      {modal?.type === 'push' && (
        <StudioDialog
          title="Đẩy vào Chiến Dịch Nuôi Kênh"
          busy={busy}
          close={() => setModal(null)}
        >
          <form onSubmit={push} className="space-y-4">
            <p className="text-sm text-stone-600">
              Chọn chiến dịch để thêm {modal.videos.length} video vào hàng đợi.
            </p>
            <label className="block space-y-1 text-sm font-medium">
              Chiến dịch đang hoạt động
              <select
                className={field}
                value={campaignId}
                disabled={busy || !activeCampaigns.length}
                onChange={(event) => setCampaignId(event.target.value)}
                required
              >
                <option value="">
                  {campaignsQuery.isLoading
                    ? 'Đang tải chiến dịch…'
                    : 'Chọn chiến dịch'}
                </option>
                {activeCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
            {campaignsQuery.error ? (
              <p role="status" className="text-sm text-amber-800">
                Không thể tải chiến dịch.{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void campaignsQuery.mutate().catch(() => {})}
                >
                  Thử lại
                </button>
              </p>
            ) : (
              !campaignsQuery.isLoading &&
              !activeCampaigns.length && (
                <p role="status" className="text-sm text-stone-600">
                  Chưa có chiến dịch nào đang hoạt động.
                </p>
              )
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  busy ||
                  !activeCampaigns.some(
                    (campaign) => campaign.id === campaignId
                  )
                }
                className={primary}
              >
                {busy ? 'Đang nạp…' : 'Xác nhận nạp'}
              </button>
            </div>
          </form>
        </StudioDialog>
      )}
      {modal?.type === 'delete' && (
        <StudioDialog
          title="Xóa video đã chọn?"
          busy={busy}
          close={() => setModal(null)}
        >
          <p className="text-sm text-stone-600">
            Xóa {modal.videos.length} video khỏi kho. Các mục đã nạp vào hàng
            đợi chiến dịch vẫn nằm trong chiến dịch.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className={button}
              disabled={busy}
              onClick={() => setModal(null)}
            >
              Hủy
            </button>
            <button
              type="button"
              className={primary}
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? 'Đang xóa…' : 'Xác nhận xóa'}
            </button>
          </div>
        </StudioDialog>
      )}
    </main>
  );
}
