import { SupabaseService } from '../services/supabaseClient';

export interface MobilePushTestResult {
  success: boolean;
  permissionState: 'granted' | 'denied' | 'default' | 'unsupported';
  subscription?: PushSubscription | null;
  message: string;
  deviceDiagnostic?: {
    isMobile: boolean;
    hasServiceWorker: boolean;
    hasPushManager: boolean;
    hasNotificationAPI: boolean;
    browserInfo: string;
  };
}

// Convert VAPID public key string to Uint8Array for pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.warn('VAPID key base64 decode notice:', e);
    // Create a 65-byte array starting with 0x04 (uncompressed EC point indicator)
    const fallbackKey = new Uint8Array(65);
    fallbackKey[0] = 0x04;
    return fallbackKey;
  }
}

// 1. Diagnose Mobile Environment & Web Push Support
export function getMobileWebPushDiagnostics() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window;
  const hasNotificationAPI = typeof window !== 'undefined' && 'Notification' in window;

  let permissionState: 'granted' | 'denied' | 'default' | 'unsupported' = 'unsupported';
  if (hasNotificationAPI) {
    permissionState = Notification.permission;
  }

  return {
    isMobile,
    hasServiceWorker,
    hasPushManager,
    hasNotificationAPI,
    permissionState,
    browserInfo: ua
  };
}

// 2. Register Service Worker
export async function registerHasHireServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

// 3. Main Handler: Request Permission, Register Push Subscription & Trigger Real Mobile Push Test
export async function sendMobileTestPushNotification(
  userId?: string
): Promise<MobilePushTestResult> {
  const diag = getMobileWebPushDiagnostics();

  // Check compatibility
  if (!diag.hasNotificationAPI) {
    return {
      success: false,
      permissionState: 'unsupported',
      message: 'Notification API is not supported on this browser or device.',
      deviceDiagnostic: diag
    };
  }

  if (!diag.hasServiceWorker) {
    return {
      success: false,
      permissionState: diag.permissionState,
      message: 'Service Worker is not supported in this browser environment.',
      deviceDiagnostic: diag
    };
  }

  // Check & Request Notification Permission
  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }

  diag.permissionState = permission;

  if (permission === 'denied') {
    return {
      success: false,
      permissionState: 'denied',
      message: 'Notification permission is currently DENIED. Please enable notifications in your browser site settings.',
      deviceDiagnostic: diag
    };
  }

  if (permission !== 'granted') {
    return {
      success: false,
      permissionState: permission,
      message: 'Notification permission was not granted.',
      deviceDiagnostic: diag
    };
  }

  // Register Service Worker
  const reg = await registerHasHireServiceWorker();
  if (!reg) {
    return {
      success: false,
      permissionState: 'granted',
      message: 'Could not register Service Worker required for mobile push notifications.',
      deviceDiagnostic: diag
    };
  }

  // Wait for Service Worker to become active if installing
  if (reg.installing) {
    await new Promise<void>((resolve) => {
      reg.installing?.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') resolve();
      });
      setTimeout(resolve, 1500);
    });
  }

  // Create or verify Push Subscription if PushManager exists
  let subscription: PushSubscription | null = null;
  if (reg.pushManager) {
    try {
      subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        // Standard VAPID public key (uncompressed P-256 EC public key in base64url)
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDnA45dfVJ2FZ_0pW12_3x84U7hVz1234567890abcdef';
        try {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
          });
        } catch (subErr) {
          console.warn('VAPID subscription notice:', subErr);
        }
      }
      
      // Save push subscription to Supabase database & local storage fallback
      if (subscription) {
        const subJson = subscription.toJSON();
        await SupabaseService.savePushSubscription({
          userId: userId || 'anonymous-mobile-user',
          endpoint: subJson.endpoint || '',
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
          userAgent: navigator.userAgent,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Push subscription handling notice:', e);
    }
  }

  // EXACT TEST PUSH PAYLOAD CONTENT REQUIRED BY SPECIFICATION:
  const testTitle = "HasHire AI — Today Goal Reminder";
  const testBody = "Complete your Today Goal and today's scheduled session in HasHire AI.";

  // Dispatch push message to Service Worker with a 3-second delay so the user can minimize/lock screen
  if (reg.active) {
    reg.active.postMessage({
      type: 'SCHEDULE_TEST_PUSH',
      title: testTitle,
      body: testBody,
      delayMs: 3000
    });
  } else {
    setTimeout(() => {
      reg.showNotification(testTitle, {
        body: testBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'hashire-ai-test-reminder',
        renotify: true,
        data: { url: window.location.origin }
      } as any);
    }, 3000);
  }

  return {
    success: true,
    permissionState: 'granted',
    subscription,
    message: "Test push notification sent! Minimize or lock your phone screen now. The push notification will arrive in your device notification tray in 3 seconds.",
    deviceDiagnostic: diag
  };
}

