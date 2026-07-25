require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');

const { getPool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Sessione lato server per il login (spec, requisito #10). In modalità demo
// (DEMO_MODE, vedi scripts/run-demo-server.js) usa lo store in memoria di
// default: nessun Postgres reale a cui appoggiarsi. Fuori dalla demo, le
// sessioni sono salvate su Postgres (connect-pg-simple) così sopravvivono ai
// riavvii del server — MemoryStore non è adatta alla produzione.
const sessionConfig = {
  name: 'mast231.sid',
  secret: process.env.SESSION_SECRET || 'sviluppo-locale-non-sicuro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

if (!process.env.DEMO_MODE) {
  // eslint-disable-next-line global-require
  const PgSession = require('connect-pg-simple')(session);
  sessionConfig.store = new PgSession({ pool: getPool(), createTableIfMissing: true });
}

app.use(session(sessionConfig));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', require('./routes'));

app.listen(PORT, () => {
  console.log(`Backend in ascolto sulla porta ${PORT}`);
});
