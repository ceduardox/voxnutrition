import {
  getSubmission,
  jsonResponse,
  listSubmissions,
  publicSubmission,
  requireAdmin,
  requireDb,
} from "../_shared/storage.js";

export async function onRequestGet({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const row = await getSubmission(env, id);
    if (!row) {
      return jsonResponse({ ok: false, error: "Submission not found." }, 404);
    }
    return jsonResponse({ ok: true, submission: publicSubmission(row) });
  }

  const result = await listSubmissions(env);
  return jsonResponse({ ok: true, submissions: result.results || [] });
}
