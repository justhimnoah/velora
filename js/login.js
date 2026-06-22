import { supabase } from "./supabase.js";

/* =====================
   ELEMENTS
===================== */
const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");

const veloraField = document.getElementById("veloraField");
const veloraId = document.getElementById("veloraId");
const veloraStatus = document.getElementById("veloraStatus");

const email = document.getElementById("email");
const confirmEmailField = document.getElementById("confirmEmailField");
const confirmEmail = document.getElementById("confirmEmail");

const password = document.getElementById("password");
const passwordStatus = document.getElementById("passwordStatus");

const confirmPasswordField = document.getElementById("confirmPasswordField");
const confirmPassword = document.getElementById("confirmPassword");

const submitBtn = document.getElementById("submitBtn");
const toggle = document.getElementById("toggle");
const resetPassword = document.getElementById("resetPassword");
const error = document.getElementById("error");

/* =====================
   STATE
===================== */
let isRegister = false;
let veloraAvailable = false;
let passwordStrongEnough = false;

/* =====================
   HELPERS
===================== */
function isPasswordStrong(pw) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
}

function showError(msg) {
  error.style.color = "#ff6b6b";
  error.textContent = `Error: ${msg}`;
}

function showSuccess(msg) {
  error.style.color = "#6bff9e";
  error.textContent = msg;
}

function updateButtonState() {
  if (!isRegister) {
    submitBtn.disabled = !(email.value.trim() && password.value);
    return;
  }

  const emailsMatch = email.value && email.value === confirmEmail.value;
  const passwordsMatch = password.value && password.value === confirmPassword.value;

  submitBtn.disabled = !(veloraAvailable && emailsMatch && passwordStrongEnough && passwordsMatch);
}

/* =====================
   Velora ID CHECK (Supabase)
===================== */
veloraId.oninput = async () => {
  const val = veloraId.value.trim().toLowerCase();
  veloraAvailable = false;

  if (!/^[a-z0-9_]{4,16}$/.test(val)) {
    veloraStatus.textContent = "Invalid Velora ID";
    veloraStatus.className = "bad";
    updateButtonState();
    return;
  }

  const { data, error: idError } = await supabase
    .from("veloraids") // ✅ lowercase table name
    .select("uid")
    .eq("id", val)
    .maybeSingle();

  if (!data) {
    veloraStatus.textContent = "Velora ID is available ✔";
    veloraStatus.className = "ok";
    veloraAvailable = true;
  } else {
    veloraStatus.textContent = "Velora ID is taken";
    veloraStatus.className = "bad";
  }

  updateButtonState();
};

/* =====================
   EMAIL MATCH HINTS
===================== */
confirmEmail.oninput = () => {
  if (!isRegister) return;

  confirmEmailField.querySelector("small")?.remove();

  if (email.value && email.value === confirmEmail.value) {
    const s = document.createElement("small");
    s.textContent = "Email IDs match ✔";
    s.className = "ok";
    confirmEmailField.appendChild(s);
  } else if (confirmEmail.value) {
    const s = document.createElement("small");
    s.textContent = "Emails do not match ✖";
    s.className = "bad";
    confirmEmailField.appendChild(s);
  }

  updateButtonState();
};

/* =====================
   PASSWORD STRENGTH HINTS
===================== */
password.oninput = () => {
  if (!isRegister) {
    updateButtonState();
    return;
  }

  if (isPasswordStrong(password.value)) {
    passwordStatus.textContent = "Password is strong ✔";
    passwordStatus.className = "ok";
    passwordStrongEnough = true;
  } else {
    passwordStatus.textContent = "8+ chars · uppercase · lowercase · number";
    passwordStatus.className = "bad";
    passwordStrongEnough = false;
  }

  updateButtonState();
};

/* =====================
   CONFIRM PASSWORD MATCH HINTS
===================== */
confirmPassword.oninput = () => {
  if (!isRegister) return;

  confirmPasswordField.querySelector("small")?.remove();

  if (password.value && password.value === confirmPassword.value) {
    const s = document.createElement("small");
    s.textContent = "Passwords match ✔";
    s.className = "ok";
    confirmPasswordField.appendChild(s);
  } else if (confirmPassword.value) {
    const s = document.createElement("small");
    s.textContent = "Passwords do not match ✖";
    s.className = "bad";
    confirmPasswordField.appendChild(s);
  }

  updateButtonState();
};

/* =====================
   TOGGLE LOGIN / REGISTER
===================== */
toggle.onclick = e => {
  e.preventDefault();
  isRegister = !isRegister;

  title.textContent = isRegister ? "Create Velora Account" : "Sign in to Velora";
  subtitle.textContent = isRegister ? "Your identity across Velora" : "Access your Velora console";

  submitBtn.textContent = isRegister ? "Register" : "Sign In";
  submitBtn.disabled = true;

  veloraField.style.display = isRegister ? "block" : "none";
  confirmEmailField.style.display = isRegister ? "block" : "none";
  confirmPasswordField.style.display = isRegister ? "block" : "none";
  passwordStatus.style.display = isRegister ? "block" : "none";
  resetPassword.style.display = isRegister ? "none" : "inline";

  toggle.textContent = isRegister ? "Back to sign in" : "Create account";
  error.textContent = "";
};

/* =====================
   RESET PASSWORD
===================== */
resetPassword.onclick = async e => {
  e.preventDefault();
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value.trim());
  if (resetError) showError("Invalid email");
  else showSuccess("Password reset email sent");
};

/* =====================
   SUBMIT
===================== */
submitBtn.onclick = async () => {
  error.textContent = "";

  try {
    if (!isRegister) {
      // LOGIN
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value
      });

      if (loginError) {
        showError(loginError.message);
        return;
      }

      window.location.href = "index.html";
      return;
    }

    // REGISTER
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value
    });

    if (signupError) {
      showError(signupError.message);
      return;
    }

    // Store Velora ID in your custom tables
    await supabase.from("users").insert({
      email: email.value.trim(),
      veloraId: veloraId.value.trim().toLowerCase(),
      created_at: new Date()
    });

    await supabase.from("roles").insert({
      uid: data.user.id,
      role: "user",
      created_at: new Date()
    });

    await supabase.from("veloraids").insert({
      id: veloraId.value.trim().toLowerCase(),
      uid: data.user.id
    });

    showSuccess("Verification email sent. Please verify before logging in.");
    isRegister = false;
    toggle.click();
  } catch (e) {
    showError("Something went wrong");
    console.error(e);
  }
};
