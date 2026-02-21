

## IndexNow Integration for Blog Post Indexing

Create a new Supabase Edge Function that submits URLs to the IndexNow API, enabling instant indexing by Bing, Yandex, and other participating search engines when new blog posts are published.

---

### How It Works

IndexNow is a protocol that lets website owners notify search engines about new or updated URLs instantly. You generate an API key, host a verification file, and POST URLs to the IndexNow endpoint. Bing, Yandex, Seznam, and Naver all support it (Google does not yet, but may in future).

---

### Step 1: Generate and Store IndexNow API Key

IndexNow requires a unique API key (any UUID-like string you generate).

- Generate a key (e.g., a random 32-character hex string)
- Store it as a Supabase secret: `INDEXNOW_API_KEY`
- Create a verification file at `public/{key}.txt` containing just the key itself (required by the protocol)

---

### Step 2: Create the Edge Function

**New file:** `supabase/functions/submit-indexnow/index.ts`

The function will:
- Accept a JSON body with a `urls` array (e.g., `["/blog/new-post-slug"]`)
- Read `INDEXNOW_API_KEY` from secrets
- POST to `https://api.indexnow.org/indexnow` with the payload:
  ```json
  {
    "host": "labflow.mywebz.in",
    "key": "<INDEXNOW_API_KEY>",
    "keyLocation": "https://labflow.mywebz.in/<key>.txt",
    "urlList": ["https://labflow.mywebz.in/blog/new-post-slug"]
  }
  ```
- Return the IndexNow API response status
- Include standard CORS and security headers

---

### Step 3: Register in config.toml

**File:** `supabase/config.toml`

Add:
```toml
[functions.submit-indexnow]
verify_jwt = true
```

JWT verification is enabled since this is an admin action — only authenticated users should trigger indexing.

---

### Step 4: Add a "Submit to Search Engines" Utility

**New file:** `src/lib/indexNow.ts`

A helper function that calls the edge function:
```typescript
export async function submitToIndexNow(slugs: string[]) {
  const urls = slugs.map(s => `/blog/${s}`);
  const { data, error } = await supabase.functions.invoke('submit-indexnow', {
    body: { urls },
  });
  return { data, error };
}
```

This can be called from anywhere — a dashboard button, a blog management page, or manually after deploying new content.

---

### Step 5: Add "Notify Search Engines" Button (Optional but Recommended)

**File:** `src/pages/Blog.tsx` (or a new admin component)

Add a small admin-only button at the top of the blog index that:
- Collects all blog post slugs from `blogData.ts`
- Calls `submitToIndexNow()` with the full URL list
- Shows a success/error toast
- Only visible to authenticated users

---

### Summary

| Step | What | File(s) |
|------|------|---------|
| 1 | Store IndexNow API key as secret + verification file | Secret + `public/{key}.txt` |
| 2 | Create edge function | `supabase/functions/submit-indexnow/index.ts` |
| 3 | Register function | `supabase/config.toml` |
| 4 | Client helper | `src/lib/indexNow.ts` |
| 5 | Admin button (optional) | `src/pages/Blog.tsx` |

### Technical Notes

- IndexNow accepts up to 10,000 URLs per request, so all 12 blog posts can be submitted in a single call
- The verification file in `public/` is served as a static asset by Vite/Vercel automatically
- No new npm dependencies required
- The secret `INDEXNOW_API_KEY` will need to be added before the function works — you will be prompted during implementation
