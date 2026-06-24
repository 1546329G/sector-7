import 'mysql2';
import app from '../backend/app.js';

export default function handler(req, res) {
  app(req, res);
}
