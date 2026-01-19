import emailjs from "@emailjs/browser";

// EmailJS konfiguráció
const EMAILJS_CONFIG = {
  serviceId: "service_i1g2a4k",
  templateId: "template_wp7hf2m",
  publicKey: "Ux5hnhgW8MuaNaa5q",
};

/**
 * Email küldése foglalás jóváhagyásakor
 * @param {Object} booking - A foglalás adatai
 */
export async function sendApprovalEmail(booking) {
  try {
    // Email template paraméterei
    const templateParams = {
      to_email: booking.userEmail,
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
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Email sikeresen elküldve:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Hiba az email küldése közben:", error);
    return { success: false, error };
  }
}

/**
 * Email küldése foglalás elutasításakor
 * @param {Object} booking - A foglalás adatai
 */
export async function sendRejectionEmail(booking) {
  try {
    const templateParams = {
      to_email: booking.userEmail,
      to_name: booking.name || booking.userName,
      booking_date: booking.date,
      booking_time: booking.time,
      services: booking.servicesMeta
        ?.map((s) => s.label)
        .join(", ") || "Nincs megadva",
    };

    // Külön template elutasításhoz (opcionális - később hozzáadható)
    // Egyelőre ugyanazt a template-et használjuk "rejected" státusszal
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      "template_rejection", // Külön template elutasításhoz
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Elutasító email elküldve:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Hiba az elutasító email küldése közben:", error);
    return { success: false, error };
  }
}

// Konfiguráció frissítése (admin UI-ból később)
export function updateEmailConfig(config) {
  EMAILJS_CONFIG.serviceId = config.serviceId || EMAILJS_CONFIG.serviceId;
  EMAILJS_CONFIG.templateId = config.templateId || EMAILJS_CONFIG.templateId;
  EMAILJS_CONFIG.publicKey = config.publicKey || EMAILJS_CONFIG.publicKey;
}
