// Function to switch between login and signup tabs
function switchTab(tabId) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");

  if (tabId === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
  } else {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
  }
}

// Function to toggle password visibility
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `; // Eye-off icon
  } else {
    input.type = "password";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `; // Eye icon
  }
}

// Validation Logic
function showError(inputId, message) {
  const group = document.getElementById("group-" + inputId);
  const errorText = document.getElementById("error-" + inputId);
  if (group && errorText) {
    group.classList.add("error");
    errorText.textContent = message;
  }
}

function clearError(inputId) {
  const group = document.getElementById("group-" + inputId);
  const errorText = document.getElementById("error-" + inputId);
  if (group && errorText) {
    group.classList.remove("error");
    errorText.textContent = "";
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Ensure the correct tab is active initially and setup form validations
document.addEventListener("DOMContentLoaded", () => {
  // Initial tab load
  const authTab = localStorage.getItem("authTab");
  if (authTab === "login") {
    switchTab("login");
  } else {
    switchTab("signup");
  }
  localStorage.removeItem("authTab");

  // Form Validators
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  // Clear error on input
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      clearError(input.id);
    });
  });

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let isValid = true;

      ["signupName", "signupEmail", "signupPassword", "signupMobile"].forEach(
        clearError,
      );

      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const mobile = document.getElementById("signupMobile").value.trim();

      if (name.length < 3) {
        showError("signupName", "Full name must be at least 3 characters");
        isValid = false;
      } else if (!/^[A-Za-z\s]+$/.test(name)) {
        showError("signupName", "Name can only contain alphabets and spaces");
        isValid = false;
      }

      if (!validateEmail(email)) {
        showError("signupEmail", "Please enter a valid email address");
        isValid = false;
      }

      const passRegex =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passRegex.test(password)) {
        showError(
          "signupPassword",
          "Must be 8+ chars, 1 uppercase, 1 number, & 1 special char",
        );
        isValid = false;
      }

      if (!/^\d{10}$/.test(mobile)) {
        showError(
          "signupMobile",
          "Please enter a valid 10-digit mobile number",
        );
        isValid = false;
      }

      if (isValid) {
        window.location.href = "index.html";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let isValid = true;

      ["loginEmail", "loginPassword"].forEach(clearError);

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!validateEmail(email)) {
        showError("loginEmail", "Please enter a valid email address");
        isValid = false;
      }

      if (password.length === 0) {
        showError("loginPassword", "Please enter your password");
        isValid = false;
      }

      if (isValid) {
        window.location.href = "index.html";
      }
    });
  }
});
