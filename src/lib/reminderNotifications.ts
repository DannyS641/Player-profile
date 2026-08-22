import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const REMINDER_HOUR = 8;

const hashToInt32 = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
};

export async function scheduleReminderNotification(reminder: {
  id: string;
  event_date: string;
  title: string;
}) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== "granted") return;
    }

    const [year, month, day] = reminder.event_date.split("-").map(Number);
    const fireDate = new Date(year, month - 1, day, REMINDER_HOUR, 0, 0);
    if (fireDate.getTime() <= Date.now()) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: hashToInt32(reminder.id),
          title: "Reminder",
          body: reminder.title,
          schedule: { at: fireDate },
        },
      ],
    });
  } catch {
    // Notifications are a convenience, not a blocker for saving the reminder.
  }
}

export async function cancelReminderNotification(reminderId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: hashToInt32(reminderId) }],
    });
  } catch {
    // Nothing to clean up if the plugin isn't available.
  }
}
