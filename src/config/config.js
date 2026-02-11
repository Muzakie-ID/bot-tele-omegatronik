require('dotenv').config();

module.exports = {
  telegram: {
    token: process.env.BOT_TOKEN,
    adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : []
  },
  
  omega: {
    memberId: process.env.OMEGA_MEMBER_ID,
    pin: process.env.OMEGA_PIN,
    password: process.env.OMEGA_PASSWORD,
    endpoint: process.env.OMEGA_ENDPOINT || 'https://apiomega.id/',
    endpointBackup: process.env.OMEGA_ENDPOINT_BACKUP || 'http://188.166.178.169:6969/',
    timeout: 30000, // 30 seconds
    listHargaUrl: 'https://omegatronik.report.web.id/api/script/get?id=xbY1LIzvRQ'
  },
  
  database: {
    path: process.env.DB_PATH || './database/bot.db'
  },
  
  env: process.env.NODE_ENV || 'development'
};
