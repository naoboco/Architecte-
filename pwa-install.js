(() => {
  const RESET_KEY = 'archi-pwa-reset-v5';

  async function resetOldPwaOnce() {
    if (localStorage.getItem(RESET_KEY)) return false;
    localStorage.setItem(RESET_KEY, '1');
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith('archi-')).map((key) => caches.delete(key)));
      }
    } catch (_) {}
    location.reload();
    return true;
  }

  async function initInstall() {
    if (await resetOldPwaOnce()) return;

    let deferredPrompt = null;
    const button = document.getElementById('installApp');
    if (!button) return;

    button.textContent = '📲 Installer l’application';
    button.hidden = true;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      button.hidden = false;
    });

    button.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') button.hidden = true;
      deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      button.hidden = true;
    });

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      } catch (_) {}
    }
  }

  initInstall();
})();
