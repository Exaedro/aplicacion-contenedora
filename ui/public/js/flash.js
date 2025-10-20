// =================================================
// Este archivo es para poder mostrar las alertas despues de recargar la pagina
// =================================================

const FLASH_KEY = 'app.flash';

function setFlash(message, type = 'info', ttlMs = 10000) {
    const payload = {
        message,
        type,
        exp: Date.now() + ttlMs
    };
    try {
        localStorage.setItem(FLASH_KEY, JSON.stringify(payload));
    } catch { }
}

function consumeFlash() {
    try {
        const raw = localStorage.getItem(FLASH_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        localStorage.removeItem(FLASH_KEY);
        if (!data?.message || !data?.type) return null;
        if (data.exp && Date.now() > data.exp) return null; // vencido
        return data;
    } catch {
        localStorage.removeItem(FLASH_KEY);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const flash = consumeFlash();
    if (flash && window.showToast) {
        showToast(flash.message, flash.type);
    }
});
