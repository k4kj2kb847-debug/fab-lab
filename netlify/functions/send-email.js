// Fonction serveur Netlify : envoie un email via l'API Brevo.
// La clé API reste ici, côté serveur (variable d'environnement Netlify) — jamais visible
// dans le code de l'appli ni sur GitHub, contrairement à l'ancienne clé publique EmailJS.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Requête invalide' }) };
  }

  const { to_email, to_name, from_name, message } = payload;
  if (!to_email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Champs manquants (destinataire ou message)' }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    return { statusCode: 500, body: JSON.stringify({ error: "Configuration serveur incomplète : vérifiez BREVO_API_KEY et BREVO_SENDER_EMAIL dans les variables d'environnement Netlify." }) };
  }

  const htmlContent = `<html><body style="font-family:Arial,sans-serif;color:#222;">
    <p>Salut ${escapeHtml(to_name || '')},</p>
    <p>${escapeHtml(String(message)).replace(/\n/g, '<br>')}</p>
    <p>${escapeHtml(from_name || "Fab'Lab")}</p>
  </body></html>`;

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: "Fab'Lab — Pôle PACA Handball", email: senderEmail },
        to: [{ email: to_email, name: to_name || to_email }],
        subject: "Message de l'équipe — Fab'Lab",
        htmlContent,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data.message || 'Erreur Brevo', details: data }) };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true, id: data.messageId || null }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
