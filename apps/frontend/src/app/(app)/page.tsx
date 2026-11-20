'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const samplePrompt = 'Soạn 5 bài viết giới thiệu bộ sưu tập mới kèm hình ảnh, phân bổ vào khung giờ vàng tuần tới trên Fanpage và TikTok.';

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(samplePrompt);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  const platforms = [
    { name: 'Facebook', desc: 'Trang & Nhóm' },
    { name: 'Instagram', desc: 'Feed & Reels' },
    { name: 'TikTok', desc: 'Video ngắn' },
    { name: 'YouTube', desc: 'Shorts & Video' },
    { name: 'Threads', desc: 'Bài viết ngắn' },
    { name: 'LinkedIn', desc: 'Hồ sơ & Công ty' },
    { name: 'X / Twitter', desc: 'Tweets & Threads' },
    { name: 'Pinterest', desc: 'Ghim hình ảnh' },
  ];

  const faqs = [
    {
      q: 'Dùng thử 14 ngày có mất phí hoặc cần thẻ tín dụng không?',
      a: 'Hoàn toàn không. Bạn chỉ cần đăng ký bằng tài khoản Google hoặc Email là được kích hoạt ngay gói dùng thử 14 ngày với đầy đủ tính năng, kết nối tối đa 8 kênh mạng xã hội mà không cần nhập thẻ tín dụng hay Visa/Mastercard.',
    },
    {
      q: 'Đăng bài tự động qua Social có bị checkpoint hay khóa tài khoản không?',
      a: 'Không. Social kết nối hoàn toàn thông qua API và OAuth 2.0 chính thức được phê duyệt bởi Meta (Facebook, Instagram, Threads), TikTok, Google (YouTube), LinkedIn, X và Pinterest. Chúng tôi không sử dụng tool cào lậu hay giả lập trình duyệt, đảm bảo an toàn tuyệt đối 100% cho kênh của bạn.',
    },
    {
      q: 'Kết nối AI qua giao thức MCP (Model Context Protocol) hoạt động như thế nào?',
      a: 'Trong phần Cài đặt > Apps, bạn tạo một ứng dụng OAuth hoặc lấy Token API. Sau đó thêm Social MCP vào trợ lý AI của bạn (như Claude Desktop, Cursor, Gemini CLI, n8n, ChatGPT). Bạn chỉ cần gõ yêu cầu bằng tiếng Việt (ví dụ: "Lên lịch 3 bài cho tuần này"), AI sẽ tự động phân tích khung giờ vàng và tạo lịch đăng trong Social.',
    },
    {
      q: 'Cách thanh toán gói Standard 99.000đ/tháng như thế nào?',
      a: 'Hệ thống hỗ trợ quét mã VietQR tự động. Bạn chỉ cần mở bất kỳ ứng dụng ngân hàng nào tại Việt Nam (Vietcombank, Techcombank, MB, ACB,...) hoặc MoMo, quét mã QR hiển thị trên màn hình. Gói cước của bạn sẽ được kích hoạt tức thì chỉ sau vài giây.',
    },
    {
      q: 'Tôi có thể quản lý nhiều kênh cùng một lúc và phân quyền cho nhân viên không?',
      a: 'Có. Gói Pro và Doanh nghiệp hỗ trợ tính năng Quản lý Đội nhóm (Teams), cho phép bạn mời cộng sự, biên tập viên vào soạn bài và phân quyền duyệt bài trước khi xuất bản ra các kênh chính thức.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f8f6] text-stone-900 selection:bg-[#ee4d2d] selection:text-white">
      {/* Sticky Header / Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#e7e3dc] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#ee4d2d] to-[#ff6640] flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xl tracking-tight">S</span>
            </div>
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-stone-900">
              Social<span className="text-[#ee4d2d]">.</span>
            </span>
          </Link>

          {/* Nav links (Desktop) */}
          <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition-colors">Tính năng</a>
            <a href="#heatmap" className="hover:text-stone-900 transition-colors">Khung giờ vàng</a>
            <a href="#mcp" className="hover:text-stone-900 transition-colors flex items-center gap-1.5">
              <span>Kết nối AI (MCP)</span>
            </a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Bảng giá 99k</a>
            <a href="#faq" className="hover:text-stone-900 transition-colors">Hỏi đáp</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium px-2 sm:px-4 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-[#f5f3ef] transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="text-sm px-3 sm:px-5 py-2.5 rounded-xl transition-all bg-[#ee4d2d] hover:bg-[#d94121] text-white font-bold shadow-md shadow-[#ee4d2d]/25"
            >
              Dùng thử 14 ngày
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(120%_90%_at_0%_0%,rgba(238,77,45,0.10),transparent_60%),radial-gradient(90%_80%_at_100%_100%,rgba(234,88,12,0.06),transparent_60%)] text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50/90 border border-orange-200 text-xs font-semibold text-[#ee4d2d] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#ee4d2d] shrink-0" />
            <span>Hệ sinh thái xuất bản mạng xã hội tự động × AI MCP</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 max-w-5xl mx-auto leading-[1.18] sm:leading-[1.15]">
            Phần mềm đăng bài tự động đa kênh thông minh cho{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ee4d2d] to-[#ea580c]">
              Doanh Nghiệp & Creator
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Lên lịch đăng bài tập trung lên Facebook, TikTok, Instagram, YouTube, Threads, LinkedIn. Tối ưu thời điểm vàng tương tác cao và giao việc tự động cho AI chỉ với một câu prompt tiếng Việt.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#ee4d2d] hover:bg-[#d94121] text-white font-bold shadow-md shadow-[#ee4d2d]/25 text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Bắt đầu dùng thử 14 ngày miễn phí</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-[#f5f3ef] border border-[#e7e3dc] text-stone-900 font-semibold text-base transition-colors"
            >
              Xem bảng giá chỉ 99k/tháng →
            </a>
          </div>

          {/* Value Props Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-stone-600">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              14 ngày đầy đủ tính năng
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Không yêu cầu thẻ tín dụng
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Quét mã VietQR tiện lợi
            </span>
          </div>

          {/* Supported Platforms Grid */}
          <div className="mt-14 pt-10 border-t border-[#e7e3dc]">
            <p className="text-xs uppercase tracking-widest font-semibold text-stone-600 mb-6">
              Hỗ trợ kết nối chính thức các nền tảng mạng xã hội phổ biến
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 max-w-6xl mx-auto">
              {platforms.map((p) => (
                <div
                  key={p.name}
                  className="px-3 py-4 flex flex-col items-center justify-center text-center bg-white border border-[#e7e3dc] rounded-2xl shadow-[var(--preview-box-shadow)] hover:shadow-md hover:border-orange-300 transition-all text-stone-900"
                >
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="text-[11px] text-stone-600 mt-0.5">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature 1 & 2 Spotlight: Best Time Heatmap & Command Palette */}
        <section id="features" className="scroll-mt-24 py-20 bg-[#f9f8f6] border-y border-[#e7e3dc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 mt-2">
                Công cụ tối tân giúp bạn bứt phá tương tác
              </h2>
              <p className="mt-4 text-stone-600 text-sm sm:text-base">
                Không chỉ lên lịch đơn thuần, Social tích hợp thuật toán phân tích hành vi người dùng và trải nghiệm phím tắt đỉnh cao.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Heatmap Card */}
              <div id="heatmap" className="scroll-mt-24 p-5 sm:p-7 bg-white border border-[#e7e3dc] rounded-2xl shadow-[var(--preview-box-shadow)] hover:shadow-md hover:border-orange-300 transition-all text-stone-900">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="text-xs text-stone-600 font-mono">7 ngày × 24 giờ</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900">Biểu đồ thời điểm vàng (Best Time Heatmap)</h3>
                <p className="mt-2 text-stone-600 text-sm leading-relaxed">
                  Thuật toán đo lường mật độ tương tác cho từng mạng xã hội (Facebook, TikTok, LinkedIn,...). Hệ thống tô sáng các ô giờ vàng có tỷ lệ reach cao nhất, chỉ cần 1 cú click để lên lịch vào thời điểm tối ưu.
                </p>
                <figure className="mt-6 rounded-xl border border-[#e7e3dc] bg-[#f9f8f6] p-3 sm:p-4">
                  <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
                    <span>Minh họa · Thứ Tư, 19:00–21:00</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold tabular-nums text-emerald-800">
                      Giờ vàng · 98/100
                    </span>
                  </figcaption>
                  <div aria-hidden="true" className="mt-4 grid grid-cols-[auto_repeat(7,minmax(0,1fr))] items-center gap-1.5">
                    <span />
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                      <span key={day} className="text-center text-xs text-stone-600">{day}</span>
                    ))}
                    {[
                      ['08:00', '1121121'],
                      ['12:00', '1212210'],
                      ['19:00', '2232221'],
                      ['22:00', '1211221'],
                    ].map(([hour, levels]) => (
                      <React.Fragment key={hour}>
                        <span className="pr-1 font-mono text-xs tabular-nums text-stone-600">{hour}</span>
                        {Array.from(levels, Number).map((level, index) => (
                          <div
                            key={index}
                            className={`flex h-5 items-center justify-center rounded ${['bg-[#f5f3ef]', 'bg-orange-100', 'bg-orange-300', 'bg-[#ee4d2d] text-white'][level]}`}
                          >
                            {level === 3 && '✓'}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </figure>
              </div>

              {/* Command Palette Card */}
              <div className="p-5 sm:p-7 bg-white border border-[#e7e3dc] rounded-2xl shadow-[var(--preview-box-shadow)] hover:shadow-md hover:border-orange-300 transition-all text-stone-900">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="text-xs text-stone-600 font-mono">⌘K / Ctrl+K</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900">Bảng lệnh thông minh (Command Palette)</h3>
                <p className="mt-2 text-stone-600 text-sm leading-relaxed">
                  Điều khiển toàn bộ ứng dụng chỉ bằng bàn phím. Nhấn <code>⌘K</code> để tìm kiếm bài viết, chuyển trang phân tích, mở thư viện đa phương tiện hoặc tạo bài mới tức thì mà không cần dùng chuột.
                </p>
                <div className="mt-6 p-4 rounded-xl bg-[#f9f8f6] border border-[#e7e3dc] space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#e7e3dc] text-xs text-stone-700">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" strokeWidth={2} />
                      <path d="m21 21-4.3-4.3" strokeWidth={2} />
                    </svg>
                    <span>Tìm tác vụ, trang và cài đặt…</span>
                    <kbd className="ml-auto text-[10px] bg-[#f5f3ef] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs px-3 py-1.5 text-stone-600">
                    <span>Tạo bài đăng mới</span>
                    <kbd className="text-[10px] bg-[#f5f3ef] px-1.5 py-0.5 rounded font-mono">C</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs px-3 py-1.5 text-stone-600">
                    <span>Lịch xuất bản</span>
                    <kbd className="text-[10px] bg-[#f5f3ef] px-1.5 py-0.5 rounded font-mono">L</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase: AI & MCP Protocol */}
        <section id="mcp" className="scroll-mt-24 py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-5 sm:p-14 bg-white border border-[#e7e3dc] shadow-[var(--preview-box-shadow)]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-800 text-xs font-bold border border-orange-200 mb-4">
                ✦ AUTO SOCIAL × MODEL CONTEXT PROTOCOL
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                Kết nối AI. Giao việc bằng một prompt tiếng Việt.
              </h2>
              <p className="mt-4 text-stone-600 text-base sm:text-lg leading-relaxed">
                Từ <strong>Claude Desktop, Cursor, Gemini CLI đến ChatGPT & n8n</strong>: kết nối với Social qua giao thức MCP để soạn bài, chọn kênh và đặt lịch chỉ bằng một câu lệnh tự nhiên.
              </p>
            </div>

            {/* Prompt Box Interactive Showcase */}
            <div className="mt-10 max-w-2xl bg-[#f9f8f6] border border-[#e7e3dc] rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 pb-3 border-b border-[#e7e3dc]">
                <div className="flex items-center gap-2 font-mono">
                  <span aria-hidden="true" className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>Agent Prompt (Claude / ChatGPT / Cursor)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f5f3ef] border border-[#e7e3dc] text-stone-900 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  Sao chép prompt
                </button>
              </div>

              <pre className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
                <code>
                  <span className="font-semibold text-orange-800">prompt</span>
                  <span className="text-stone-600">: </span>
                  <span className="text-emerald-800">{JSON.stringify(samplePrompt)}</span>
                </code>
              </pre>
              <p role="status" className="text-sm text-stone-700">
                {copyStatus === 'copied' && 'Đã sao chép prompt.'}
                {copyStatus === 'error' && 'Không thể sao chép tự động. Hãy chọn và sao chép nội dung prompt ở trên.'}
              </p>

              <div className="mt-4 pt-4 border-t border-[#e7e3dc] flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono">200 OK</span>
                <span>AI gọi công cụ <code className="font-semibold text-orange-800">social_create_post</code> và phân bổ lịch đăng tự động.</span>
              </div>
            </div>

            {/* Steps */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#e7e3dc]">
              <div>
                <span className="text-sm font-bold text-orange-800">01. Lấy Token</span>
                <p className="text-xs text-stone-600 mt-1">Tạo ứng dụng OAuth trong Cài đặt &gt; Apps để nhận mã token kết nối.</p>
              </div>
              <div>
                <span className="text-sm font-bold text-orange-800">02. Thêm vào MCP</span>
                <p className="text-xs text-stone-600 mt-1">Dán cấu hình Social MCP Server vào Claude Desktop hoặc Cursor.</p>
              </div>
              <div>
                <span className="text-sm font-bold text-orange-800">03. Giao việc tự động</span>
                <p className="text-xs text-stone-600 mt-1">Nói bằng tiếng Việt để AI tự động xuất bản bài viết lên các kênh.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="scroll-mt-24 py-20 bg-[#f9f8f6] border-t border-[#e7e3dc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2">
                Chi phí tối ưu, hiệu quả tối đa
              </h2>
              <p className="mt-3 text-stone-600 text-sm sm:text-base">
                Không giới hạn số bài đăng. Chọn gói phù hợp với quy mô của bạn.
              </p>

              {/* Billing Cycle Switcher */}
              <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-white border border-[#e7e3dc]">
                <button
                  type="button"
                  aria-pressed={billingCycle === 'monthly'}
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-2 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-[#ee4d2d] text-white shadow-md'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Thanh toán theo tháng
                </button>
                <button
                  type="button"
                  aria-pressed={billingCycle === 'yearly'}
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-2 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all flex flex-wrap items-center justify-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-[#ee4d2d] text-white shadow-md'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>Thanh toán theo năm</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Tiết kiệm 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {/* Free Trial Card */}
              <div className="rounded-2xl p-7 bg-white border border-[#e7e3dc] shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Dùng thử (Trial)</h3>
                  <p className="text-xs text-stone-600 mt-1">Trải nghiệm toàn diện giải pháp</p>
                  <div className="mt-6">
                    <span className="text-4xl font-black text-stone-900">0đ</span>
                    <span className="text-xs text-stone-600 ml-2">/ 14 ngày</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-stone-700">
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Kết nối tối đa 8 kênh mạng xã hội</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Không giới hạn số bài đăng</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Lịch xuất bản & Best Time Heatmap</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Thư viện đa phương tiện 5GB</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Hỗ trợ kết nối AI MCP Server</li>
                  </ul>
                </div>
                <Link
                  href="/auth/register?plan=trial"
                  className="mt-8 block text-center py-3 rounded-xl bg-white hover:bg-[#f5f3ef] border border-[#e7e3dc] text-stone-900 font-semibold text-sm transition-all"
                >
                  Bắt đầu dùng thử miễn phí
                </Link>
              </div>

              {/* Standard Card (Best Seller) */}
              <div className="rounded-2xl p-7 pt-10 bg-white border-2 border-[#ee4d2d] flex flex-col justify-between relative shadow-xl shadow-orange-500/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full bg-[#ee4d2d] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                  Gói được chọn nhiều nhất
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Standard</h3>
                  <p className="text-xs text-stone-600 mt-1">Dành cho cá nhân, Creator & Shop online</p>
                  <div className="mt-6">
                    <span className="text-4xl sm:text-5xl font-black text-stone-900">
                      {billingCycle === 'monthly' ? '99.000đ' : '79.000đ'}
                    </span>
                    <span className="text-xs text-stone-600 ml-2">/ tháng</span>
                    {billingCycle === 'yearly' && (
                      <div className="text-[11px] text-emerald-700 mt-1">Thanh toán 948.000đ / năm (Tiết kiệm 240k)</div>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-stone-700">
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> <strong>8 kênh mạng xã hội chính thức</strong></li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> <strong>Không giới hạn số lượng bài đăng</strong></li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Biểu đồ thời điểm vàng (Best Time Heatmap)</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Hỗ trợ toàn diện giao thức AI MCP Server</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Bảng lệnh nhanh Command Palette ⌘K</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Thư viện đa phương tiện 20GB</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Thanh toán quét mã VietQR tự động</li>
                  </ul>
                </div>
                <Link
                  href="/auth/register?plan=standard"
                  className="mt-8 block text-center py-3.5 rounded-xl bg-[#ee4d2d] hover:bg-[#d94121] text-white font-bold shadow-md shadow-[#ee4d2d]/25 text-sm transition-all"
                >
                  Chọn gói Standard 99k →
                </Link>
              </div>

              {/* Pro Agency Card */}
              <div className="rounded-2xl p-7 bg-white border border-[#e7e3dc] shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Pro Agency</h3>
                  <p className="text-xs text-stone-600 mt-1">Dành cho Team & Doanh nghiệp</p>
                  <div className="mt-6">
                    <span className="text-4xl font-black text-stone-900">
                      {billingCycle === 'monthly' ? '299.000đ' : '239.000đ'}
                    </span>
                    <span className="text-xs text-stone-600 ml-2">/ tháng</span>
                    {billingCycle === 'yearly' && (
                      <div className="text-[11px] text-emerald-700 mt-1">Thanh toán 2.868.000đ / năm</div>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-stone-700">
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> <strong>Không giới hạn số kênh kết nối</strong></li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Quản lý Đội nhóm (Teams) & Phân quyền</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Hệ thống Webhooks & Developer API</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Đăng bài tự động & Tự gắn chữ ký thương hiệu</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Thư viện lưu trữ 100GB</li>
                    <li className="flex items-start gap-2"><span aria-hidden="true" className="text-emerald-600">✓</span> Hỗ trợ kỹ thuật 24/7 ưu tiên</li>
                  </ul>
                </div>
                <Link
                  href="/auth/register?plan=pro"
                  className="mt-8 block text-center py-3 rounded-xl bg-white hover:bg-[#f5f3ef] border border-[#e7e3dc] text-stone-900 font-semibold text-sm transition-all"
                >
                  Đăng ký gói Pro Agency
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Tại sao nên chọn Social thay vì giải pháp khác?
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#e7e3dc] bg-white">
            <table className="w-full text-left text-xs sm:text-sm text-stone-600">
              <thead className="bg-[#f5f3ef] text-stone-700 border-b border-[#e7e3dc]">
                <tr>
                  <th className="p-4 sm:p-5">Tính năng</th>
                  <th className="p-4 sm:p-5 text-orange-800 font-bold">Social.claro.vn</th>
                  <th className="p-4 sm:p-5 text-stone-600">Đăng bài thủ công</th>
                  <th className="p-4 sm:p-5 text-stone-600">Công cụ quốc tế (Buffer, Hootsuite)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e3dc]">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-stone-900">Chi phí hàng tháng</td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">Chỉ từ 99.000đ</td>
                  <td className="p-4 sm:p-5">0đ (Tốn rất nhiều thời gian)</td>
                  <td className="p-4 sm:p-5">1.200.000đ - 3.000.000đ+</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-stone-900">Giao thức AI MCP</td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">Hỗ trợ đầy đủ tiếng Việt</td>
                  <td className="p-4 sm:p-5 text-rose-700">Không hỗ trợ</td>
                  <td className="p-4 sm:p-5 text-rose-700">Không có hoặc rất phức tạp</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-stone-900">Giao diện tiếng Việt</td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">100% Chuẩn tiếng Việt</td>
                  <td className="p-4 sm:p-5">Tiếng Việt</td>
                  <td className="p-4 sm:p-5 text-stone-600">Tiếng Anh</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-stone-900">Biểu đồ giờ vàng (Heatmap)</td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">Ma trận 7x24h trực quan</td>
                  <td className="p-4 sm:p-5 text-rose-700">Tự phỏng đoán</td>
                  <td className="p-4 sm:p-5 text-stone-600">Chỉ có trên gói đắt tiền</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-stone-900">Phương thức thanh toán</td>
                  <td className="p-4 sm:p-5 text-emerald-700 font-bold">Quét mã VietQR ngân hàng</td>
                  <td className="p-4 sm:p-5">—</td>
                  <td className="p-4 sm:p-5 text-stone-600">Bắt buộc thẻ Visa/Mastercard</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="scroll-mt-24 py-20 bg-[#f9f8f6] border-t border-[#e7e3dc]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
                Câu hỏi thường gặp
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.q}
                    className="rounded-xl border border-[#e7e3dc] bg-white"
                  >
                    <button
                      type="button"
                      id={`faq-question-${index}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-3 rounded-xl text-sm sm:text-base font-semibold text-stone-900 hover:text-orange-800 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <svg
                        aria-hidden="true"
                        className={`w-5 h-5 shrink-0 text-stone-600 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      id={`faq-answer-${index}`}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      hidden={!isOpen}
                      className="border-t border-[#e7e3dc] px-5 py-4 text-sm text-stone-600 leading-relaxed"
                    >
                      {faq.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl p-6 sm:p-16 bg-orange-50 border border-orange-200 text-stone-900">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Sẵn sàng đưa việc xuất bản nội dung lên tầm cao mới?
            </h2>
            <p className="mt-4 text-stone-600 max-w-2xl mx-auto text-sm sm:text-base">
              Bắt đầu ngay hôm nay với 14 ngày dùng thử miễn phí. Trải nghiệm sức mạnh của việc đăng bài tự động đa kênh và kết nối AI thông minh.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#ee4d2d] hover:bg-[#d94121] text-white font-bold shadow-md shadow-[#ee4d2d]/25 text-base transition-all"
              >
                Dùng thử 14 ngày miễn phí
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-[#f5f3ef] border border-[#e7e3dc] text-stone-900 font-semibold text-base transition-colors"
              >
                Đăng nhập tài khoản
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7e3dc] bg-white py-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#ee4d2d] to-[#ff6640] flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-semibold text-stone-600">Social by Claro</span>
            <span>— Phần mềm đăng bài tự động đa kênh</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            <Link href="/privacy" className="hover:text-stone-600 transition-colors">Chính sách bảo mật</Link>
            <Link href="/terms" className="hover:text-stone-600 transition-colors">Điều khoản dịch vụ</Link>
            <Link href="/support" className="hover:text-stone-600 transition-colors">Trung tâm hỗ trợ</Link>
          </div>

          <p>© {new Date().getFullYear()} Social. Tất cả các quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
