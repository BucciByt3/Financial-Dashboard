// server/middleware/logging.js
import Log from '../models/Log.js';

const addLog = async (type, category, message, details = null) => {
  try {
    const log = new Log({
      type,
      category,
      message,
      details
    });
    await log.save();
  } catch (error) {
    console.error('Logging failed:', error);
  }
};

export default addLog;
