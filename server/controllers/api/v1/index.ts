/**
 * FibonroseTrust REST API v1 Controllers Index
 * 
 * This file consolidates all API controllers for version 1 of the FibonroseTrust REST API
 */

import { Router, Request, Response } from 'express';

// Create the main router for API v1
const apiV1Router = Router();

// Temporary implementation until all controllers are properly integrated
apiV1Router.get('/', (req: Request, res: Response) => {
  res.json({
    version: '1.0.0',
    name: 'FibonroseTrust API v1',
    endpoints: [
      '/users',
      '/verifications',
      '/trust-scores',
      '/nfts',
      '/webhooks',
      '/security',
      '/integrations'
    ],
    status: 'Under active development',
    documentation: '/api/docs'
  });
});

// Once individual controllers are ready, uncomment and integrate them:
/*
import userRoutes from './user.controller';
import verificationRoutes from './verification.controller';
import trustScoreRoutes from './trust-score.controller';
import nftRoutes from './nft.controller';
import webhookRoutes from './webhook.controller';
import securityRoutes from './security.controller';
import integrationRoutes from './integration.controller';

// Register all route controllers
apiV1Router.use('/users', userRoutes);
apiV1Router.use('/verifications', verificationRoutes);
apiV1Router.use('/trust-scores', trustScoreRoutes);
apiV1Router.use('/nfts', nftRoutes);
apiV1Router.use('/webhooks', webhookRoutes);
apiV1Router.use('/security', securityRoutes);
apiV1Router.use('/integrations', integrationRoutes);
*/

export default apiV1Router;