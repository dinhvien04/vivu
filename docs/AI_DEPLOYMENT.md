# AI Travel Assistant deployment

Vivu currently has two production Vercel projects:

- Web: `https://vivu-web.vercel.app`
- API: `https://vivu-api.vercel.app`

Deploy the API first, verify its health endpoints, then deploy the web project.

## API project

Keep the existing Vercel project root/build settings that deploy `apps/api`.

Required production environment variables:

```env
NODE_ENV=production
CORS_ORIGINS=https://vivu-web.vercel.app

QDRANT_URL=https://...
QDRANT_API_KEY=...
QDRANT_TEXT_COLLECTION=text_collection_cloud
QDRANT_IMAGE_COLLECTION=image_collection_cloud
QDRANT_TEXT_MODEL=intfloat/multilingual-e5-small
QDRANT_IMAGE_MODEL=qdrant/clip-vit-b-32-vision
QDRANT_IMAGE_TEXT_MODEL=qdrant/clip-vit-b-32-text

TOP_K_TEXT=5
TOP_K_IMAGES=5
IMAGE_MATCH_THRESHOLD=0.25
AI_MAX_IMAGE_SIZE_BYTES=4194304

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=gia-lai-tourism-images
S3_PRESIGNED_EXPIRES_IN=3600
```

Keep all existing API variables too, including `DATABASE_URL`, JWT secrets,
Cloudinary and any enabled MeiliSearch settings.

After deployment:

```text
GET https://vivu-api.vercel.app/api/v1/healthz
GET https://vivu-api.vercel.app/api/v1/ai/health
GET https://vivu-api.vercel.app/api/v1/ai/health/qdrant
GET https://vivu-api.vercel.app/api/v1/ai/health/gemini
```

## Web project

Required production environment variables:

```env
NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
API_INTERNAL_URL=https://vivu-api.vercel.app
NEXT_PUBLIC_SITE_URL=https://vivu-web.vercel.app
```

The browser sends AI requests to the same-origin route `/api/ai/chat`. That
route proxies to the NestJS API, so AI chat does not depend on browser CORS.

## Limits

Images are limited to 4 MB. Vercel Functions have a request/response body limit
of approximately 4.5 MB, so the extra space is required for multipart metadata.

## Smoke test

1. Open `https://vivu-web.vercel.app` and click the chat button in the bottom-right corner.
2. Send `Biển Hồ Gia Lai có gì đẹp?`.
3. Upload a JPEG/PNG/WebP image smaller than 4 MB.
4. Upload an image with `Chỗ này có gì chơi?`.
5. Confirm that answers, matched images and sources render.
