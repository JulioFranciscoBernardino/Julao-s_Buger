const express = require('express');
const router = express.Router();
const https = require('https');

// Calcular distância usando Google Maps Distance Matrix API
router.post('/calcular', (req, res) => {
    try {
        const { origem, destino } = req.body;

        if (!origem || !destino) {
            return res.status(400).json({ erro: 'Origem e destino são obrigatórios' });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ 
                erro: 'Chave da API do Google Maps não configurada',
                usarEstimativa: true
            });
        }

        // Chamar API do Google Maps Distance Matrix
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origem)}&destinations=${encodeURIComponent(destino)}&key=${apiKey}&units=metric&language=pt-BR`;

        https.get(url, (httpsResponse) => {
            let data = '';

            httpsResponse.on('data', (chunk) => {
                data += chunk;
            });

            httpsResponse.on('end', () => {
                try {
                    if (!data || data.trim() === '') {
                        return res.status(500).json({ 
                            erro: 'Resposta vazia da API do Google Maps',
                            usarEstimativa: true
                        });
                    }

                    const jsonData = JSON.parse(data);

                    if (jsonData.status === 'OK' && jsonData.rows?.[0]?.elements?.[0]) {
                        const element = jsonData.rows[0].elements[0];
                        
                        if (element.status === 'OK' && element.distance && element.distance.value) {
                            const distanciaKm = element.distance.value / 1000;
                            const duracaoMinutos = element.duration ? element.duration.value / 60 : 0;
                            
                            return res.json({
                                distancia: parseFloat(distanciaKm.toFixed(2)),
                                duracao: parseFloat(duracaoMinutos.toFixed(0)),
                                status: 'OK'
                            });
                        } else {
                            return res.status(400).json({ 
                                erro: `Erro na API: ${element.status || 'UNKNOWN_ERROR'}`,
                                usarEstimativa: true
                            });
                        }
                    } else {
                        return res.status(400).json({ 
                            erro: `Erro na API: ${jsonData.status || 'UNKNOWN_ERROR'}`,
                            usarEstimativa: true
                        });
                    }
                } catch (parseError) {
                    return res.status(500).json({ 
                        erro: 'Erro ao processar resposta da API',
                        usarEstimativa: true
                    });
                }
            });

            httpsResponse.on('error', (error) => {
                return res.status(500).json({ 
                    erro: 'Erro ao conectar com a API do Google Maps',
                    usarEstimativa: true
                });
            });
        }).on('error', (error) => {
            return res.status(500).json({ 
                erro: 'Erro ao fazer requisição para a API',
                usarEstimativa: true
            });
        });

    } catch (error) {
        return res.status(500).json({ 
            erro: 'Erro ao calcular distância',
            usarEstimativa: true
        });
    }
});

module.exports = router;
