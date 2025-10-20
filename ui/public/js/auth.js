// ------------------ Toggling de formularios ------------------
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const title = document.getElementById("form-title");
const notice = document.getElementById("notice");
const submitBtn = document.querySelector("button[type='submit']");

document.getElementById("show-register").addEventListener("click", (e) => {
    e.preventDefault();
    switchForm("register");
});
document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    switchForm("login");
});

function switchForm(which) {
    clearNotice();
    if (which === "register") {
        loginForm.classList.remove("active");
        registerForm.classList.add("active");
        title.textContent = "Crear cuenta";
    } else {
        registerForm.classList.remove("active");
        loginForm.classList.add("active");
        title.textContent = "Iniciar sesión";
    }
}

// ------------------ Iconos Lucide ------------------
document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide?.createIcons) lucide.createIcons();
    else if (window.lucide?.replace) lucide.replace();
});

// ------------------ Mostrar / Ocultar contraseña ------------------
function refreshLucide(elScope = document) {
    if (window.lucide?.createIcons) lucide.createIcons({ icons: {}, attrs: {}, nameAttr: "data-lucide", replaceAttr: "data-lucide" });
    else if (window.lucide?.replace) lucide.replace({});
}

document.querySelectorAll(".toggle-pass").forEach(btn => {
    btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            icon.setAttribute("data-lucide", "eye-off");
        } else {
            input.type = "password";
            icon.setAttribute("data-lucide", "eye");
        }
        refreshLucide(btn);
        input.focus({ preventScroll: true });
    });
});

// ------------------ VALIDACIÓN ------------------
const patterns = {
    name: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{1,}$/u,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
};

function validateField(input) {
    const name = input.name;
    const value = input.value.trim();
    let message = "";

    if (!value) {
        message = "Este campo es obligatorio.";
    } else if (name === "firstName" || name === "lastName") {
        if (!patterns.name.test(value)) {
            message = "Usá al menos 2 letras (se permiten espacios y acentos).";
        }
    } else if (name === "email") {
        if (!patterns.email.test(value)) {
            message = "Ingresá un correo válido (ej: usuario@dominio.com).";
        }
    } else if (name === "password") {
        if (!patterns.password.test(value)) {
            message = "Mínimo 8 caracteres, con letras y números.";
        }
    }

    setFieldState(input, message);
    return !message;
}

function setFieldState(input, message) {
    const errorEl = input.parentElement.parentElement.classList.contains("password-wrapper")
        ? input.parentElement.nextElementSibling
        : input.parentElement.querySelector(".error");

    if (message) {
        input.classList.add("invalid");
        input.setAttribute("aria-invalid", "true");
        if (errorEl) errorEl.textContent = message;
    } else {
        input.classList.remove("invalid");
        input.removeAttribute("aria-invalid");
        if (errorEl) errorEl.textContent = "";
    }
}

function clearNotice() { notice.textContent = ""; notice.style.color = "var(--success)"; }

// Validación en vivo
[...document.querySelectorAll("#login-form input, #register-form input")].forEach((input) => {
    input.addEventListener("input", () => validateField(input));
    input.addEventListener("blur", () => validateField(input));
});

// Envíos
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearNotice();
    const fields = [...loginForm.querySelectorAll("input")];
    const ok = fields.every(validateField);
    if (ok) {
        await apiLogin({
            email: loginForm.email.value,
            contrasena: loginForm.password.value,
        }, notice).then(({ user }) => {
            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        });

        notice.style.color = "var(--success)";
        notice.textContent = "Inicio de sesión válido ✓";
    } else {
        notice.style.color = "var(--danger)";
        notice.textContent = "Revisá los campos marcados en rojo.";
    }
});

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearNotice();
    const fields = [...registerForm.querySelectorAll("input")];
    const ok = fields.every(validateField);
    if (ok) {
        await apiRegister({
            nombres: registerForm.firstName.value,
            apellidos: registerForm.lastName.value,
            email: registerForm.email.value,
            contrasena: registerForm.password.value,
        }, notice)

        notice.style.color = "var(--success)";
        notice.textContent = "Registro válido ✓";
        submitBtn.disabled = true;

        setTimeout(() => {
            window.location.href = "/auth";
        }, 1500);
    } else {
        notice.style.color = "var(--danger)";
        notice.textContent = "Revisá los campos marcados en rojo.";
    }
});

async function apiRegister(data, notice) {
    const res = await fetch("/api/auth/register", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();

        notice.style.color = "var(--danger)";
        notice.textContent = "Ocurrió un error al registrar.";

        throw new Error(err.error);
    }

    return res.json();
}

async function apiLogin({ email, contrasena }, notice) {
    const res = await fetch("/api/auth/login", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));

        notice.style.color = "var(--danger)";
        notice.textContent = "Ocurrió un error al iniciar sesión.";

        throw new Error(err.error || "No se pudo iniciar sesión");
    }

    return res.json();
}
