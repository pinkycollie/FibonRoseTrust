/**
 * VR Business AI Service
 * AI-driven interview process and business plan generation for VR clients
 * Supports disability-specific accommodations and accessibility features
 */

import { generateTimestampedId } from './utils';

export type DisabilityType = 'visual_impairment' | 'hearing_impairment' | 'mobility_impairment' | 'cognitive_disability';

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[];
  audioUrl?: string;
  accessibilityNotes?: string;
  requiredAdaptations?: string[];
}

export interface ClientData {
  id: string;
  disabilityType: DisabilityType;
  name?: string;
  goals?: string[];
  capabilities?: string[];
  preferences?: Record<string, unknown>;
}

export interface InterviewResponse {
  questionId: string;
  answer: string | string[] | number | boolean;
  timestamp: string;
  adaptationsUsed?: string[];
}

export interface BusinessPlanSection {
  title: string;
  content: string;
  recommendations: string[];
  timeline?: string;
  resources?: string[];
}

export interface BusinessPlan {
  id: string;
  clientId: string;
  createdAt: string;
  summary: string;
  sections: BusinessPlanSection[];
  accessibilityConsiderations: string[];
  estimatedTimeline: string;
  supportResources: string[];
}

export interface InterviewSession {
  id: string;
  clientId: string;
  disabilityType: DisabilityType;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  startedAt?: string;
  completedAt?: string;
}

export class VRBusinessAI {
  private clientData: Map<string, ClientData>;
  private interviewSessions: Map<string, InterviewSession>;
  private businessPlans: Map<string, BusinessPlan>;

  constructor() {
    this.clientData = new Map();
    this.interviewSessions = new Map();
    this.businessPlans = new Map();
  }

  /**
   * Initialize a new client with their disability type
   */
  registerClient(clientId: string, disabilityType: DisabilityType, name?: string): ClientData {
    const client: ClientData = {
      id: clientId,
      disabilityType,
      name,
      goals: [],
      capabilities: [],
      preferences: {}
    };
    this.clientData.set(clientId, client);
    return client;
  }

  /**
   * Get client data
   */
  getClient(clientId: string): ClientData | undefined {
    return this.clientData.get(clientId);
  }

  /**
   * Get interview questions customized by disability type
   */
  private getAudioBasedQuestions(): InterviewQuestion[] {
    return [
      {
        id: 'vq_1',
        text: 'What type of business are you interested in starting?',
        type: 'text',
        audioUrl: '/audio/questions/business_type.mp3',
        accessibilityNotes: 'Audio question with voice response capability',
        requiredAdaptations: ['screen_reader', 'voice_input']
      },
      {
        id: 'vq_2',
        text: 'What are your primary skills and experiences?',
        type: 'text',
        audioUrl: '/audio/questions/skills.mp3',
        accessibilityNotes: 'Audio question with voice response capability'
      },
      {
        id: 'vq_3',
        text: 'How many hours per week can you dedicate to your business?',
        type: 'multiple_choice',
        options: ['1-10 hours', '11-20 hours', '21-30 hours', '31-40 hours', 'Full time (40+ hours)'],
        audioUrl: '/audio/questions/hours.mp3'
      },
      {
        id: 'vq_4',
        text: 'Rate your comfort level with technology on a scale of 1-5',
        type: 'rating',
        audioUrl: '/audio/questions/tech_comfort.mp3'
      },
      {
        id: 'vq_5',
        text: 'Do you have prior business experience?',
        type: 'yes_no',
        audioUrl: '/audio/questions/prior_experience.mp3'
      }
    ];
  }

  private getTextBasedQuestions(): InterviewQuestion[] {
    return [
      {
        id: 'hq_1',
        text: 'What type of business are you interested in starting?',
        type: 'text',
        accessibilityNotes: 'Large text display with extended response time',
        requiredAdaptations: ['large_text', 'visual_cues']
      },
      {
        id: 'hq_2',
        text: 'Describe your primary skills and work experiences.',
        type: 'text',
        accessibilityNotes: 'Text-based input with visual confirmation'
      },
      {
        id: 'hq_3',
        text: 'Weekly hours available for business activities?',
        type: 'multiple_choice',
        options: ['1-10 hours', '11-20 hours', '21-30 hours', '31-40 hours', '40+ hours'],
        accessibilityNotes: 'Visual selection with confirmation'
      },
      {
        id: 'hq_4',
        text: 'Technology comfort level (1 = Low, 5 = High)',
        type: 'rating',
        accessibilityNotes: 'Visual rating scale'
      },
      {
        id: 'hq_5',
        text: 'Do you have prior business experience?',
        type: 'yes_no',
        accessibilityNotes: 'Clear yes/no buttons'
      }
    ];
  }

  private getAdaptiveInterfaceQuestions(): InterviewQuestion[] {
    return [
      {
        id: 'mq_1',
        text: 'What type of business interests you?',
        type: 'multiple_choice',
        options: ['Online/Remote', 'Service-based', 'Product-based', 'Consulting', 'Other'],
        accessibilityNotes: 'Large clickable areas, keyboard navigation support',
        requiredAdaptations: ['large_targets', 'keyboard_nav', 'switch_access']
      },
      {
        id: 'mq_2',
        text: 'Select your primary skill areas (multiple selections allowed)',
        type: 'multiple_choice',
        options: ['Writing/Content', 'Design/Creative', 'Technical/IT', 'Customer Service', 'Management', 'Sales/Marketing'],
        accessibilityNotes: 'Multi-select with clear visual feedback'
      },
      {
        id: 'mq_3',
        text: 'Available weekly hours?',
        type: 'multiple_choice',
        options: ['Part-time (under 20)', 'Half-time (20-30)', 'Full-time (30+)'],
        accessibilityNotes: 'Simplified options with large selection areas'
      },
      {
        id: 'mq_4',
        text: 'How comfortable are you with technology?',
        type: 'rating',
        accessibilityNotes: 'Large rating buttons'
      },
      {
        id: 'mq_5',
        text: 'Have you run a business before?',
        type: 'yes_no',
        accessibilityNotes: 'Large yes/no buttons'
      }
    ];
  }

  private getSimplifiedSequentialQuestions(): InterviewQuestion[] {
    return [
      {
        id: 'cq_1',
        text: 'What would you like to do for work?',
        type: 'text',
        accessibilityNotes: 'Simple language, one question at a time',
        requiredAdaptations: ['simple_language', 'step_by_step', 'progress_indicator']
      },
      {
        id: 'cq_2',
        text: 'What are you good at?',
        type: 'text',
        accessibilityNotes: 'Simple phrasing with examples provided'
      },
      {
        id: 'cq_3',
        text: 'How much time can you work each week?',
        type: 'multiple_choice',
        options: ['A little (1-10 hours)', 'Some (11-20 hours)', 'A lot (20+ hours)'],
        accessibilityNotes: 'Three simple options'
      },
      {
        id: 'cq_4',
        text: 'Do you like using computers and phones?',
        type: 'yes_no',
        accessibilityNotes: 'Simple yes/no with icons'
      },
      {
        id: 'cq_5',
        text: 'Have you had a job before?',
        type: 'yes_no',
        accessibilityNotes: 'Simple yes/no with icons'
      }
    ];
  }

  /**
   * Get interview questions based on disability type
   */
  getInterviewQuestions(disabilityType: DisabilityType): InterviewQuestion[] {
    const questionsByType: Record<DisabilityType, InterviewQuestion[]> = {
      'visual_impairment': this.getAudioBasedQuestions(),
      'hearing_impairment': this.getTextBasedQuestions(),
      'mobility_impairment': this.getAdaptiveInterfaceQuestions(),
      'cognitive_disability': this.getSimplifiedSequentialQuestions()
    };

    return questionsByType[disabilityType] || this.getTextBasedQuestions();
  }

  /**
   * Start an interview session for a client
   */
  async startInterview(clientId: string): Promise<InterviewSession> {
    const client = this.clientData.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found. Please register the client first.`);
    }

    const questions = this.getInterviewQuestions(client.disabilityType);
    const sessionId = generateTimestampedId('interview');

    const session: InterviewSession = {
      id: sessionId,
      clientId,
      disabilityType: client.disabilityType,
      status: 'in_progress',
      currentQuestionIndex: 0,
      questions,
      responses: [],
      startedAt: new Date().toISOString()
    };

    this.interviewSessions.set(sessionId, session);
    return session;
  }

  /**
   * Get the current question in an interview session
   */
  getCurrentQuestion(sessionId: string): InterviewQuestion | null {
    const session = this.interviewSessions.get(sessionId);
    if (!session || session.status !== 'in_progress') {
      return null;
    }

    if (session.currentQuestionIndex >= session.questions.length) {
      return null;
    }

    return session.questions[session.currentQuestionIndex];
  }

  /**
   * Submit an answer to the current interview question
   */
  async submitAnswer(
    sessionId: string,
    answer: string | string[] | number | boolean,
    adaptationsUsed?: string[]
  ): Promise<{ success: boolean; nextQuestion: InterviewQuestion | null; completed: boolean }> {
    const session = this.interviewSessions.get(sessionId);
    if (!session || session.status !== 'in_progress') {
      throw new Error('Interview session not found or not in progress');
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question available');
    }

    // Record the response
    const response: InterviewResponse = {
      questionId: currentQuestion.id,
      answer,
      timestamp: new Date().toISOString(),
      adaptationsUsed
    };
    session.responses.push(response);

    // Move to next question
    session.currentQuestionIndex++;

    // Check if interview is complete
    const completed = session.currentQuestionIndex >= session.questions.length;
    if (completed) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
    }

    const nextQuestion = completed ? null : session.questions[session.currentQuestionIndex];

    return { success: true, nextQuestion, completed };
  }

  /**
   * Get interview session
   */
  getInterviewSession(sessionId: string): InterviewSession | undefined {
    return this.interviewSessions.get(sessionId);
  }

  /**
   * Generate a business plan based on client responses
   */
  async generateBusinessPlan(sessionId: string): Promise<BusinessPlan> {
    const session = this.interviewSessions.get(sessionId);
    if (!session) {
      throw new Error('Interview session not found');
    }

    if (session.status !== 'completed') {
      throw new Error('Interview must be completed before generating a business plan');
    }

    // In production, this would call OpenAI or another AI service
    // For now, we generate a template-based plan
    const businessPlanId = generateTimestampedId('bp');
    
    const businessPlan: BusinessPlan = {
      id: businessPlanId,
      clientId: session.clientId,
      createdAt: new Date().toISOString(),
      summary: this.generatePlanSummary(session),
      sections: this.generatePlanSections(session),
      accessibilityConsiderations: this.getAccessibilityConsiderations(session.disabilityType),
      estimatedTimeline: '6-12 months',
      supportResources: this.getSupportResources(session.disabilityType)
    };

    this.businessPlans.set(businessPlanId, businessPlan);
    
    // Update client data with business plan reference
    const client = this.clientData.get(session.clientId);
    if (client) {
      client.preferences = {
        ...client.preferences,
        businessPlanId
      };
    }

    return businessPlan;
  }

  private generatePlanSummary(session: InterviewSession): string {
    const businessTypeResponse = session.responses.find(r => r.questionId.endsWith('_1'));
    const businessType = businessTypeResponse?.answer?.toString() || 'service-based business';

    return `This customized business plan outlines a path to establishing a successful ${businessType} that accommodates your specific needs and leverages your unique strengths. The plan is designed with accessibility features and support resources tailored to individuals with ${session.disabilityType.replace('_', ' ')}.`;
  }

  private generatePlanSections(_session: InterviewSession): BusinessPlanSection[] {
    return [
      {
        title: 'Executive Summary',
        content: 'Overview of your business concept and goals aligned with VR program objectives.',
        recommendations: [
          'Define clear, measurable business objectives',
          'Identify your target market and unique value proposition',
          'Establish realistic financial projections'
        ],
        timeline: 'Week 1-2'
      },
      {
        title: 'Business Model Development',
        content: 'Detailed framework for how your business will operate and generate revenue.',
        recommendations: [
          'Choose an accessible business model that fits your capabilities',
          'Consider remote/online options for flexibility',
          'Plan for adaptive tools and technologies'
        ],
        timeline: 'Week 3-4',
        resources: ['VR Business Development Workshop', 'Assistive Technology Assessment']
      },
      {
        title: 'Market Analysis',
        content: 'Understanding your target customers and competitive landscape.',
        recommendations: [
          'Research local and online market opportunities',
          'Identify underserved markets where your perspective adds value',
          'Analyze competitors and differentiation strategies'
        ],
        timeline: 'Week 5-6'
      },
      {
        title: 'Operations Plan',
        content: 'Day-to-day operations with accessibility accommodations built in.',
        recommendations: [
          'Design accessible workspace and workflows',
          'Implement assistive technologies as needed',
          'Create flexible scheduling that accommodates health needs'
        ],
        timeline: 'Week 7-8',
        resources: ['Workplace Accommodations Guide', 'Assistive Technology Funding']
      },
      {
        title: 'Financial Plan',
        content: 'Startup costs, funding sources, and financial projections.',
        recommendations: [
          'Identify VR-approved funding and grants',
          'Create realistic revenue projections',
          'Plan for accessibility-related expenses'
        ],
        timeline: 'Week 9-10',
        resources: ['VR Self-Employment Financial Assistance', 'Small Business Grants for Disabled Entrepreneurs']
      },
      {
        title: 'Implementation Timeline',
        content: 'Step-by-step action plan with milestones and checkpoints.',
        recommendations: [
          'Set weekly goals with VR counselor check-ins',
          'Build in flexibility for health-related adjustments',
          'Celebrate milestones and adjust as needed'
        ],
        timeline: 'Ongoing'
      }
    ];
  }

  private getAccessibilityConsiderations(disabilityType: DisabilityType): string[] {
    const considerations: Record<DisabilityType, string[]> = {
      'visual_impairment': [
        'Screen reader compatible business tools and websites',
        'Audio-based customer service options',
        'Voice-controlled business software',
        'Accessible financial tracking systems',
        'Braille and large-print marketing materials'
      ],
      'hearing_impairment': [
        'Video relay service for customer communication',
        'Real-time captioning for virtual meetings',
        'Text-based customer service channels',
        'Visual notification systems',
        'ASL interpreter access for important meetings'
      ],
      'mobility_impairment': [
        'Voice-controlled and adaptive technology setup',
        'Ergonomic workspace design',
        'Remote/home-based business operations',
        'Accessible transportation alternatives',
        'Energy-conserving workflow design'
      ],
      'cognitive_disability': [
        'Simplified business processes and checklists',
        'Visual workflow guides and reminders',
        'Structured daily routines',
        'Task management apps with notifications',
        'Regular support check-ins and coaching'
      ]
    };

    return considerations[disabilityType] || [];
  }

  private getSupportResources(disabilityType: DisabilityType): string[] {
    const baseResources = [
      'VR Counselor Support',
      'Small Business Development Center (SBDC)',
      'SCORE Mentoring',
      'Disability Business Technical Assistance Center'
    ];

    const specificResources: Record<DisabilityType, string[]> = {
      'visual_impairment': [
        'National Federation of the Blind Entrepreneurship Program',
        'American Foundation for the Blind Technology Resources'
      ],
      'hearing_impairment': [
        'National Association of the Deaf Business Network',
        'Deaf Business Owner Association'
      ],
      'mobility_impairment': [
        'Disability:IN Business Network',
        'National Disability Rights Network'
      ],
      'cognitive_disability': [
        'The Arc Self-Employment Resources',
        'Autism Speaks Employment Toolkit'
      ]
    };

    return [...baseResources, ...(specificResources[disabilityType] || [])];
  }

  /**
   * Get business plan by ID
   */
  getBusinessPlan(planId: string): BusinessPlan | undefined {
    return this.businessPlans.get(planId);
  }

  /**
   * Get all business plans for a client
   */
  getClientBusinessPlans(clientId: string): BusinessPlan[] {
    return Array.from(this.businessPlans.values())
      .filter(plan => plan.clientId === clientId);
  }
}

export const vrBusinessAI = new VRBusinessAI();
