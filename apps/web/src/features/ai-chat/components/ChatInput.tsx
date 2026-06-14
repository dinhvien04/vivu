'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Icon } from '@/components/icon';
import { prepareChatImage } from '../utils/prepare-chat-image';
import { ImagePreview } from './ImagePreview';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function ChatInput({
  compact = false,
  isSending,
  onSend,
  labels,
}: {
  compact?: boolean;
  isSending: boolean;
  onSend: (params: { message?: string; image?: File | null }) => Promise<void>;
  labels: {
    placeholder: string;
    upload: string;
    send: string;
    removeImage: string;
    invalidType: string;
    tooLarge: string;
  };
}) {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearImage = () => {
    setImage(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(labels.invalidType);
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(labels.tooLarge);
      event.target.value = '';
      return;
    }
    setIsPreparing(true);
    try {
      const prepared = await prepareChatImage(file);
      setImage(prepared);
      setPreviewUrl(URL.createObjectURL(prepared));
    } catch {
      setError(labels.tooLarge);
      event.target.value = '';
    } finally {
      setIsPreparing(false);
    }
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSending || isPreparing || (!message.trim() && !image)) return;
    const currentMessage = message;
    const currentImage = image;
    setMessage('');
    clearImage();
    await onSend({ message: currentMessage, image: currentImage });
  };

  return (
    <form
      onSubmit={submit}
      className={`border-t border-outline-variant/40 bg-surface/95 backdrop-blur-md ${
        compact ? 'p-3' : 'sticky bottom-0 p-3 sm:p-4'
      }`}
    >
      {previewUrl && image && (
        <div className="mb-3">
          <ImagePreview
            previewUrl={previewUrl}
            filename={image.name}
            removeLabel={labels.removeImage}
            onRemove={clearImage}
          />
        </div>
      )}
      {error && <p className="mb-2 text-body-sm text-error">{error}</p>}
      <div className="flex items-end gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2 shadow-sm focus-within:border-primary">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void selectImage(event)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isSending || isPreparing}
          aria-label={labels.upload}
          title={labels.upload}
          className={`flex flex-shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-50 ${
            compact ? 'h-10 w-10' : 'h-11 w-11'
          }`}
        >
          <Icon name={isPreparing ? 'hourglass_top' : 'add_photo_alternate'} />
        </button>
        <textarea
          value={message}
          rows={1}
          disabled={isSending || isPreparing}
          placeholder={labels.placeholder}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          className={`max-h-32 flex-1 resize-none bg-transparent px-2 text-on-surface outline-none placeholder:text-outline ${
            compact ? 'min-h-10 py-2 text-sm' : 'min-h-11 py-2.5 text-body-md'
          }`}
        />
        <button
          type="submit"
          disabled={isSending || isPreparing || (!message.trim() && !image)}
          aria-label={labels.send}
          className={`flex flex-shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 ${
            compact ? 'h-10 w-10' : 'h-11 w-11'
          }`}
        >
          <Icon name="send" size={20} />
        </button>
      </div>
    </form>
  );
}
