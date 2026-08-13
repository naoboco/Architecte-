(() => {
  let deferredPrompt = null;
  const button = document.getElementById('installApp');
  if (!button) return;

  button.textContent = '📲 Installer l’application';

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    button.hidden = true;
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (choice.outcome === 'accepted') button.hidden = true;
      return;
    }

    if (isIOS) {
      alert("Sur iPhone/iPad : touche Partager, puis Sur l’écran d’accueil, puis Ajouter.");
    } else {
      alert("Ouvre le menu du navigateur puis choisis Installer l’application ou Ajouter à l’écran d’accueil.");
    }
  });

  window.addEventListener('appinstalled', () => {
    button.hidden = true;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }
})();
