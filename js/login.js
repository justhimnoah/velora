import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw)
  );
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

  const emailsMatch =
    email.value &&
    email.value === confirmEmail.value;

  const passwordsMatch =
    password.value &&
    password.value === confirmPassword.value;

  submitBtn.disabled = !(
    veloraAvailable &&
    emailsMatch &&
    passwordStrongEnough &&
    passwordsMatch
  );
}

function attachPasswordToggle(inputEl) {
  if (!inputEl) return;

  // Create a dedicated wrapper around the input
  const field = inputEl.parentElement; // .field
  const wrapper = document.createElement("div");
  wrapper.className = "password-wrapper";

  // Move the input inside the wrapper
  field.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);

  // Create the eye inside the wrapper
  const eye = document.createElement("span");
  eye.className = "password-eye";
  eye.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12
           18 18.75 12 18.75 2.25 12 2.25 12z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  `;

  let visible = false;
  eye.onclick = () => {
    visible = !visible;
    inputEl.type = visible ? "text" : "password";
    eye.innerHTML = visible
      ? `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M3 3l18 18M10.6 10.6a2.25 2.25 0 003.18 3.18" />
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M2.25 12s3.75-6.75 9.75-6.75
             c2.02 0 3.8.64 5.29 1.58
             M21.75 12s-1.2 2.16-3.34 3.98
             c-1.54 1.3-3.5 2.77-6.41 2.77
             c-6 0-9.75-6.75-9.75-6.75" />
      </svg>`
      : `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12
             18 18.75 12 18.75 2.25 12 2.25 12z" />
        <circle cx="12" cy="12" r="3.25" />
      </svg>`;
  };

  wrapper.appendChild(eye);
}

/* =====================
   LOGIN INPUT ENABLE
===================== */
email.oninput = updateButtonState;
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
    passwordStatus.textContent =
      "8+ chars · uppercase · lowercase · number";
    passwordStatus.className = "bad";
    passwordStrongEnough = false;
  }

  updateButtonState();
};

/* =====================
   CONFIRM EMAIL MATCH
===================== */
confirmEmail.oninput = () => {
  if (!isRegister) return;

  confirmEmailField.querySelector("small")?.remove();

  if (email.value && email.value === confirmEmail.value) {
    const s = document.createElement("small");
    s.textContent = "Email IDs match ✔";
    s.className = "ok";
    confirmEmailField.appendChild(s);
  }

  updateButtonState();
};

/* =====================
   CONFIRM PASSWORD MATCH
===================== */
confirmPassword.oninput = () => {
  if (!isRegister) return;

  confirmPasswordField.querySelector("small")?.remove();

  if (password.value && password.value === confirmPassword.value) {
    const s = document.createElement("small");
    s.textContent = "Passwords match ✔";
    s.className = "ok";
    confirmPasswordField.appendChild(s);
  }

  updateButtonState();
};

/* =====================
   Velora ID CHECK
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

  try {
    const snap = await getDoc(doc(db, "veloraIds", val));

    if (snap.exists()) {
      veloraStatus.textContent = "Velora ID is taken";
      veloraStatus.className = "bad";
    } else {
      veloraStatus.textContent = "Velora ID is available ✔";
      veloraStatus.className = "ok";
      veloraAvailable = true;
    }
  } catch (err) {
    console.error("Velora ID check failed:", err);
    veloraStatus.textContent = "Unable to check Velora ID";
    veloraStatus.className = "bad";
  }

  updateButtonState();
};

/* =====================
   TOGGLE LOGIN / REGISTER
===================== */
toggle.onclick = e => {
  e.preventDefault();
  isRegister = !isRegister;

  title.textContent = isRegister
    ? "Create Velora Account"
    : "Sign in to Velora";

  subtitle.textContent = isRegister
    ? "Your identity across Velora"
    : "Access your Velora console";

  submitBtn.textContent = isRegister ? "Register" : "Sign In";
  submitBtn.disabled = true;

  veloraField.style.display = isRegister ? "block" : "none";
  confirmEmailField.style.display = isRegister ? "block" : "none";
  confirmPasswordField.style.display = isRegister ? "block" : "none";
  passwordStatus.style.display = isRegister ? "block" : "none";
  resetPassword.style.display = isRegister ? "none" : "inline";

  toggle.textContent = isRegister
    ? "Back to sign in"
    : "Create account";

  error.textContent = "";
};

/* =====================
   RESET PASSWORD
===================== */
resetPassword.onclick = async e => {
  e.preventDefault();

  try {
    await sendPasswordResetEmail(auth, email.value.trim());
    showSuccess("Password reset email sent");
  } catch {
    showError("Invalid email");
  }
};

/* =====================
   SUBMIT
===================== */
submitBtn.onclick = async () => {
  error.textContent = "";

  try {
    /* LOGIN */
    if (!isRegister) {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.value.trim(),
        password.value
      );

      if (!cred.user.emailVerified) {
        await signOut(auth);
        showError("Please verify your email before logging in");
        return;
      }

      window.location.href = "index.html";
      return;
    }

    /* REGISTER */
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value
    );

    await sendEmailVerification(cred.user);

    await setDoc(doc(db, "users", cred.user.uid), {
      email: email.value.trim(),
      veloraId: veloraId.value.trim().toLowerCase(),
      veloraLastChanged: serverTimestamp(),
      createdAt: serverTimestamp(),
      emailVerified: false
    });

    await setDoc(
      doc(db, "veloraIds", veloraId.value.trim().toLowerCase()),
      { uid: cred.user.uid }
    );

    await signOut(auth);

    isRegister = false;
    toggle.click();

    showSuccess(
      "Verification email sent. Please verify your email before logging in."
    );

  } catch (e) {
    const code = e.code || "";

    if (
      code.includes("invalid-credential") ||
      code.includes("wrong-password")
    )
      showError("Invalid email or password");
    else if (code.includes("user-not-found"))
      showError("Account does not exist");
    else if (code.includes("invalid-email"))
      showError("Invalid email");
    else if (code.includes("email-already-in-use"))
      showError("Email is already in use");
    else if (code.includes("weak-password"))
      showError("Password is too weak");
    else
      showError("Something went wrong");
  }
};

function handleEnterSubmit(e) {
  if (e.key === "Enter" && !submitBtn.disabled) {
    submitBtn.click();
  }
}

// Apply to all relevant inputs
[
  email,
  password,
  confirmEmail,
  confirmPassword,
  veloraId
].forEach(input => {
  if (!input) return;
  input.addEventListener("keydown", handleEnterSubmit);
});

attachPasswordToggle(password);
attachPasswordToggle(confirmPassword);