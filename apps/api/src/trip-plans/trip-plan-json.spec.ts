import { BadGatewayException } from '@nestjs/common';
import { parseTripPlanOutput } from './trip-plan-json';

describe('parseTripPlanOutput', () => {
  it('keeps only place slugs from the allowed set', () => {
    const raw = JSON.stringify({
      title: 'Plan',
      summary: 'Summary',
      days: [
        {
          day: 1,
          theme: 'Coast',
          items: [
            {
              timeOfDay: 'morning',
              placeName: 'Ky Co',
              placeSlug: 'ky-co',
              reason: 'Scenic',
              suggestedDuration: '2h',
              travelNote: 'Go early',
              tips: ['Bring water'],
            },
            {
              timeOfDay: 'afternoon',
              placeName: 'Unknown',
              placeSlug: 'outside-vivu',
              reason: 'Bad slug',
              suggestedDuration: '1h',
              travelNote: 'Skip',
              tips: [],
            },
          ],
        },
      ],
      generalTips: ['Use Vivu data'],
      missingDataNote: null,
    });

    const output = parseTripPlanOutput(raw, new Set(['ky-co']));

    expect(output.days[0]?.items[0]?.placeSlug).toBe('ky-co');
    expect(output.days[0]?.items[1]?.placeSlug).toBeNull();
  });

  it('parses fenced JSON and removes trailing commas', () => {
    const output = parseTripPlanOutput(
      `\`\`\`json
      {
        "title": "Plan",
        "summary": "Summary",
        "days": [
          {
            "day": 1,
            "theme": "Day",
            "items": [
              {
                "timeOfDay": "noon",
                "placeName": "Bien Ho",
                "placeSlug": "bien-ho",
                "reason": "Nice",
                "suggestedDuration": "1h",
                "travelNote": "Check weather",
                "tips": [],
              }
            ],
          }
        ],
        "generalTips": [],
        "missingDataNote": null,
      }
      \`\`\``,
      new Set(['bien-ho']),
    );

    expect(output.title).toBe('Plan');
    expect(output.days).toHaveLength(1);
  });

  it('accepts a top-level array as days when Gemini ignores the root object instruction', () => {
    const output = parseTripPlanOutput(
      JSON.stringify([
        {
          day: 1,
          theme: 'Beach',
          items: [
            {
              timeOfDay: 'morning',
              placeName: 'Ky Co',
              placeSlug: 'ky-co',
              reason: 'Scenic',
              suggestedDuration: '2h',
              travelNote: 'Go early',
              tips: [],
            },
          ],
        },
      ]),
      new Set(['ky-co']),
    );

    expect(output.days).toHaveLength(1);
    expect(output.days[0]?.items[0]?.placeSlug).toBe('ky-co');
  });

  it('extracts balanced JSON from text around the object', () => {
    const output = parseTripPlanOutput(
      `Here is the plan:
      {
        "title": "Plan",
        "summary": "Summary",
        "days": [
          {
            "day": 1,
            "theme": "Day",
            "items": [
              {
                "timeOfDay": "morning",
                "placeName": "Bien Ho",
                "placeSlug": "bien-ho",
                "reason": "Nice",
                "suggestedDuration": "1h",
                "travelNote": "Check weather",
                "tips": ["Use { braces } in text"]
              }
            ]
          }
        ],
        "generalTips": [],
        "missingDataNote": null
      }
      Done.`,
      new Set(['bien-ho']),
    );

    expect(output.title).toBe('Plan');
    expect(output.days[0]?.items[0]?.tips).toEqual(['Use { braces } in text']);
  });

  it('throws when AI output is not usable JSON', () => {
    expect(() => parseTripPlanOutput('not-json', new Set())).toThrow(BadGatewayException);
  });
});
