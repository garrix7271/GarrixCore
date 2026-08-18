// auth.js — handles form submission for sign in, sign up, forgot password, and reset password.
const API_BASE = "https://garrixcore.onrender.com";
const ENDPOINTS = {
  signin: API_BASE + "/api/login",
  signup: API_BASE + "/api/signup",
  forgot: API_BASE + "/api/forgot-password",
  reset: API_BASE + "/api/reset-password",
};

document.addEventListener("DOMContentLoaded", () => {
  bindForm("signin-form", handleSignIn);
  bindForm("signup-form", handleSignUp);
  bindForm("forgot-form", handleForgot);
  bindForm("reset-form", handleReset);
});

function bindForm(formId, handler) {
  const form = document.getElementById(formId);
  if (!form) return; // this page doesn't have this form, skip
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handler(form);
  });
}

async function handleSignIn(form) {
  const email = val("signin-email");
  const password = val("signin-password");

  if (!email || !password) {
    showError("signin-error", "Please enter both email and password.");
    return;
  }

  await submitRequest({
    endpoint: ENDPOINTS.signin,
    body: { email, password },
    submitBtnId: "signin-submit",
    errorId: "signin-error",
    onSuccess: (data) => {
      if (data.token) localStorage.setItem("authToken", data.token);
      if (data.name) localStorage.setItem("userName", data.name);
      window.location.href = "dashboard.html";
    },
  });
}

async function handleSignUp(form) {
  const name = val("signup-name");
  const email = val("signup-email");
  const password = val("signup-password");
  const confirm = val("signup-confirm");

  if (!name || !email || !password || !confirm) {
    showError("signup-error", "Please fill in every field.");
    return;
  }
  if (password.length < 8) {
    showError("signup-error", "Password must be at least 8 characters.");
    return;
  }
  if (password !== confirm) {
    showError("signup-error", "Passwords don't match.");
    return;
  }

  await submitRequest({
    endpoint: ENDPOINTS.signup,
    body: { name, email, password },
    submitBtnId: "signup-submit",
    errorId: "signup-error",
    onSuccess: (data) => {
      if (data.token) localStorage.setItem("authToken", data.token);
      if (data.name) localStorage.setItem("userName", data.name);
      window.location.href = "dashboard.html";
    },
  });
}

async function handleForgot(form) {
  const email = val("forgot-email");
  if (!email) {
    showError("forgot-error", "Please enter your email.");
    return;
  }

  await submitRequest({
    endpoint: ENDPOINTS.forgot,
    body: { email },
    submitBtnId: "forgot-submit",
    errorId: "forgot-error",
    onSuccess: () => {
      hideError("forgot-error");
      showSuccess("forgot-success", "If that email is registered, a reset link is on its way.");
      form.reset();
    },
  });
}

async function handleReset(form) {
  const password = val("reset-password");
  const confirm = val("reset-confirm");

  if (!password || !confirm) {
    showError("reset-error", "Please fill in both fields.");
    return;
  }
  if (password.length < 8) {
    showError("reset-error", "Password must be at least 8 characters.");
    return;
  }
  if (password !== confirm) {
    showError("reset-error", "Passwords don't match.");
    return;
  }

  // Reset flows normally carry a token from the emailed link, e.g. ?token=xyz
  const token = new URLSearchParams(window.location.search).get("token");

  await submitRequest({
    endpoint: ENDPOINTS.reset,
    body: { password, token },
    submitBtnId: "reset-submit",
    errorId: "reset-error",
    onSuccess: () => {
      hideError("reset-error");
      showSuccess("reset-success", "Password updated. You can now sign in.");
      setTimeout(() => (window.location.href = "login.html"), 1500);
    },
  });
}

// --- shared helpers ---

async function submitRequest({ endpoint, body, submitBtnId, errorId, onSuccess }) {
  hideError(errorId);
  setLoading(submitBtnId, true);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showError(errorId, data.message || "Something went wrong. Please try again.");
      return;
    }

    onSuccess(data);
  } catch (err) {
    console.error("Request failed:", err);
    showError(errorId, "Couldn't reach the server. Please try again.");
  } finally {
    setLoading(submitBtnId, false);
  }
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function showError(id, message) {
  const box = document.getElementById(id);
  if (box) {
    box.textContent = message;
    box.style.display = "block";
  }
}

function hideError(id) {
  const box = document.getElementById(id);
  if (box) box.style.display = "none";
}

function showSuccess(id, message) {
  const box = document.getElementById(id);
  if (box) {
    box.textContent = message;
    box.style.display = "block";
  }
}

function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = isLoading;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.textContent = isLoading ? "Please wait..." : btn.dataset.originalText;
}