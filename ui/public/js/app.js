// Tema: lee preferencia y media query
(function initTheme() {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldDark);
})();

// Render inicial de iconos (excepto el del tema, que lo seteamos manual)
document.addEventListener("DOMContentLoaded", () => {
    // Todos los <i data-lucide="...">
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }

    // Icono de tema
    renderThemeIcon();

    // Toggle
    const toggleBtn = document.getElementById("toggleTheme");
    toggleBtn.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        renderThemeIcon();
    });
});

// Dibuja el icono (sol/luna) según el modo actual
function renderThemeIcon() {
  const isDark = document.documentElement.classList.contains("dark");
  const el = document.getElementById("themeIcon");
  const name = isDark ? "sun" : "moon";

  // Si está el mapa de íconos (UMD), usá toSvg
  const icon = window.lucide && window.lucide.icons && window.lucide.icons[name];
  if (icon && typeof icon.toSvg === "function") {
    el.innerHTML = icon.toSvg({ width: 20, height: 20 });
    return;
  }

  // Fallback universal: dibuja un <i data-lucide="..."> y dejá que createIcons lo reemplace
  el.innerHTML = `<i data-lucide="${name}"></i>`;
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons({ attrs: { width: 20, height: 20 } });
  }
}

// (Opcional) pequeña UX en search
const input = document.getElementById("searchInput");
if (input) {
    input.addEventListener("focus", () => input.parentElement.classList.add("focus"));
    input.addEventListener("blur", () => input.parentElement.classList.remove("focus"));
}

