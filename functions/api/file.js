import { jsonResponse, requireAdmin } from "../_shared/storage.js";

export async function onRequestGet({ request, env }) {
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  if (!env.FILES) {
    return jsonResponse({ ok: false, error: "R2 binding FILES is not configured." }, 500);
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return jsonResponse({ ok: false, error: "Missing file key." }, 400);
  }

  const object = await env.FILES.get(key);
  if (!object) {
    return jsonResponse({ ok: false, error: "File not found." }, 404);
  }

  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=60",
    },
  });
}
