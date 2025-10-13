// Force refresh script to clear any cached responses
(function() {
  // Check if this is the first visit (no previous page load)
  const hasVisited = sessionStorage.getItem('eudaura-visited');
  
  if (!hasVisited) {
    // Mark as visited
    sessionStorage.setItem('eudaura-visited', 'true');
    
    // Clear any service workers from other domains/apps
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('[SW Cleanup] Unregistered:', registration.scope);
        }
      });
    }
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) {
          caches.delete(name);
          console.log('[Cache Cleanup] Deleted cache:', name);
        }
      });
    }
    
    // Force reload if we see "Not authenticated" text
    setTimeout(function() {
      if (document.body && document.body.textContent.includes('Not authenticated')) {
        console.log('[Force Refresh] Detected auth error, reloading...');
        window.location.reload(true);
      }
    }, 100);
  }
})();
