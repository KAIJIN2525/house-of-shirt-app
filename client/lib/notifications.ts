import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const ABANDONED_CART_NOTIFICATION_KEY = "@abandoned_cart_notification_id";

/**
 * Schedules a notification to remind the user about items in their cart.
 * If called multiple times, it cancels previous reminders to avoid spam.
 */
export async function scheduleAbandonedCartNotification() {
  const existingIdentifier = await AsyncStorage.getItem(
    ABANDONED_CART_NOTIFICATION_KEY,
  );
  if (existingIdentifier) {
    await Notifications.cancelScheduledNotificationAsync(existingIdentifier).catch(
      () => {},
    );
  }

  // Schedule a new one for 12 hours from now
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your Atelier Bag is waiting",
      body: "Items from your collection are still waiting for you. Complete your order to secure them.",
      data: { url: "/(tabs)/bag" },
    },
    trigger: { 
      type: 'timeInterval',
      seconds: 12 * 60 * 60,
      repeats: false,
    } as any,
  });
  await AsyncStorage.setItem(ABANDONED_CART_NOTIFICATION_KEY, identifier);
}

/**
 * Sends an immediate order confirmation notification to the user.
 */
export async function sendOrderConfirmationNotification(isLagos: boolean, orderNumber: string) {
  const deliveryText = isLagos 
    ? "Our rider will be dispatched today for same-day delivery." 
    : "Your order will be processed and dispatched via GIGL within 3-5 business days.";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Order Confirmed 🥂",
      body: `Thank you for your order ${orderNumber}. ${deliveryText}`,
      data: { orderId: orderNumber.replace("#", ""), url: `/orders/${orderNumber.replace("#", "")}` },
    },
    trigger: null, // null means send immediately
  });
}

/**
 * Cancels the abandoned cart reminder (call this on successful checkout)
 */
export async function cancelAbandonedCartNotification() {
  const identifier = await AsyncStorage.getItem(
    ABANDONED_CART_NOTIFICATION_KEY,
  );
  if (!identifier) return;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await AsyncStorage.removeItem(ABANDONED_CART_NOTIFICATION_KEY);
}
