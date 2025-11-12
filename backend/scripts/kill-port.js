#!/usr/bin/env node

/**
 * Mata proceso ocupando puerto 3001
 */

const { exec } = require('child_process');
const PORT = process.env.PORT || 3001;

exec(`lsof -ti:${PORT}`, (error, stdout) => {
  if (stdout) {
    const pid = stdout.trim();
    console.log(`🔪 Matando proceso ${pid} en puerto ${PORT}...`);
    exec(`kill -9 ${pid}`, (err) => {
      if (err) {
        console.error('Error matando proceso:', err);
        process.exit(1);
      }
      console.log(`✅ Puerto ${PORT} liberado`);
      process.exit(0);
    });
  } else {
    console.log(`✅ Puerto ${PORT} ya está libre`);
    process.exit(0);
  }
});



