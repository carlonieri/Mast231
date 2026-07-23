function getImapConfig() {
  return {
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT) || 993,
    secure: process.env.IMAP_TLS !== 'false',
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASSWORD,
    },
    logger: false,
  };
}

const FOLDERS = {
  inbox: process.env.IMAP_INBOX_FOLDER || 'INBOX',
  sent: process.env.IMAP_SENT_FOLDER || 'Posta Inviata',
};

module.exports = { getImapConfig, FOLDERS };
