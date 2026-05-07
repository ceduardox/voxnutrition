(function () {
  const form = document.querySelector("#clientForm");
  const status = document.querySelector("#formStatus");
  const canvas = document.querySelector("#signatureCanvas");
  const signatureInput = document.querySelector("#signatureData");
  const clearSignature = document.querySelector("#clearSignature");
  const downloadRecord = document.querySelector("#downloadRecord");
  const storageKey = "voxnutrition_oem_client_request";

  document.querySelectorAll(".country-select").forEach((select) => {
    new Choices(select, {
      searchEnabled: true,
      itemSelectText: "",
      shouldSort: false,
    });
  });

  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: "rgb(255,255,255)",
    penColor: "rgb(25,32,27)",
    minWidth: 0.9,
    maxWidth: 2.4,
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const currentData = signaturePad.toData();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear();
    if (currentData.length) {
      signaturePad.fromData(currentData);
    }
  }

  function formToRecord() {
    const data = new FormData(form);
    return {
      submittedAt: new Date().toISOString(),
      representativeName: data.get("representativeName") || "",
      email: data.get("email") || "",
      phone: data.get("phone") || "",
      role: data.get("role") || "",
      companyName: data.get("companyName") || "",
      website: data.get("website") || "",
      companyCountry: data.get("companyCountry") || "",
      residenceCountry: data.get("residenceCountry") || "",
      productInterest: data.get("productInterest") || "",
      firstOrder: data.get("firstOrder") || "",
      notes: data.get("notes") || "",
      authority: data.get("authority") === "on",
      signatureData: signatureInput.value || "",
    };
  }

  function saveRecord(record) {
    localStorage.setItem(storageKey, JSON.stringify(record));
  }

  function downloadJson(record) {
    const blob = new Blob([JSON.stringify(record, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const company = (record.companyName || "vox-client").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `${company}-oem-request.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function hydrateDraft() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const record = JSON.parse(saved);
      Object.entries(record).forEach(([key, value]) => {
        const field = form.elements[key];
        if (!field || key === "signatureData") return;
        if (field.type === "checkbox") {
          field.checked = Boolean(value);
        } else {
          field.value = value;
          field.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      if (record.signatureData) {
        signatureInput.value = record.signatureData;
        signaturePad.fromDataURL(record.signatureData);
      }
    } catch (error) {
      localStorage.removeItem(storageKey);
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  hydrateDraft();

  form.addEventListener("input", () => {
    if (!signaturePad.isEmpty()) {
      signatureInput.value = signaturePad.toDataURL("image/png");
    }
    saveRecord(formToRecord());
  });

  clearSignature.addEventListener("click", () => {
    signaturePad.clear();
    signatureInput.value = "";
    saveRecord(formToRecord());
    status.textContent = "Signature cleared.";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (signaturePad.isEmpty()) {
      status.textContent = "Please add the representative signature before submitting.";
      canvas.focus();
      return;
    }

    signatureInput.value = signaturePad.toDataURL("image/png");
    const record = formToRecord();
    saveRecord(record);
    status.textContent = "Client request captured. Vox Nutrition can review this file.";
  });

  downloadRecord.addEventListener("click", () => {
    if (!signaturePad.isEmpty()) {
      signatureInput.value = signaturePad.toDataURL("image/png");
    }
    const record = formToRecord();
    saveRecord(record);
    downloadJson(record);
    status.textContent = "JSON record downloaded.";
  });
})();
