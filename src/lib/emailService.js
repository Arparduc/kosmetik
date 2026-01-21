import emailjs from "@emailjs/browser";
import { logger } from "./logger";

// EmailJS konfiguráció - környezeti változókból
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

const TEMPLATE_IDS = {
  approval: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_APPROVAL,
  rejection: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_REJECTION,
};

/**
 * Email küldése foglalás jóváhagyásakor
 * @param {Object} booking - A foglalás adatai
 */
export async function sendApprovalEmail(booking) {
  try {
    // Email cím ellenőrzése
    const userEmail = booking.userEmail || booking.email;

    if (!userEmail) {
      logger.warn("⚠️ Nincs email cím, email nem kerül kiküldésre.");
      return { success: false, error: "No email address" };
    }

    // Email template paraméterei
    const templateParams = {
      email: userEmail,  // <-- Template {{email}} paraméter
      to_name: booking.name || booking.userName,
      booking_date: booking.date,
      booking_time: booking.time,
      services: booking.servicesMeta
        ?.map((s) => s.label)
        .join(", ") || "Nincs megadva",
      total_price: booking.totalPrice
        ? new Intl.NumberFormat("hu-HU").format(booking.totalPrice) + " Ft"
        : "—",
      duration: booking.durationMinutes ? `${booking.durationMinutes} perc` : "—",
      phone: booking.phone || "Nincs megadva",
      notes: booking.notes || "Nincs megjegyzés",
    };

    // Email küldése EmailJS-en keresztül
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      TEMPLATE_IDS.approval,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    logger.log("✅ Email sikeresen elküldve:", response);
    return { success: true, response };
  } catch (error) {
    logger.error("❌ Hiba az email küldése közben:", error);
    return { success: false, error };
  }
}

/**
 * Email küldése foglalás elutasításakor vagy törlésekor
 * @param {Object} booking - A foglalás adatai
 */
export async function sendRejectionEmail(booking) {
  try {
    // Email cím ellenőrzése
    const userEmail = booking.userEmail || booking.email;

    if (!userEmail) {
      logger.warn("⚠️ Nincs email cím, email nem kerül kiküldésre.");
      return { success: false, error: "No email address" };
    }

    // Email template paraméterei
    const templateParams = {
      email: userEmail,  // <-- Template {{email}} paraméter
      to_name: booking.name || booking.userName,
      booking_date: booking.date,
      booking_time: booking.time,
      services: booking.servicesMeta
        ?.map((s) => s.label)
        .join(", ") || "Nincs megadva",
    };

    // Email küldése EmailJS-en keresztül
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      TEMPLATE_IDS.rejection,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    logger.log("✅ Visszamondó email elküldve:", response);
    return { success: true, response };
  } catch (error) {
    logger.error("❌ Hiba a visszamondó email küldése közben:", error);
    return { success: false, error };
  }
}
