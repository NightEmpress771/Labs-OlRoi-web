import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Booking Service',
      version: '1.0.0',
      description: 'Документація API для вебсервісу оренди велосипедів та самокатів',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Локальний сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpecs = swaggerJsdoc(options);