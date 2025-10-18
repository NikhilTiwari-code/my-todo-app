# Next.js 15 Async Params Fix Guide

## Breaking Change
In Next.js 15, route `params` are now async and must be awaited.

## Pattern to Fix

### Before (Next.js 14):
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  // ...
}
```

### After (Next.js 15):
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = id;
  // ...
}
```

## Files Fixed:
- ✅ posts/[id]/comments/route.ts

## Files Remaining:
All other [param] routes need the same fix.
