'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-provider';
import { Icon } from './icon';

/**
 * Notifications bell shown when the viewer is logged in (admin or any
 * authenticated area such as `/so-tay`).
 *
 * The notifications backend does not exist yet, so the dropdown deliberately
 * shows an empty state. This is wired up in the header now so the surface is
 * available to plug into as soon as the API ships.
 */
export function NotificationsButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
      >
        <Icon name="notifications" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Hộp thư thông báo"
          className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3">
            <h3 className="font-h4 text-h4 text-on-surface">Thông báo</h3>
            <button
              type="button"
              disabled
              className="text-label-md text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
              title="Sắp ra mắt"
            >
              Đánh dấu đã đọc
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Icon
              name="notifications_off"
              className="!text-3xl text-outline"
              style={{ fontVariationSettings: "'FILL' 1" }}
            />
            <p className="text-body-md font-semibold text-on-surface">Chưa có thông báo mới</p>
            <p className="text-body-sm text-on-surface-variant">
              Vivu sẽ gửi thông báo khi có hoạt động liên quan tới tài khoản của bạn.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
