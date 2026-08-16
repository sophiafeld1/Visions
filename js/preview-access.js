(function () {
  const STORAGE_KEY = "visions-preview-access";
  const PASSWORD = "supersecretaccess";
  const SHOP_URL = "index.html";

  function hasAccess() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "granted";
    } catch {
      return false;
    }
  }

  function grantAccess() {
    try {
      localStorage.setItem(STORAGE_KEY, "granted");
    } catch {
      /* ignore storage errors */
    }
  }

  function requireAccess(redirectTo) {
    if (hasAccess()) {
      return;
    }

    window.location.replace(redirectTo || "home.html");
  }

  function initUnlockForm() {
    const form = document.getElementById("preview-access-form");
    if (!form) {
      return;
    }

    const input = document.getElementById("preview-access-password");
    const error = document.getElementById("preview-access-error");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!input) {
        return;
      }

      if (input.value === PASSWORD) {
        grantAccess();
        window.location.href = SHOP_URL;
        return;
      }

      if (error) {
        error.hidden = false;
        error.textContent = "Incorrect password";
      }

      input.focus();
      input.select();
    });
  }

  window.PreviewAccess = {
    hasAccess: hasAccess,
    grantAccess: grantAccess,
    requireAccess: requireAccess,
    initUnlockForm: initUnlockForm,
  };
})();
