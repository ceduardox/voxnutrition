import { insertSubmission, jsonResponse, requireDb } from "../_shared/storage.js";

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  if (!payload.representativeName || !payload.email || !payload.companyName) {
    return jsonResponse({ ok: false, error: "Missing required representative or company fields." }, 400);
  }

  if (!payload.signatureData || !payload.selfieData) {
    return jsonResponse({ ok: false, error: "Signature and selfie are required." }, 400);
  }

  const result = await insertSubmission(env, payload);
  return jsonResponse({ ok: true, id: result.id }, 201);
}
