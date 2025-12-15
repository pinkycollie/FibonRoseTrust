/**
 * AI Services Controller
 * REST API endpoints for AI-powered VR business services
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  vrBusinessAI,
  taskAutomation,
  adaptiveLearningSystem,
  partnershipAutomation,
  reportingEngine,
  type DisabilityType
} from '../../../services/ai';

const router = Router();

// Validation schemas
const registerClientSchema = z.object({
  clientId: z.string().min(1),
  disabilityType: z.enum(['visual_impairment', 'hearing_impairment', 'mobility_impairment', 'cognitive_disability']),
  name: z.string().optional()
});

const submitAnswerSchema = z.object({
  answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
  adaptationsUsed: z.array(z.string()).optional()
});

const clientProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  disabilityType: z.string().min(1),
  businessType: z.string().optional(),
  preferredCommunication: z.enum(['email', 'text', 'video', 'phone']),
  automationPreferences: z.object({
    documentProcessing: z.boolean(),
    communicationAutomation: z.boolean(),
    progressTracking: z.boolean(),
    reportGeneration: z.boolean()
  })
});

const clientAssessmentSchema = z.object({
  clientId: z.string().min(1),
  businessType: z.string().min(1),
  learningStyle: z.enum(['visual', 'auditory', 'reading_writing', 'kinesthetic']),
  accommodations: z.array(z.string()),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()),
  timeAvailable: z.number().min(1)
});

const clientNeedsSchema = z.object({
  clientId: z.string().min(1),
  businessType: z.string().min(1),
  disabilityType: z.string().min(1),
  requiredServices: z.array(z.string()),
  budget: z.number().optional(),
  urgency: z.enum(['low', 'normal', 'high', 'urgent']),
  specialRequirements: z.array(z.string()).optional()
});

const reportConfigSchema = z.object({
  clientId: z.string().min(1),
  reportingInterval: z.enum(['weekly', 'bi-weekly', 'monthly', 'quarterly']),
  includeProjections: z.boolean(),
  includeRecommendations: z.boolean(),
  accessibleFormats: z.array(z.enum(['pdf', 'html', 'audio', 'braille'])),
  recipients: z.array(z.string()),
  customMetrics: z.array(z.string()).optional()
});

// =====================================================
// VR Business AI Routes
// =====================================================

/**
 * @route POST /api/v1/ai/clients
 * @description Register a new VR client
 */
router.post('/clients', (req: Request, res: Response) => {
  try {
    const validation = registerClientSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const { clientId, disabilityType, name } = validation.data;
    const client = vrBusinessAI.registerClient(clientId, disabilityType as DisabilityType, name);

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register client'
    });
  }
});

/**
 * @route GET /api/v1/ai/clients/:clientId
 * @description Get client information
 */
router.get('/clients/:clientId', (req: Request, res: Response) => {
  try {
    const client = vrBusinessAI.getClient(req.params.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client'
    });
  }
});

/**
 * @route GET /api/v1/ai/interview/questions/:disabilityType
 * @description Get interview questions for a disability type
 */
router.get('/interview/questions/:disabilityType', (req: Request, res: Response) => {
  try {
    const disabilityType = req.params.disabilityType as DisabilityType;
    const validTypes: DisabilityType[] = ['visual_impairment', 'hearing_impairment', 'mobility_impairment', 'cognitive_disability'];
    
    if (!validTypes.includes(disabilityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid disability type',
        validTypes
      });
    }

    const questions = vrBusinessAI.getInterviewQuestions(disabilityType);
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get interview questions'
    });
  }
});

/**
 * @route POST /api/v1/ai/interview/start/:clientId
 * @description Start an interview session for a client
 */
router.post('/interview/start/:clientId', async (req: Request, res: Response) => {
  try {
    const session = await vrBusinessAI.startInterview(req.params.clientId);
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start interview'
    });
  }
});

/**
 * @route GET /api/v1/ai/interview/session/:sessionId
 * @description Get interview session details
 */
router.get('/interview/session/:sessionId', (req: Request, res: Response) => {
  try {
    const session = vrBusinessAI.getInterviewSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get interview session'
    });
  }
});

/**
 * @route GET /api/v1/ai/interview/session/:sessionId/current-question
 * @description Get current question in an interview session
 */
router.get('/interview/session/:sessionId/current-question', (req: Request, res: Response) => {
  try {
    const question = vrBusinessAI.getCurrentQuestion(req.params.sessionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'No current question available or interview completed'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current question'
    });
  }
});

/**
 * @route POST /api/v1/ai/interview/session/:sessionId/answer
 * @description Submit an answer to the current question
 */
router.post('/interview/session/:sessionId/answer', async (req: Request, res: Response) => {
  try {
    const validation = submitAnswerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const { answer, adaptationsUsed } = validation.data;
    const result = await vrBusinessAI.submitAnswer(
      req.params.sessionId,
      answer,
      adaptationsUsed
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit answer'
    });
  }
});

/**
 * @route POST /api/v1/ai/business-plan/generate/:sessionId
 * @description Generate a business plan from completed interview
 */
router.post('/business-plan/generate/:sessionId', async (req: Request, res: Response) => {
  try {
    const businessPlan = await vrBusinessAI.generateBusinessPlan(req.params.sessionId);
    res.status(201).json({
      success: true,
      data: businessPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate business plan'
    });
  }
});

/**
 * @route GET /api/v1/ai/business-plan/:planId
 * @description Get a business plan by ID
 */
router.get('/business-plan/:planId', (req: Request, res: Response) => {
  try {
    const plan = vrBusinessAI.getBusinessPlan(req.params.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Business plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get business plan'
    });
  }
});

/**
 * @route GET /api/v1/ai/business-plan/client/:clientId
 * @description Get all business plans for a client
 */
router.get('/business-plan/client/:clientId', (req: Request, res: Response) => {
  try {
    const plans = vrBusinessAI.getClientBusinessPlans(req.params.clientId);
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client business plans'
    });
  }
});

// =====================================================
// Task Automation Routes
// =====================================================

/**
 * @route POST /api/v1/ai/automation/profile
 * @description Register a client profile for automation
 */
router.post('/automation/profile', (req: Request, res: Response) => {
  try {
    const validation = clientProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const profile = taskAutomation.registerClientProfile(validation.data);
    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register client profile'
    });
  }
});

/**
 * @route POST /api/v1/ai/automation/workflows/:clientId
 * @description Create workflow automations for a client
 */
router.post('/automation/workflows/:clientId', async (req: Request, res: Response) => {
  try {
    const profile = taskAutomation.getClientProfile(req.params.clientId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Client profile not found. Please register a profile first.'
      });
    }

    const workflows = await taskAutomation.createWorkflowAutomations(profile);
    
    // Convert Map to object for JSON response
    const workflowsObj: Record<string, unknown> = {};
    workflows.forEach((value, key) => {
      workflowsObj[key] = value;
    });

    res.status(201).json({
      success: true,
      data: workflowsObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflows'
    });
  }
});

/**
 * @route GET /api/v1/ai/automation/workflows/client/:clientId
 * @description Get all workflows for a client
 */
router.get('/automation/workflows/client/:clientId', (req: Request, res: Response) => {
  try {
    const workflows = taskAutomation.getClientWorkflows(req.params.clientId);
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client workflows'
    });
  }
});

/**
 * @route POST /api/v1/ai/automation/workflow/:workflowId/execute
 * @description Execute a workflow
 */
router.post('/automation/workflow/:workflowId/execute', async (req: Request, res: Response) => {
  try {
    const execution = await taskAutomation.executeWorkflow(
      req.params.workflowId,
      req.body.triggerData
    );
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute workflow'
    });
  }
});

/**
 * @route POST /api/v1/ai/automation/workflow/:workflowId/pause
 * @description Pause a workflow
 */
router.post('/automation/workflow/:workflowId/pause', (req: Request, res: Response) => {
  try {
    const success = taskAutomation.pauseWorkflow(req.params.workflowId);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    res.json({ success: true, message: 'Workflow paused' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause workflow'
    });
  }
});

/**
 * @route POST /api/v1/ai/automation/workflow/:workflowId/resume
 * @description Resume a paused workflow
 */
router.post('/automation/workflow/:workflowId/resume', (req: Request, res: Response) => {
  try {
    const success = taskAutomation.resumeWorkflow(req.params.workflowId);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    res.json({ success: true, message: 'Workflow resumed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume workflow'
    });
  }
});

// =====================================================
// Adaptive Learning System Routes
// =====================================================

/**
 * @route POST /api/v1/ai/learning/path
 * @description Generate a personalized learning path
 */
router.post('/learning/path', async (req: Request, res: Response) => {
  try {
    const validation = clientAssessmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const learningPath = await adaptiveLearningSystem.generateLearningPath(validation.data);
    
    // Convert Map to array for JSON serialization
    const pathData = {
      ...learningPath,
      progress: Array.from(learningPath.progress.entries())
    };

    res.status(201).json({
      success: true,
      data: pathData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate learning path'
    });
  }
});

/**
 * @route GET /api/v1/ai/learning/path/:pathId
 * @description Get a learning path by ID
 */
router.get('/learning/path/:pathId', (req: Request, res: Response) => {
  try {
    const path = adaptiveLearningSystem.getLearningPath(req.params.pathId);
    if (!path) {
      return res.status(404).json({
        success: false,
        error: 'Learning path not found'
      });
    }

    // Convert Map to array for JSON serialization
    const pathData = {
      ...path,
      progress: Array.from(path.progress.entries())
    };

    res.json({
      success: true,
      data: pathData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get learning path'
    });
  }
});

/**
 * @route GET /api/v1/ai/learning/module/:moduleId
 * @description Get a learning module by ID
 */
router.get('/learning/module/:moduleId', (req: Request, res: Response) => {
  try {
    const module = adaptiveLearningSystem.getModule(req.params.moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Learning module not found'
      });
    }

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get learning module'
    });
  }
});

/**
 * @route POST /api/v1/ai/learning/progress
 * @description Update learning progress
 */
router.post('/learning/progress', (req: Request, res: Response) => {
  try {
    const { clientId, moduleId, contentId, timeSpent } = req.body;
    
    if (!clientId || !moduleId || !contentId || typeof timeSpent !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, moduleId, contentId, timeSpent'
      });
    }

    const progress = adaptiveLearningSystem.updateProgress(
      clientId,
      moduleId,
      contentId,
      timeSpent
    );

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    });
  }
});

/**
 * @route POST /api/v1/ai/learning/assessment
 * @description Submit assessment score
 */
router.post('/learning/assessment', (req: Request, res: Response) => {
  try {
    const { clientId, moduleId, assessmentId, score } = req.body;
    
    if (!clientId || !moduleId || !assessmentId || typeof score !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, moduleId, assessmentId, score'
      });
    }

    const progress = adaptiveLearningSystem.submitAssessmentScore(
      clientId,
      moduleId,
      assessmentId,
      score
    );

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit assessment'
    });
  }
});

// =====================================================
// Partnership Automation Routes
// =====================================================

/**
 * @route GET /api/v1/ai/partners
 * @description Get all active partners
 */
router.get('/partners', (req: Request, res: Response) => {
  try {
    const partners = partnershipAutomation.getActivePartners();
    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get partners'
    });
  }
});

/**
 * @route GET /api/v1/ai/partners/service/:serviceType
 * @description Get partners by service type
 */
router.get('/partners/service/:serviceType', (req: Request, res: Response) => {
  try {
    const partners = partnershipAutomation.getPartnersByService(req.params.serviceType);
    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get partners'
    });
  }
});

/**
 * @route POST /api/v1/ai/services/coordinate
 * @description Coordinate services for client needs
 */
router.post('/services/coordinate', async (req: Request, res: Response) => {
  try {
    const validation = clientNeedsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const clientNeeds = {
      id: validation.data.clientId,
      ...validation.data
    };

    const servicePlan = await partnershipAutomation.coordinateServices(clientNeeds);
    res.status(201).json({
      success: true,
      data: servicePlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to coordinate services'
    });
  }
});

/**
 * @route GET /api/v1/ai/services/plan/:planId
 * @description Get service plan by ID
 */
router.get('/services/plan/:planId', (req: Request, res: Response) => {
  try {
    const plan = partnershipAutomation.getServicePlan(req.params.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Service plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service plan'
    });
  }
});

/**
 * @route GET /api/v1/ai/services/requests/client/:clientId
 * @description Get all service requests for a client
 */
router.get('/services/requests/client/:clientId', (req: Request, res: Response) => {
  try {
    const requests = partnershipAutomation.getClientServiceRequests(req.params.clientId);
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get service requests'
    });
  }
});

/**
 * @route PATCH /api/v1/ai/services/request/:requestId/status
 * @description Update service request status
 */
router.patch('/services/request/:requestId/status', (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses
      });
    }

    const request = partnershipAutomation.updateServiceStatus(
      req.params.requestId,
      status,
      notes
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Service request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update service request'
    });
  }
});

// =====================================================
// Reporting Engine Routes
// =====================================================

/**
 * @route POST /api/v1/ai/reports/configure
 * @description Configure reporting for a client
 */
router.post('/reports/configure', (req: Request, res: Response) => {
  try {
    const validation = reportConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const config = reportingEngine.configureReporting(validation.data);
    res.status(201).json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure reporting'
    });
  }
});

/**
 * @route POST /api/v1/ai/reports/generate
 * @description Generate a VR compliance report
 */
router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const { clientId, periodStart, periodEnd, reportType } = req.body;
    
    if (!clientId || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, periodStart, periodEnd'
      });
    }

    const report = await reportingEngine.generateVRComplianceReport(
      clientId,
      periodStart,
      periodEnd,
      reportType || 'on_demand'
    );

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report'
    });
  }
});

/**
 * @route GET /api/v1/ai/reports/:reportId
 * @description Get a report by ID
 */
router.get('/reports/:reportId', (req: Request, res: Response) => {
  try {
    const report = reportingEngine.getReport(req.params.reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get report'
    });
  }
});

/**
 * @route GET /api/v1/ai/reports/client/:clientId
 * @description Get all reports for a client
 */
router.get('/reports/client/:clientId', (req: Request, res: Response) => {
  try {
    const reports = reportingEngine.getClientReports(req.params.clientId);
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get client reports'
    });
  }
});

/**
 * @route GET /api/v1/ai/reports/:reportId/export/:format
 * @description Export a report in a specific format
 */
router.get('/reports/:reportId/export/:format', async (req: Request, res: Response) => {
  try {
    const format = req.params.format as 'pdf' | 'html' | 'audio' | 'json';
    const validFormats = ['pdf', 'html', 'audio', 'json'];
    
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format',
        validFormats
      });
    }

    const exported = await reportingEngine.exportReport(req.params.reportId, format);

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(exported.content);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.send(exported.content);
    } else {
      res.json({
        success: true,
        data: exported
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export report'
    });
  }
});

/**
 * @route POST /api/v1/ai/reports/schedule
 * @description Schedule automatic report generation
 */
router.post('/reports/schedule', (req: Request, res: Response) => {
  try {
    const { clientId, interval } = req.body;
    const validIntervals = ['weekly', 'bi-weekly', 'monthly'];
    
    if (!clientId || !validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Required: clientId, interval (weekly, bi-weekly, or monthly)'
      });
    }

    reportingEngine.scheduleReports(clientId, interval);
    res.json({
      success: true,
      message: `${interval} reports scheduled for client ${clientId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule reports'
    });
  }
});

export default router;
