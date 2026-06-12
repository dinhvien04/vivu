import Image from 'next/image';
import { Icon } from '@/components/icon';
import type { ChatMessage } from '../types/ai-chat.types';
import { MatchedImages } from './MatchedImages';
import { SourcesList } from './SourcesList';

interface ChatBubbleLabels {
  assistant: string;
  userImage: string;
  places: string;
  matchedImages: string;
  sources: string;
  showMore: string;
  showLess: string;
  score: string;
}

export function ChatBubble({
  message,
  labels,
}: {
  message: ChatMessage;
  labels: ChatBubbleLabels;
}) {
  const assistant = message.role === 'assistant';
  const response = message.response;

  return (
    <article className={`flex items-start gap-3 ${assistant ? 'justify-start' : 'justify-end'}`}>
      {assistant && (
        <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
          <Icon name="travel_explore" size={20} />
        </div>
      )}
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[78%] ${
          assistant
            ? message.error
              ? 'border border-error/30 bg-error-container text-on-error-container'
              : 'border border-outline-variant/40 bg-surface-container-lowest text-on-surface'
            : 'bg-primary text-on-primary'
        }`}
      >
        {assistant && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {labels.assistant}
          </p>
        )}
        {message.imagePreviewUrl && (
          <div className="relative mb-3 aspect-video max-w-sm overflow-hidden rounded-xl bg-surface-container">
            <Image
              src={message.imagePreviewUrl}
              alt={labels.userImage}
              fill
              sizes="(max-width: 640px) 80vw, 380px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        {message.content && <p className="whitespace-pre-wrap text-body-md">{message.content}</p>}

        {response?.places && response.places.length > 0 && (
          <section className="mt-4">
            <h4 className="mb-2 text-label-caps uppercase text-on-surface-variant">
              {labels.places}
            </h4>
            <div className="flex flex-wrap gap-2">
              {response.places.slice(0, 5).map((place, index) => (
                <div
                  key={`${place.slug ?? place.name ?? 'place'}-${index}`}
                  className="rounded-full border border-primary/20 bg-primary-fixed px-3 py-1.5 text-body-sm text-on-primary-fixed"
                >
                  <span className="font-semibold">{place.name ?? place.slug ?? '—'}</span>
                  {place.province ? ` · ${place.province}` : ''}
                  {place.score !== undefined ? ` · ${(place.score * 100).toFixed(1)}%` : ''}
                </div>
              ))}
            </div>
          </section>
        )}

        {response?.matched_images && (
          <MatchedImages
            images={response.matched_images}
            title={labels.matchedImages}
            scoreLabel={labels.score}
          />
        )}
        {response?.sources && (
          <SourcesList
            sources={response.sources}
            title={labels.sources}
            showMore={labels.showMore}
            showLess={labels.showLess}
            scoreLabel={labels.score}
          />
        )}
      </div>
    </article>
  );
}
