import assert from "node:assert/strict";
import { onRequestGet as getFile } from "../functions/api/file.js";
import { onRequestGet as getSubmissions } from "../functions/api/submissions.js";
import { onRequestPost as submit } from "../functions/api/submit.js";

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const tinyJpeg =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAARD/2gAIAQEAAT8QH//Z";

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async run() {
    const [
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
      selfie_data,
    ] = this.args;

    this.db.rows.set(id, {
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
      selfie_data,
    });
    return { success: true };
  }

  async all() {
    return {
      results: Array.from(this.db.rows.values()).map((row) => ({
        ...row,
        has_inline_signature: row.signature_data ? 1 : 0,
        has_inline_selfie: row.selfie_data ? 1 : 0,
      })),
    };
  }

  async first() {
    return this.db.rows.get(this.args[0]) || null;
  }
}

class FakeDb {
  constructor() {
    this.rows = new Map();
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

class FakeR2 {
  constructor() {
    this.objects = new Map();
  }

  async put(key, body, options) {
    this.objects.set(key, { body, httpMetadata: options.httpMetadata });
  }

  async get(key) {
    const object = this.objects.get(key);
    if (!object) return null;
    return {
      body: object.body,
      httpMetadata: object.httpMetadata,
    };
  }
}

const env = {
  ADMIN_TOKEN: "secret",
  DB: new FakeDb(),
  FILES: new FakeR2(),
};

const payload = {
  representativeName: "Legal Rep",
  email: "rep@example.com",
  phone: "+1 555",
  role: "CEO",
  companyName: "Example Labs",
  website: "https://example.com",
  companyCountry: "United States",
  residenceCountry: "United States",
  productInterest: "Custom capsule formula",
  firstOrder: "1,001 - 5,000 bottles",
  notes: "Test request",
  authority: true,
  signatureData: tinyPng,
  selfieData: tinyJpeg,
};

const submitResponse = await submit({
  request: new Request("https://vox.test/api/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  env,
});
assert.equal(submitResponse.status, 201);
const submitJson = await submitResponse.json();
assert.equal(submitJson.ok, true);
assert.ok(submitJson.id);

const listResponse = await getSubmissions({
  request: new Request("https://vox.test/api/submissions", {
    headers: { authorization: "Bearer secret" },
  }),
  env,
});
assert.equal(listResponse.status, 200);
const listJson = await listResponse.json();
assert.equal(listJson.submissions.length, 1);
assert.equal(listJson.submissions[0].company_name, "Example Labs");

const detailResponse = await getSubmissions({
  request: new Request(`https://vox.test/api/submissions?id=${submitJson.id}`, {
    headers: { authorization: "Bearer secret" },
  }),
  env,
});
assert.equal(detailResponse.status, 200);
const detailJson = await detailResponse.json();
assert.equal(detailJson.submission.companyName, "Example Labs");
assert.ok(detailJson.submission.signatureUrl);
assert.ok(detailJson.submission.selfieUrl);

const unauthorizedResponse = await getSubmissions({
  request: new Request("https://vox.test/api/submissions"),
  env,
});
assert.equal(unauthorizedResponse.status, 401);

const fileResponse = await getFile({
  request: new Request(`https://vox.test${detailJson.submission.selfieUrl}&token=secret`),
  env,
});
assert.equal(fileResponse.status, 200);
assert.equal(fileResponse.headers.get("content-type"), "image/jpeg");

console.log("API tests passed");
