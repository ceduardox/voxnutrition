const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const allowedFields = [
  "representativeName",
  "email",
  "phone",
  "role",
  "companyName",
  "website",
  "companyCountry",
  "residenceCountry",
  "productInterest",
  "firstOrder",
  "notes",
  "authority",
];

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

export function requireDb(env) {
  if (!env.DB) {
    return jsonResponse(
      {
        ok: false,
        error: "D1 binding DB is not configured for this Pages project.",
      },
      500,
    );
  }
  return null;
}

export function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return jsonResponse({ ok: false, error: "ADMIN_TOKEN is not configured." }, 500);
  }

  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim() || url.searchParams.get("token");
  if (token && token === env.ADMIN_TOKEN) {
    return null;
  }

  return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
}

export function pickRecord(payload) {
  const record = {};
  allowedFields.forEach((field) => {
    if (field === "authority") {
      record[field] = Boolean(payload[field]);
      return;
    }
    record[field] = String(payload[field] || "").trim();
  });
  return record;
}

export function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function dataUrlToFile(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.includes(",")) {
    return null;
  }

  const [meta, base64] = dataUrl.split(",");
  const typeMatch = meta.match(/^data:([^;]+);base64$/);
  if (!typeMatch || !base64) {
    return null;
  }

  const contentType = typeMatch[1];
  const extension = contentType.includes("png") ? "png" : "jpg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return {
    bytes,
    contentType,
    extension,
  };
}

export async function saveImage(env, id, type, dataUrl) {
  const file = dataUrlToFile(dataUrl);
  if (!file) {
    return { key: "", inline: "" };
  }

  if (!env.FILES) {
    return { key: "", inline: dataUrl };
  }

  const key = `${id}/${type}.${file.extension}`;
  await env.FILES.put(key, file.bytes, {
    httpMetadata: {
      contentType: file.contentType,
    },
  });
  return { key, inline: "" };
}

export async function insertSubmission(env, payload) {
  const id = createId();
  const record = pickRecord(payload);
  const signature = await saveImage(env, id, "signature", payload.signatureData);
  const selfie = await saveImage(env, id, "selfie", payload.selfieData);

  await env.DB.prepare(
    `INSERT INTO submissions (
      id,
      created_at,
      representative_name,
      email,
      phone,
      role,
      company_name,
      website,
      company_country,
      residence_country,
      product_interest,
      first_order,
      notes,
      authority,
      signature_key,
      selfie_key,
      signature_data,
      selfie_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      new Date().toISOString(),
      record.representativeName,
      record.email,
      record.phone,
      record.role,
      record.companyName,
      record.website,
      record.companyCountry,
      record.residenceCountry,
      record.productInterest,
      record.firstOrder,
      record.notes,
      record.authority ? 1 : 0,
      signature.key,
      selfie.key,
      signature.inline,
      selfie.inline,
    )
    .run();

  return { id };
}

export async function listSubmissions(env) {
  return env.DB.prepare(
    `SELECT
      id,
      created_at,
      representative_name,
      email,
      phone,
      role,
      company_name,
      website,
      company_country,
      residence_country,
      product_interest,
      first_order,
      authority,
      signature_key,
      selfie_key,
      CASE WHEN signature_data != '' THEN 1 ELSE 0 END AS has_inline_signature,
      CASE WHEN selfie_data != '' THEN 1 ELSE 0 END AS has_inline_selfie
    FROM submissions
    ORDER BY created_at DESC
    LIMIT 200`,
  ).all();
}

export async function getSubmission(env, id) {
  return env.DB.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first();
}

export function publicSubmission(row) {
  if (!row) return null;

  return {
    id: row.id,
    createdAt: row.created_at,
    representativeName: row.representative_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    companyName: row.company_name,
    website: row.website,
    companyCountry: row.company_country,
    residenceCountry: row.residence_country,
    productInterest: row.product_interest,
    firstOrder: row.first_order,
    notes: row.notes,
    authority: Boolean(row.authority),
    signatureUrl: row.signature_key ? `/api/file?key=${encodeURIComponent(row.signature_key)}` : "",
    selfieUrl: row.selfie_key ? `/api/file?key=${encodeURIComponent(row.selfie_key)}` : "",
    signatureData: row.signature_data || "",
    selfieData: row.selfie_data || "",
  };
}
