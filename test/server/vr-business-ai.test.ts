/**
 * VR Business AI Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VRBusinessAI, type DisabilityType } from '../../server/services/ai/vr-business-ai';

describe('VRBusinessAI', () => {
  let vrBusinessAI: VRBusinessAI;

  beforeEach(() => {
    vrBusinessAI = new VRBusinessAI();
  });

  describe('registerClient', () => {
    it('should register a client with visual impairment', () => {
      const client = vrBusinessAI.registerClient('client_1', 'visual_impairment', 'John Doe');
      
      expect(client.id).toBe('client_1');
      expect(client.disabilityType).toBe('visual_impairment');
      expect(client.name).toBe('John Doe');
      expect(client.goals).toEqual([]);
      expect(client.capabilities).toEqual([]);
    });

    it('should register a client with hearing impairment', () => {
      const client = vrBusinessAI.registerClient('client_2', 'hearing_impairment');
      
      expect(client.id).toBe('client_2');
      expect(client.disabilityType).toBe('hearing_impairment');
      expect(client.name).toBeUndefined();
    });

    it('should register clients with all disability types', () => {
      const disabilityTypes: DisabilityType[] = [
        'visual_impairment',
        'hearing_impairment',
        'mobility_impairment',
        'cognitive_disability'
      ];

      disabilityTypes.forEach((type, index) => {
        const client = vrBusinessAI.registerClient(`client_${index}`, type);
        expect(client.disabilityType).toBe(type);
      });
    });
  });

  describe('getClient', () => {
    it('should return registered client', () => {
      vrBusinessAI.registerClient('client_1', 'visual_impairment', 'Jane Doe');
      
      const client = vrBusinessAI.getClient('client_1');
      expect(client).toBeDefined();
      expect(client?.name).toBe('Jane Doe');
    });

    it('should return undefined for non-existent client', () => {
      const client = vrBusinessAI.getClient('non_existent');
      expect(client).toBeUndefined();
    });
  });

  describe('getInterviewQuestions', () => {
    it('should return audio-based questions for visual impairment', () => {
      const questions = vrBusinessAI.getInterviewQuestions('visual_impairment');
      
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].audioUrl).toBeDefined();
      expect(questions[0].id).toMatch(/^vq_/);
    });

    it('should return text-based questions for hearing impairment', () => {
      const questions = vrBusinessAI.getInterviewQuestions('hearing_impairment');
      
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].id).toMatch(/^hq_/);
      expect(questions[0].accessibilityNotes).toBeDefined();
    });

    it('should return adaptive interface questions for mobility impairment', () => {
      const questions = vrBusinessAI.getInterviewQuestions('mobility_impairment');
      
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].id).toMatch(/^mq_/);
    });

    it('should return simplified questions for cognitive disability', () => {
      const questions = vrBusinessAI.getInterviewQuestions('cognitive_disability');
      
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].id).toMatch(/^cq_/);
      expect(questions[0].accessibilityNotes).toContain('Simple');
    });
  });

  describe('startInterview', () => {
    it('should start an interview session for registered client', async () => {
      vrBusinessAI.registerClient('client_1', 'hearing_impairment');
      
      const session = await vrBusinessAI.startInterview('client_1');
      
      expect(session.id).toBeDefined();
      expect(session.clientId).toBe('client_1');
      expect(session.disabilityType).toBe('hearing_impairment');
      expect(session.status).toBe('in_progress');
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.questions.length).toBeGreaterThan(0);
      expect(session.responses).toEqual([]);
    });

    it('should throw error for non-registered client', async () => {
      await expect(vrBusinessAI.startInterview('non_existent'))
        .rejects.toThrow('not found');
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return current question in session', async () => {
      vrBusinessAI.registerClient('client_1', 'visual_impairment');
      const session = await vrBusinessAI.startInterview('client_1');
      
      const question = vrBusinessAI.getCurrentQuestion(session.id);
      
      expect(question).toBeDefined();
      expect(question?.id).toBe(session.questions[0].id);
    });

    it('should return null for non-existent session', () => {
      const question = vrBusinessAI.getCurrentQuestion('non_existent');
      expect(question).toBeNull();
    });
  });

  describe('submitAnswer', () => {
    it('should submit an answer and move to next question', async () => {
      vrBusinessAI.registerClient('client_1', 'cognitive_disability');
      const session = await vrBusinessAI.startInterview('client_1');
      
      const result = await vrBusinessAI.submitAnswer(session.id, 'My answer');
      
      expect(result.success).toBe(true);
      expect(result.completed).toBe(false);
      expect(result.nextQuestion).toBeDefined();
      
      const updatedSession = vrBusinessAI.getInterviewSession(session.id);
      expect(updatedSession?.currentQuestionIndex).toBe(1);
      expect(updatedSession?.responses.length).toBe(1);
    });

    it('should complete interview when all questions answered', async () => {
      vrBusinessAI.registerClient('client_1', 'mobility_impairment');
      const session = await vrBusinessAI.startInterview('client_1');
      
      // Answer all questions
      for (let i = 0; i < session.questions.length; i++) {
        const result = await vrBusinessAI.submitAnswer(session.id, 'Answer ' + i);
        if (i === session.questions.length - 1) {
          expect(result.completed).toBe(true);
          expect(result.nextQuestion).toBeNull();
        }
      }
      
      const updatedSession = vrBusinessAI.getInterviewSession(session.id);
      expect(updatedSession?.status).toBe('completed');
    });

    it('should throw error for non-existent session', async () => {
      await expect(vrBusinessAI.submitAnswer('non_existent', 'answer'))
        .rejects.toThrow('not found');
    });
  });

  describe('generateBusinessPlan', () => {
    it('should generate a business plan from completed interview', async () => {
      vrBusinessAI.registerClient('client_1', 'hearing_impairment');
      const session = await vrBusinessAI.startInterview('client_1');
      
      // Complete the interview
      for (let i = 0; i < session.questions.length; i++) {
        await vrBusinessAI.submitAnswer(session.id, 'Test answer ' + i);
      }
      
      const businessPlan = await vrBusinessAI.generateBusinessPlan(session.id);
      
      expect(businessPlan.id).toBeDefined();
      expect(businessPlan.clientId).toBe('client_1');
      expect(businessPlan.summary).toBeDefined();
      expect(businessPlan.sections.length).toBeGreaterThan(0);
      expect(businessPlan.accessibilityConsiderations.length).toBeGreaterThan(0);
      expect(businessPlan.supportResources.length).toBeGreaterThan(0);
    });

    it('should throw error for incomplete interview', async () => {
      vrBusinessAI.registerClient('client_1', 'visual_impairment');
      const session = await vrBusinessAI.startInterview('client_1');
      
      await expect(vrBusinessAI.generateBusinessPlan(session.id))
        .rejects.toThrow('must be completed');
    });

    it('should throw error for non-existent session', async () => {
      await expect(vrBusinessAI.generateBusinessPlan('non_existent'))
        .rejects.toThrow('not found');
    });
  });

  describe('getBusinessPlan', () => {
    it('should retrieve a generated business plan', async () => {
      vrBusinessAI.registerClient('client_1', 'cognitive_disability');
      const session = await vrBusinessAI.startInterview('client_1');
      
      for (let i = 0; i < session.questions.length; i++) {
        await vrBusinessAI.submitAnswer(session.id, 'Answer ' + i);
      }
      
      const generatedPlan = await vrBusinessAI.generateBusinessPlan(session.id);
      const retrievedPlan = vrBusinessAI.getBusinessPlan(generatedPlan.id);
      
      expect(retrievedPlan).toEqual(generatedPlan);
    });

    it('should return undefined for non-existent plan', () => {
      const plan = vrBusinessAI.getBusinessPlan('non_existent');
      expect(plan).toBeUndefined();
    });
  });

  describe('getClientBusinessPlans', () => {
    it('should return all business plans for a client', async () => {
      vrBusinessAI.registerClient('client_1', 'mobility_impairment');
      
      // Create first business plan
      const session1 = await vrBusinessAI.startInterview('client_1');
      for (let i = 0; i < session1.questions.length; i++) {
        await vrBusinessAI.submitAnswer(session1.id, 'Answer ' + i);
      }
      await vrBusinessAI.generateBusinessPlan(session1.id);
      
      const plans = vrBusinessAI.getClientBusinessPlans('client_1');
      
      expect(plans.length).toBe(1);
      expect(plans[0].clientId).toBe('client_1');
    });

    it('should return empty array for client with no plans', () => {
      const plans = vrBusinessAI.getClientBusinessPlans('non_existent');
      expect(plans).toEqual([]);
    });
  });
});
