// ─── Telegram Bot Service (Fase 4) ──────────────────────────────────────────
// Mengirimkan notifikasi pengumpulan tugas santri (khususnya foto & video besar)
// langsung ke Telegram Supergroup / Channel sekolah.

export interface TelegramSubmissionParams {
  namaMurid: string;
  nis?: string | null;
  kelasNama: string;
  mapelNama: string;
  tugasJudul: string;
  jenisTugas: string;
  fileUrl?: string | null;
  fileName?: string | null;
  autoNilai?: number | null;
  isLargeVideo?: boolean;
  threadId?: number | null; // Untuk Supergroup Topics
}

/**
 * Kirim pesan teks terformat ke Telegram Supergroup
 */
export async function sendTelegramMessage(
  text: string,
  threadId?: number | null
): Promise<{ success: boolean; messageId?: number; skipped?: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SUPERGROUP_ID;

  if (!token || !chatId) {
    // Kredensial belum diisi, lewati tanpa error agar alur app tidak terganggu
    return { success: false, skipped: true };
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };

    if (threadId) {
      payload.message_thread_id = threadId;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn("[telegram] Gagal kirim pesan:", data.description);
      return { success: false, error: data.description };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: any) {
    console.error("[telegram] Network error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Format & kirim notifikasi pengumpulan tugas santri
 */
export async function sendTelegramSubmission(
  params: TelegramSubmissionParams
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const timeStr = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const header = params.isLargeVideo
    ? "📹 <b>PENGUMPULAN VIDEO BESAR (> 40MB)</b>"
    : "📬 <b>TUGAS SANTRI DIKUMPULKAN</b>";

  let msg = `${header}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 <b>Santri:</b> ${escapeHtml(params.namaMurid)} ${params.nis ? `(NIS: ${params.nis})` : ""}\n`;
  msg += `🏫 <b>Kelas:</b> ${escapeHtml(params.kelasNama)}\n`;
  msg += `📚 <b>Mapel:</b> ${escapeHtml(params.mapelNama)}\n`;
  msg += `📝 <b>Tugas:</b> ${escapeHtml(params.tugasJudul)}\n`;
  msg += `📌 <b>Jenis:</b> ${params.jenisTugas.toUpperCase()}\n`;
  msg += `⏰ <b>Waktu:</b> ${timeStr} WIB\n`;

  if (params.autoNilai !== undefined && params.autoNilai !== null) {
    msg += `⭐ <b>Nilai Otomatis:</b> ${params.autoNilai} / 100\n`;
  }

  if (params.fileName) {
    msg += `📎 <b>File:</b> <code>${escapeHtml(params.fileName)}</code>\n`;
  }

  if (params.fileUrl) {
    msg += `🔗 <b>Google Drive:</b> <a href="${params.fileUrl}">Buka Berkas di Drive</a>\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `<i>Kelas Online Royatul Qur'an</i>`;

  return sendTelegramMessage(msg, params.threadId);
}

/**
 * Buat Topik baru di Telegram Supergroup (Forum)
 */
export async function createTelegramTopic(
  topicName: string
): Promise<{ success: boolean; threadId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SUPERGROUP_ID;

  if (!token || !chatId) {
    return { success: false, error: "Telegram belum dikonfigurasi." };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/createForumTopic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        name: topicName,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn(`[telegram] Gagal buat topik "${topicName}":`, data.description);
      return { success: false, error: data.description };
    }

    return { success: true, threadId: data.result?.message_thread_id };
  } catch (err: any) {
    console.error("[telegram] Network error buat topik:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Hapus / Tutup Topik di Telegram Supergroup (Forum)
 */
export async function deleteTelegramTopic(
  threadId: number
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SUPERGROUP_ID;

  if (!token || !chatId || !threadId) {
    return { success: false, error: "Telegram atau threadId belum valid." };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteForumTopic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: threadId,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn(`[telegram] Gagal hapus topik ${threadId}:`, data.description);
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[telegram] Network error hapus topik:", err.message);
    return { success: false, error: err.message };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
