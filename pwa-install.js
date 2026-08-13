(() => {
  let deferredPrompt = null;
  const button = document.getElementById('installApp');
  if (!button) return;

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
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      button.hidden = true;
      return;
    }

    if (isIOS) {
      alert("Sur iPhone/iPad : touche Partager, puis ‘Sur l’écran d’accueil’.");
    } else {
      alert("Ouvre le menu du navigateur puis choisis ‘Installer l’application’ ou ‘Ajouter à l’écran d’accueil’.");
    }
  });

  window.addEventListener('appinstalled', () => {
    button.hidden = true;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
  }
})();
