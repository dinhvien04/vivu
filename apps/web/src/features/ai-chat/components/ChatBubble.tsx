'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
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
  detectedPlace: string;
  askFollowUp: string;
  feedbackHelpful: string;
  feedbackWrong: string;
  feedbackMissing: string;
  feedbackThanks: string;
  lowConfidence: (place: string, score: string) => string;
}

export function ChatBubble({
  message,
  labels,
  onFeedback,
}: {
  message: ChatMessage;
  labels: ChatBubbleLabels;
  onFeedback?: (message: ChatMessage, value: 'helpful' | 'wrong' | 'missing_info') => void;
}) {
  const [feedback, setFeedback] = useState<'idle' | 'helpful' | 'wrong' | 'missing_info'>('idle');
  const assistant = message.role === 'assistant';
  const response = message.response;
  const topMatch = response?.matched_images?.[0];
  const detectedName = topMatch?.location_name ?? topMatch?.place_slug;
  const detectedScore =
    topMatch?.score !== undefined ? `${(topMatch.score * 100).toFixed(1)}%` : undefined;
  const lowConfidence =
    detectedName && topMatch?.score !== undefined && topMatch.score < 0.7
      ? labels.lowConfidence(detectedName, detectedScore ?? '')
      : null;
  const feedbackActions: Array<{
    value: 'helpful' | 'wrong' | 'missing_info';
    label: string;
    icon: string;
  }> = [
    { value: 'helpful', label: labels.feedbackHelpful, icon: 'thumb_up' },
    { value: 'wrong', label: labels.feedbackWrong, icon: 'thumb_down' },
    { value: 'missing_info', label: labels.feedbackMissing, icon: 'info' },
  ];

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

        {assistant && detectedName && (
          <section className="mt-4 rounded-xl border border-primary/20 bg-primary-fixed/50 p-3 text-on-primary-fixed">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {labels.detectedPlace}
                </p>
                <p className="mt-1 text-body-sm">
                  <span className="font-semibold">{detectedName}</span>
                  {detectedScore ? ` · ${labels.score}: ${detectedScore}` : ''}
                </p>
              </div>
              {topMatch?.place_slug && (
                <Link
                  href={`/ai-chat?place=${topMatch.place_slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
                >
                  <Icon name="chat" size={15} />
                  {labels.askFollowUp}
                </Link>
              )}
            </div>
            {lowConfidence && (
              <p className="mt-2 text-xs text-on-surface-variant">{lowConfidence}</p>
            )}
          </section>
        )}

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
        {assistant && !message.error && onFeedback && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-outline-variant/40 pt-3">
            {feedbackActions.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => {
                  setFeedback(action.value);
                  onFeedback(message, action.value);
                }}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  feedback === action.value
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name={action.icon} size={14} />
                {action.label}
              </button>
            ))}
            {feedback !== 'idle' && (
              <span className="text-xs font-semibold text-primary">{labels.feedbackThanks}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
