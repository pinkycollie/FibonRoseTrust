/**
 * Task Automation Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskAutomation, type ClientProfile } from '../../server/services/ai/task-automation';

describe('TaskAutomation', () => {
  let taskAutomation: TaskAutomation;

  beforeEach(() => {
    taskAutomation = new TaskAutomation();
  });

  describe('registerClientProfile', () => {
    it('should register a client profile', () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'John Doe',
        disabilityType: 'visual_impairment',
        businessType: 'consulting',
        preferredCommunication: 'email',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: true,
          progressTracking: true,
          reportGeneration: true
        }
      };

      const result = taskAutomation.registerClientProfile(profile);

      expect(result.id).toBe('client_1');
      expect(result.name).toBe('John Doe');
      expect(result.automationPreferences.documentProcessing).toBe(true);
    });
  });

  describe('getClientProfile', () => {
    it('should return registered profile', () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Jane Doe',
        disabilityType: 'hearing_impairment',
        preferredCommunication: 'video',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: false,
          progressTracking: true,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      const result = taskAutomation.getClientProfile('client_1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Jane Doe');
    });

    it('should return undefined for non-existent profile', () => {
      const result = taskAutomation.getClientProfile('non_existent');
      expect(result).toBeUndefined();
    });
  });

  describe('createWorkflowAutomations', () => {
    it('should create workflows based on preferences', async () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Test User',
        disabilityType: 'mobility_impairment',
        preferredCommunication: 'text',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: true,
          progressTracking: true,
          reportGeneration: true
        }
      };

      taskAutomation.registerClientProfile(profile);
      const workflows = await taskAutomation.createWorkflowAutomations(profile);

      expect(workflows.size).toBe(4);
      expect(workflows.has('document_processing')).toBe(true);
      expect(workflows.has('communication')).toBe(true);
      expect(workflows.has('progress_tracking')).toBe(true);
      expect(workflows.has('reporting')).toBe(true);
    });

    it('should only create selected workflows', async () => {
      const profile: ClientProfile = {
        id: 'client_2',
        name: 'Test User 2',
        disabilityType: 'cognitive_disability',
        preferredCommunication: 'phone',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: false,
          progressTracking: true,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      const workflows = await taskAutomation.createWorkflowAutomations(profile);

      expect(workflows.size).toBe(2);
      expect(workflows.has('document_processing')).toBe(true);
      expect(workflows.has('communication')).toBe(false);
      expect(workflows.has('progress_tracking')).toBe(true);
      expect(workflows.has('reporting')).toBe(false);
    });
  });

  describe('setupDocumentAutomation', () => {
    it('should create a document processing workflow', async () => {
      const workflow = await (taskAutomation as any).setupDocumentAutomation('client_1');

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Document Processing Automation');
      expect(workflow.category).toBe('document_processing');
      expect(workflow.isActive).toBe(true);
      expect(workflow.trigger).toBeDefined();
      expect(workflow.steps.length).toBe(4);
    });
  });

  describe('getWorkflow', () => {
    it('should return a workflow by ID', async () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Test',
        disabilityType: 'visual_impairment',
        preferredCommunication: 'email',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: false,
          progressTracking: false,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      const workflows = await taskAutomation.createWorkflowAutomations(profile);
      const docWorkflow = workflows.get('document_processing');

      const result = taskAutomation.getWorkflow(docWorkflow!.id);
      expect(result).toEqual(docWorkflow);
    });

    it('should return undefined for non-existent workflow', () => {
      const result = taskAutomation.getWorkflow('non_existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getClientWorkflows', () => {
    it('should return all workflows for a client', async () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Test',
        disabilityType: 'hearing_impairment',
        preferredCommunication: 'video',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: true,
          progressTracking: false,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      await taskAutomation.createWorkflowAutomations(profile);

      const workflows = taskAutomation.getClientWorkflows('client_1');
      expect(workflows.length).toBe(2);
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow and return execution result', async () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Test',
        disabilityType: 'mobility_impairment',
        preferredCommunication: 'text',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: false,
          progressTracking: false,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      const workflows = await taskAutomation.createWorkflowAutomations(profile);
      const docWorkflow = workflows.get('document_processing')!;

      const execution = await taskAutomation.executeWorkflow(docWorkflow.id);

      expect(execution.id).toBeDefined();
      expect(execution.workflowId).toBe(docWorkflow.id);
      expect(execution.status).toBe('completed');
      expect(execution.stepResults.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent workflow', async () => {
      await expect(taskAutomation.executeWorkflow('non_existent'))
        .rejects.toThrow('not found');
    });
  });

  describe('pauseWorkflow', () => {
    it('should pause an active workflow', async () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Test',
        disabilityType: 'cognitive_disability',
        preferredCommunication: 'phone',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: false,
          progressTracking: false,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      const workflows = await taskAutomation.createWorkflowAutomations(profile);
      const docWorkflow = workflows.get('document_processing')!;

      const result = taskAutomation.pauseWorkflow(docWorkflow.id);
      expect(result).toBe(true);

      const workflow = taskAutomation.getWorkflow(docWorkflow.id);
      expect(workflow?.isActive).toBe(false);
    });

    it('should return false for non-existent workflow', () => {
      const result = taskAutomation.pauseWorkflow('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('resumeWorkflow', () => {
    it('should resume a paused workflow', async () => {
      const profile: ClientProfile = {
        id: 'client_1',
        name: 'Test',
        disabilityType: 'visual_impairment',
        preferredCommunication: 'email',
        automationPreferences: {
          documentProcessing: true,
          communicationAutomation: false,
          progressTracking: false,
          reportGeneration: false
        }
      };

      taskAutomation.registerClientProfile(profile);
      const workflows = await taskAutomation.createWorkflowAutomations(profile);
      const docWorkflow = workflows.get('document_processing')!;

      taskAutomation.pauseWorkflow(docWorkflow.id);
      const result = taskAutomation.resumeWorkflow(docWorkflow.id);
      
      expect(result).toBe(true);

      const workflow = taskAutomation.getWorkflow(docWorkflow.id);
      expect(workflow?.isActive).toBe(true);
    });

    it('should return false for non-existent workflow', () => {
      const result = taskAutomation.resumeWorkflow('non_existent');
      expect(result).toBe(false);
    });
  });
});
