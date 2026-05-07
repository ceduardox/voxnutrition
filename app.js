(function () {
  const form = document.querySelector("#clientForm");
  const status = document.querySelector("#formStatus");
  const canvas = document.querySelector("#signatureCanvas");
  const signatureInput = document.querySelector("#signatureData");
  const clearSignature = document.querySelector("#clearSignature");
  const selfieInput = document.querySelector("#selfieData");
  const selfieVideo = document.querySelector("#selfieVideo");
  const selfiePreview = document.querySelector("#selfiePreview");
  const selfieStage = document.querySelector(".selfie-stage");
  const startCamera = document.querySelector("#startCamera");
  const captureSelfie = document.querySelector("#captureSelfie");
  const resetSelfie = document.querySelector("#resetSelfie");
  const successModal = document.querySelector("#successModal");
  const closeSuccess = document.querySelector("#closeSuccess");
  const storageKey = "voxnutrition_oem_client_request";
  let cameraStream = null;
  const countryChoices = new Map();

  document.querySelectorAll(".country-select").forEach((select) => {
    const choices = new Choices(select, {
      searchEnabled: true,
      itemSelectText: "",
      shouldSort: false,
    });
    countryChoices.set(select.name, choices);
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
      selfieData: selfieInput.value || "",
    };
  }

  function saveRecord(record) {
    localStorage.setItem(storageKey, JSON.stringify(record));
  }

  function saveCurrentDraft() {
    if (!signaturePad.isEmpty()) {
      signatureInput.value = signaturePad.toDataURL("image/png");
    }
    saveRecord(formToRecord());
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
        } else if (countryChoices.has(key)) {
          countryChoices.get(key).setChoiceByValue(String(value || ""));
        } else {
          field.value = value;
          field.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      if (record.signatureData) {
        signatureInput.value = record.signatureData;
        signaturePad.fromDataURL(record.signatureData);
      }
      if (record.selfieData) {
        selfieInput.value = record.selfieData;
        selfiePreview.src = record.selfieData;
        selfieStage.classList.add("has-photo");
      }
    } catch (error) {
      localStorage.removeItem(storageKey);
    }
  }

  async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = "Camera access is not available in this browser.";
      return;
    }

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      selfieVideo.srcObject = cameraStream;
      selfieStage.classList.remove("has-photo");
      selfieStage.classList.add("has-video");
      status.textContent = "Camera ready. Take the selfie when the representative is centered.";
    } catch (error) {
      status.textContent = "Camera permission was not granted or the device has no camera.";
    }
  }

  function stopCamera() {
    if (!cameraStream) return;
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    selfieVideo.srcObject = null;
  }

  function takeSelfie() {
    if (!cameraStream || !selfieVideo.videoWidth) {
      status.textContent = "Open the camera before taking the selfie.";
      return;
    }

    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = selfieVideo.videoWidth;
    photoCanvas.height = selfieVideo.videoHeight;
    photoCanvas.getContext("2d").drawImage(selfieVideo, 0, 0);
    const photoData = photoCanvas.toDataURL("image/jpeg", 0.86);
    selfieInput.value = photoData;
    selfiePreview.src = photoData;
    selfieStage.classList.remove("has-video");
    selfieStage.classList.add("has-photo");
    stopCamera();
    saveCurrentDraft();
    status.classList.remove("is-success");
    status.textContent = "Selfie captured. The photo preview is now attached to this client request.";
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  hydrateDraft();

  form.addEventListener("input", saveCurrentDraft);
  form.addEventListener("change", saveCurrentDraft);

  if (typeof signaturePad.addEventListener === "function") {
    signaturePad.addEventListener("endStroke", saveCurrentDraft);
  } else {
    canvas.addEventListener("pointerup", saveCurrentDraft);
    canvas.addEventListener("touchend", saveCurrentDraft);
  }

  clearSignature.addEventListener("click", () => {
    signaturePad.clear();
    signatureInput.value = "";
    saveCurrentDraft();
    status.classList.remove("is-success");
    status.textContent = "Signature cleared.";
  });

  startCamera.addEventListener("click", openCamera);
  captureSelfie.addEventListener("click", takeSelfie);
  resetSelfie.addEventListener("click", () => {
    selfieInput.value = "";
    selfiePreview.removeAttribute("src");
    selfieStage.classList.remove("has-photo", "has-video");
    stopCamera();
    saveCurrentDraft();
    status.classList.remove("is-success");
    status.textContent = "Selfie cleared. Open the camera to take a new photo.";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (signaturePad.isEmpty()) {
      status.textContent = "Please add the representative signature before submitting.";
      canvas.focus();
      return;
    }

    if (!selfieInput.value) {
      status.textContent = "Please take the representative selfie before submitting.";
      return;
    }

    signatureInput.value = signaturePad.toDataURL("image/png");
    const record = formToRecord();
    saveRecord(record);
    status.classList.add("is-success");
    status.textContent = "Submitted successfully. The client request was saved on this device.";
    successModal.classList.add("is-visible");
  });

  closeSuccess.addEventListener("click", () => {
    successModal.classList.remove("is-visible");
  });

  successModal.addEventListener("click", (event) => {
    if (event.target === successModal) {
      successModal.classList.remove("is-visible");
    }
  });

  window.addEventListener("beforeunload", stopCamera);
})();
