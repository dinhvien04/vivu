# Trip Planner Scaling Plan

As the platform grows, processing itinerary requests dynamically via Gemini on every click will become expensive and slow. This plan details scaling strategies for the AI Trip Planner.

## 1. Multi-Dimensional Caching Strategy
Cache generated itineraries in the database based on the input features:
- **Cache Key Schema**: `hash(area + days + interests + transport + locale)`
- **Cache Hit Behavior**: Before calling Gemini, query the `TripPlan` table for existing runs matching these input hashes. If found, return the cached output JSON immediately. This results in:
  - 0s response time.
  - $0 API cost.

## 2. Pre-Generated High-Traffic Itineraries
Pre-generate templates for highly common routes and cache them under default settings:
- **Preset 1**: 1 Day in Pleiku (area: `pleiku`, days: 1, interests: `van-hoa`, transport: `xe_may`).
- **Preset 2**: 2 Days waterfall and forests (area: `tay-nguyen`, days: 2, interests: `thac-suoi`, transport: `o_to`).
- **Preset 3**: 3 Days Gia Lai Explorer (area: `tay-nguyen`, days: 3, interests: `nui-rung`, transport: `o_to`).

---

## 3. High Traffic Queue Management (Next Phase)
If traffic spikes:
1. Introduce an asynchronous message queue (e.g. BullMQ with Redis).
2. When a user requests a plan, return a `202 Accepted` response with a unique job ID.
3. The frontend polls `/api/v1/trip-plans/jobs/:id` or listens via WebSocket while displaying a progress spinner.
4. Worker instances consume jobs, query Gemini, write to DB, and mark jobs as completed.
