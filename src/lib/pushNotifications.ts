// Web Push notification utilities

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function showLocalNotification(title: string, body: string) {
  if (Notification.permission !== 'granted') return;
  
  const registration = await navigator.serviceWorker?.ready;
  if (registration) {
    registration.showNotification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'speedwork-notification',
    });
  } else {
    new Notification(title, { body, icon: '/favicon.png' });
  }
}
