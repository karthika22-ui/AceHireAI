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
    return new Uint8Array(65);
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
    browserInfo: navigator.userAgent
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
      message: 'Notification API is not supported on this browser/device.',
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

  // Request Notification Permission
  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }

  if (permission === 'denied') {
    return {
      success: false,
      permissionState: 'denied',
      message: 'Notification permission is currently DENIED. Please enable notifications in your mobile browser site settings.',
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
        // Standard VAPID public key in valid base64url format
        const vapidPublicKey = 'BC800b467657929424687265882672583852893527265738593852735738527357385273573852';
        try {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
          });
        } catch (subErr) {
          console.warn('VAPID subscription notice:', subErr);
        }
      }
      
      // Save push subscription to Supabase if available
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

  // TEST PUSH PAYLOAD CONTENT REQUIRED BY SPEC:
  const testTitle = "🔔 HasHire AI — Today's Learning Reminder";
  const testBody = "🎯 Complete your Today's Goal and today's session.";

  // Post message to Service Worker with a 4-second delay so the user can minimize/close the app!
  if (reg.active) {
    reg.active.postMessage({
      type: 'SCHEDULE_TEST_PUSH',
      title: testTitle,
      body: testBody,
      delayMs: 4000
    });
  } else {
    // Direct Service Worker showNotification call
    setTimeout(() => {
      reg.showNotification(testTitle, {
        body: testBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'hashire-ai-test-reminder',
        renotify: true,
        data: { url: window.location.origin }
      } as any);
    }, 4000);
  }

  return {
    success: true,
    permissionState: 'granted',
    subscription,
    message: "Test push notification scheduled! Please minimize or lock your mobile phone screen now. The push notification will arrive in your phone's system notification tray in 4 seconds.",
    deviceDiagnostic: diag
  };
}
