/**
 * FibonroseTrust REST API Controller Index
 * 
 * This file serves as the entry point for the REST API, registering all API versions
 * and providing API documentation.
 */

import { Router, Request, Response } from 'express';
import apiV1Router from './v1';
import path from 'path';
import fs from 'fs';

// Create the main API router
const apiRouter = Router();

// API metadata
const API_VERSION = '1.0.0';
const API_BASE_PATH = '/api';

// Register API version routers
apiRouter.use('/v1', apiV1Router);

// Default route redirects to latest version
apiRouter.get('/', (req: Request, res: Response) => {
  res.redirect('/api/v1');
});

// API version info
apiRouter.get('/version', (req: Request, res: Response) => {
  res.json({
    version: API_VERSION,
    name: 'FibonroseTrust API',
    description: 'REST API for FibonroseTrust Decentralized Identity Framework',
    latestVersion: 'v1',
    documentation: '/api/docs'
  });
});

// API documentation entry point
apiRouter.get('/docs', (req: Request, res: Response) => {
  res.json({
    title: 'FibonroseTrust API Documentation',
    description: 'REST API for FibonroseTrust Decentralized Identity Framework',
    version: API_VERSION,
    baseUrl: API_BASE_PATH,
    endpoints: [
      {
        path: '/api/v1/users',
        description: 'User management endpoints',
        documentation: '/api/docs/users'
      },
      {
        path: '/api/v1/verifications',
        description: 'Verification management endpoints',
        documentation: '/api/docs/verifications'
      },
      {
        path: '/api/v1/trust-scores',
        description: 'Trust score management endpoints',
        documentation: '/api/docs/trust-scores'
      },
      {
        path: '/api/v1/nfts',
        description: 'NFT management endpoints',
        documentation: '/api/docs/nfts'
      },
      {
        path: '/api/v1/webhooks',
        description: 'Webhook management endpoints',
        documentation: '/api/docs/webhooks'
      },
      {
        path: '/api/v1/security',
        description: 'Security framework endpoints',
        documentation: '/api/docs/security'
      },
      {
        path: '/api/v1/integrations',
        description: 'Third-party integration endpoints',
        documentation: '/api/docs/integrations'
      },
    ]
  });
});

// Detailed documentation for each endpoint group
apiRouter.get('/docs/:section', (req: Request, res: Response) => {
  const { section } = req.params;
  const docFile = path.join(__dirname, '..', '..', '..', 'docs', 'api', `${section}.json`);
  
  try {
    if (fs.existsSync(docFile)) {
      const documentation = JSON.parse(fs.readFileSync(docFile, 'utf8'));
      res.json(documentation);
    } else {
      res.status(404).json({
        error: 'Documentation not found',
        message: `No documentation available for ${section}`
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Error loading documentation',
      message: 'Documentation file could not be read'
    });
  }
});

export default apiRouter;