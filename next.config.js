// next.config.js
// Adiciona allowedDevOrigins para permitir acesso ao HMR em hosts de desenvolvimento na rede local.
// Reinicie o servidor de desenvolvimento após alterar este arquivo.

module.exports = {
  // Ajuste as origens conforme necessário (inclua protocolo e porta exatos usados no celular)
  allowedDevOrigins: [
    'http://192.168.0.245',
    'http://192.168.0.245:3000',
    'http://localhost:3000'
  ],
};
