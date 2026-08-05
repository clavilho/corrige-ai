// next.config.js (na raiz do projeto)
module.exports = {
  allowedDevOrigins: [
    // IPs que já apareceram nos seus logs — inclua formas com e sem protocolo/porta
    '192.168.0.241',
    'http://192.168.0.241',
    'http://192.168.0.241:3000',

    '192.168.0.245',
    'http://192.168.0.245',
    'http://192.168.0.245:3000',

    // locais usuais
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
};
