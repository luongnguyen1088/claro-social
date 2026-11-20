import type { Metadata } from 'next';
import { VideoSourcesComponent } from '@gitroom/frontend/components/videos/video-sources.component';

export const metadata: Metadata = {
  title: 'Kho Nguồn Video & Asset Studio | Claro Social',
  description:
    'Quản lý nguồn video đa kênh, phân loại định dạng 9:16 / 16:9, xem trước và đẩy tự động vào chiến dịch nuôi kênh',
};

export default function VideosPage() {
  return <VideoSourcesComponent />;
}
