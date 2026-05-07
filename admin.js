(function () {
  const tokenInput = document.querySelector("#adminToken");
  const saveToken = document.querySelector("#saveToken");
  const refreshList = document.querySelector("#refreshList");
  const list = document.querySelector("#submissionList");
  const detail = document.querySelector("#detailPanel");
  const status = document.querySelector("#adminStatus");
  const countBadge = document.querySelector("#countBadge");
  const tokenKey = "voxnutrition_admin_token";

  tokenInput.value = localStorage.getItem(tokenKey) || "";

  function headers() {
    const token = localStorage.getItem(tokenKey);
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  async function apiGet(url) {
    const response = await fetch(url, { headers: headers() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Could not load admin data.");
    }
    return data;
  }

  function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleString();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function mediaSrc(submission, key) {
    const url = submission[`${key}Url`];
    const data = submission[`${key}Data`];
    if (url) {
      const token = localStorage.getItem(tokenKey);
      return token ? `${url}&token=${encodeURIComponent(token)}` : url;
    }
    return data || "";
  }

  function renderDetail(submission) {
    const signature = mediaSrc(submission, "signature");
    const selfie = mediaSrc(submission, "selfie");
    detail.innerHTML = `
      <h2>${escapeHtml(submission.companyName || "Untitled company")}</h2>
      <p>${escapeHtml(submission.productInterest || "No product selected")} · ${escapeHtml(formatDate(submission.createdAt))}</p>
      <dl>
        <dt>Representative</dt><dd>${escapeHtml(submission.representativeName)}</dd>
        <dt>Email</dt><dd>${escapeHtml(submission.email)}</dd>
        <dt>Phone</dt><dd>${escapeHtml(submission.phone)}</dd>
        <dt>Role</dt><dd>${escapeHtml(submission.role)}</dd>
        <dt>Website</dt><dd>${escapeHtml(submission.website)}</dd>
        <dt>Company country</dt><dd>${escapeHtml(submission.companyCountry)}</dd>
        <dt>Residence</dt><dd>${escapeHtml(submission.residenceCountry)}</dd>
        <dt>First order</dt><dd>${escapeHtml(submission.firstOrder)}</dd>
        <dt>Notes</dt><dd>${escapeHtml(submission.notes)}</dd>
      </dl>
      <div class="media-grid">
        <div class="media-box">
          <h3>Selfie</h3>
          ${selfie ? `<img src="${selfie}" alt="Representative selfie" />` : "<p>No selfie available.</p>"}
        </div>
        <div class="media-box">
          <h3>Signature</h3>
          ${signature ? `<img src="${signature}" alt="Representative signature" />` : "<p>No signature available.</p>"}
        </div>
      </div>
    `;
  }

  async function loadDetail(id) {
    status.textContent = "Loading request...";
    const data = await apiGet(`/api/submissions?id=${encodeURIComponent(id)}`);
    renderDetail(data.submission);
    status.textContent = "";
  }

  async function loadList() {
    status.textContent = "Loading submissions...";
    const data = await apiGet("/api/submissions");
    const submissions = data.submissions || [];
    countBadge.textContent = submissions.length;
    list.innerHTML = submissions.length
      ? ""
      : '<p class="empty-state">No submissions yet.</p>';

    submissions.forEach((submission) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "submission-card";
      button.innerHTML = `
        <strong>${escapeHtml(submission.company_name || "Untitled company")}</strong>
        <span>${escapeHtml(submission.representative_name)}</span>
        <span>${escapeHtml(submission.product_interest)}</span>
        <span>${escapeHtml(formatDate(submission.created_at))}</span>
      `;
      button.addEventListener("click", () => {
        loadDetail(submission.id).catch((error) => {
          status.textContent = error.message;
        });
      });
      list.appendChild(button);
    });
    status.textContent = "";
  }

  saveToken.addEventListener("click", () => {
    localStorage.setItem(tokenKey, tokenInput.value.trim());
    status.textContent = "Admin token saved.";
  });

  refreshList.addEventListener("click", () => {
    loadList().catch((error) => {
      status.textContent = error.message;
    });
  });

  loadList().catch((error) => {
    status.textContent = error.message;
  });
})();
