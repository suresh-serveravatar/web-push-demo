self.addEventListener('push', function(event) {
    let options = {};
  
    if (event.data) {
      // Chrome and Firefox
      options = event.data.json();
    } else if (event.data.text) {
      // Safari
      options.body = event.data.text();
    }
  
    event.waitUntil(
      self.registration.showNotification(options.title || 'Push Notification', options)
    );
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
  
    // Add your custom handling for notification click here
    // For example, open a specific URL or focus on a particular tab
  });
  