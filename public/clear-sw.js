// Clear any service workers from other Eudaura domains
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      // Only unregister if it's not from our current origin
      if (registration.scope !== window.location.origin + '/') {
        registration.unregister().then(function(success) {
          if (success) {
            console.log('[SW Cleanup] Unregistered service worker from:', registration.scope);
          }
        });
      }
    }
  });
}
