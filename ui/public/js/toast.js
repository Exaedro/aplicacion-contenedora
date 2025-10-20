(function () {
    const hasGSAP = typeof window.gsap !== 'undefined';

    window.showToast = function (message, type = "info", duration = 3000) {
        const container = ensureContainer();
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <i data-lucide="${getIcon(type)}" class="icon-16"></i>
      <span>${message}</span>
    `;
        container.appendChild(toast);

        if (window.lucide?.createIcons) lucide.createIcons();

        // Reduce motion: sin animaciones si el usuario lo pide
        const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

        // ENTRADA
        if (hasGSAP && !prefersReduced) {
            gsap.fromTo(toast,
                { autoAlpha: 0, y: -12 },
                { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }
            );
        }

        // AUTO-CIERRE (pausable con hover)
        let remaining = duration;
        let startTime = Date.now();
        let hideTimer = startHideTimer();

        toast.addEventListener("mouseenter", () => {
            clearTimeout(hideTimer);
            remaining -= Date.now() - startTime;
        });

        toast.addEventListener("mouseleave", () => {
            startTime = Date.now();
            hideTimer = startHideTimer();
        });

        // Click en el toast: cierra
        toast.addEventListener('click', () => closeToast(toast));

        function startHideTimer() {
            return setTimeout(() => closeToast(toast), remaining);
        }
    };

    function closeToast(toast) {
        const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (typeof window.gsap !== 'undefined' && !prefersReduced) {
            gsap.to(toast, {
                autoAlpha: 0,
                y: -12,
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => toast.remove(),
            });
        } else {
            toast.remove();
        }
    }

    function ensureContainer() {
        let el = document.getElementById("toastContainer");
        if (!el) {
            el = document.createElement("div");
            el.id = "toastContainer";
            el.className = "toast-container";
            el.setAttribute("aria-live", "polite");
            el.setAttribute("aria-atomic", "true");
            document.body.appendChild(el);
        }
        return el;
    }

    function getIcon(type) {
        switch (type) {
            case "success": return "check-circle";
            case "error": return "x-circle";
            case "warning": return "alert-triangle";
            default: return "info";
        }
    }
})();
