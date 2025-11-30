/**
 * Task Automation Service
 * Workflow automation for VR clients using Make.com and Zapier-like integrations
 */

import { generateTimestampedId } from './utils';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition';
  configuration: Record<string, unknown>;
  nextStepId?: string;
  alternateStepId?: string; // For condition branches
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'document_processing' | 'communication' | 'progress_tracking' | 'reporting';
  trigger: WorkflowStep;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  stepResults: Array<{
    stepId: string;
    status: 'success' | 'failed' | 'skipped';
    output?: unknown;
    error?: string;
  }>;
}

export interface ClientProfile {
  id: string;
  name: string;
  disabilityType: string;
  businessType?: string;
  preferredCommunication: 'email' | 'text' | 'video' | 'phone';
  automationPreferences: {
    documentProcessing: boolean;
    communicationAutomation: boolean;
    progressTracking: boolean;
    reportGeneration: boolean;
  };
}

export interface AutomationScenario {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  configuration?: Record<string, unknown>;
}

export class TaskAutomation {
  private workflows: Map<string, Workflow>;
  private executions: Map<string, WorkflowExecution>;
  private clientProfiles: Map<string, ClientProfile>;

  constructor() {
    this.workflows = new Map();
    this.executions = new Map();
    this.clientProfiles = new Map();
  }

  /**
   * Register a client profile for automation
   */
  registerClientProfile(profile: ClientProfile): ClientProfile {
    this.clientProfiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Get client profile
   */
  getClientProfile(clientId: string): ClientProfile | undefined {
    return this.clientProfiles.get(clientId);
  }

  /**
   * Create workflow automations based on client needs
   */
  async createWorkflowAutomations(clientProfile: ClientProfile): Promise<Map<string, Workflow>> {
    const workflows = new Map<string, Workflow>();
    const preferences = clientProfile.automationPreferences;

    if (preferences.documentProcessing) {
      const docWorkflow = await this.setupDocumentAutomation(clientProfile.id);
      workflows.set('document_processing', docWorkflow);
    }

    if (preferences.communicationAutomation) {
      const commWorkflow = await this.setupCommunicationFlows(clientProfile);
      workflows.set('communication', commWorkflow);
    }

    if (preferences.progressTracking) {
      const trackingWorkflow = await this.setupTrackingAutomation(clientProfile.id);
      workflows.set('progress_tracking', trackingWorkflow);
    }

    if (preferences.reportGeneration) {
      const reportWorkflow = await this.setupReportGeneration(clientProfile.id);
      workflows.set('reporting', reportWorkflow);
    }

    return workflows;
  }

  /**
   * Setup document automation workflow
   */
  async setupDocumentAutomation(clientId: string): Promise<Workflow> {
    const workflowId = generateTimestampedId('doc_workflow');

    const workflow: Workflow = {
      id: workflowId,
      name: 'Document Processing Automation',
      description: 'Automatically processes uploaded documents, extracts text, and routes to appropriate folders',
      category: 'document_processing',
      isActive: true,
      createdAt: new Date().toISOString(),
      trigger: {
        id: 'trigger_1',
        name: 'New Document Upload',
        type: 'trigger',
        configuration: {
          event: 'new_document_upload',
          clientId,
          supportedFormats: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png']
        },
        nextStepId: 'step_1'
      },
      steps: [
        {
          id: 'step_1',
          name: 'Convert to Text',
          type: 'action',
          configuration: {
            action: 'convert_to_text',
            ocrEnabled: true,
            language: 'en'
          },
          nextStepId: 'step_2'
        },
        {
          id: 'step_2',
          name: 'Analyze Content',
          type: 'action',
          configuration: {
            action: 'analyze_content',
            extractEntities: true,
            classifyDocument: true,
            categories: ['business', 'financial', 'legal', 'personal', 'medical']
          },
          nextStepId: 'step_3'
        },
        {
          id: 'step_3',
          name: 'Route to Folder',
          type: 'action',
          configuration: {
            action: 'route_to_appropriate_folder',
            basePath: `/clients/${clientId}/documents`,
            createFolderIfNotExists: true
          },
          nextStepId: 'step_4'
        },
        {
          id: 'step_4',
          name: 'Update Database',
          type: 'action',
          configuration: {
            action: 'update_notion_database',
            databaseId: 'documents_db',
            properties: ['title', 'category', 'uploadDate', 'filePath', 'extractedText']
          }
        }
      ]
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Setup form filling automation
   */
  async setupFormFillingAutomation(clientId: string): Promise<AutomationScenario> {
    return {
      id: generateTimestampedId('form'),
      name: 'Automated Form Filling',
      trigger: 'document_requires_completion',
      actions: [
        'extract_client_data',
        'populate_form_fields',
        'route_for_signature'
      ],
      configuration: {
        clientId,
        dataSource: 'client_profile',
        signatureMethod: 'digital'
      }
    };
  }

  /**
   * Setup communication automation flows
   */
  async setupCommunicationFlows(clientProfile: ClientProfile): Promise<Workflow> {
    const workflowId = generateTimestampedId('comm_workflow');

    const communicationChannel = this.getCommunicationChannel(clientProfile.preferredCommunication);

    const workflow: Workflow = {
      id: workflowId,
      name: 'Communication Automation',
      description: 'Manages automated communications based on client preferences and accessibility needs',
      category: 'communication',
      isActive: true,
      createdAt: new Date().toISOString(),
      trigger: {
        id: 'trigger_1',
        name: 'Communication Event',
        type: 'trigger',
        configuration: {
          events: ['milestone_reached', 'document_ready', 'action_required', 'reminder_due'],
          clientId: clientProfile.id
        },
        nextStepId: 'step_1'
      },
      steps: [
        {
          id: 'step_1',
          name: 'Determine Communication Type',
          type: 'condition',
          configuration: {
            condition: 'event_type',
            branches: {
              milestone_reached: 'step_2a',
              document_ready: 'step_2b',
              action_required: 'step_2c',
              reminder_due: 'step_2d'
            }
          }
        },
        {
          id: 'step_2a',
          name: 'Send Milestone Notification',
          type: 'action',
          configuration: {
            action: 'send_notification',
            channel: communicationChannel,
            template: 'milestone_achieved',
            includeProgress: true
          }
        },
        {
          id: 'step_2b',
          name: 'Send Document Ready Notification',
          type: 'action',
          configuration: {
            action: 'send_notification',
            channel: communicationChannel,
            template: 'document_ready',
            includeLink: true
          }
        },
        {
          id: 'step_2c',
          name: 'Send Action Required Alert',
          type: 'action',
          configuration: {
            action: 'send_notification',
            channel: communicationChannel,
            template: 'action_required',
            priority: 'high',
            includeDeadline: true
          }
        },
        {
          id: 'step_2d',
          name: 'Send Reminder',
          type: 'action',
          configuration: {
            action: 'send_notification',
            channel: communicationChannel,
            template: 'reminder',
            includeContext: true
          }
        }
      ]
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Get appropriate communication channel based on preference
   */
  private getCommunicationChannel(preference: string): Record<string, unknown> {
    const channels: Record<string, Record<string, unknown>> = {
      email: {
        type: 'email',
        format: 'html',
        accessibilityFeatures: ['alt_text', 'semantic_html']
      },
      text: {
        type: 'sms',
        format: 'plain',
        characterLimit: 160
      },
      video: {
        type: 'video_message',
        format: 'mp4',
        includeCaptions: true,
        includeASL: true
      },
      phone: {
        type: 'voice_call',
        ttsEnabled: true,
        transcriptionEnabled: true
      }
    };

    return channels[preference] || channels.email;
  }

  /**
   * Setup progress tracking automation
   */
  async setupTrackingAutomation(clientId: string): Promise<Workflow> {
    const workflowId = generateTimestampedId('track_workflow');

    const workflow: Workflow = {
      id: workflowId,
      name: 'Progress Tracking Automation',
      description: 'Automatically tracks client progress and updates dashboards',
      category: 'progress_tracking',
      isActive: true,
      createdAt: new Date().toISOString(),
      trigger: {
        id: 'trigger_1',
        name: 'Progress Event',
        type: 'trigger',
        configuration: {
          events: ['task_completed', 'milestone_reached', 'goal_updated', 'daily_check_in'],
          clientId,
          schedule: {
            dailySummary: '18:00',
            weeklySummary: 'friday_17:00'
          }
        },
        nextStepId: 'step_1'
      },
      steps: [
        {
          id: 'step_1',
          name: 'Capture Progress Data',
          type: 'action',
          configuration: {
            action: 'capture_progress',
            metrics: ['tasks_completed', 'time_spent', 'milestones_achieved', 'goals_progress']
          },
          nextStepId: 'step_2'
        },
        {
          id: 'step_2',
          name: 'Calculate Progress Score',
          type: 'action',
          configuration: {
            action: 'calculate_score',
            algorithm: 'weighted_average',
            weights: {
              tasks_completed: 0.3,
              time_spent: 0.2,
              milestones_achieved: 0.3,
              goals_progress: 0.2
            }
          },
          nextStepId: 'step_3'
        },
        {
          id: 'step_3',
          name: 'Update Dashboard',
          type: 'action',
          configuration: {
            action: 'update_dashboard',
            dashboardType: 'client_progress',
            visualizations: ['progress_chart', 'milestone_timeline', 'goal_tracker']
          },
          nextStepId: 'step_4'
        },
        {
          id: 'step_4',
          name: 'Store Progress Record',
          type: 'action',
          configuration: {
            action: 'store_record',
            database: 'progress_history',
            retention: '2_years'
          }
        }
      ]
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Setup report generation automation
   */
  async setupReportGeneration(clientId: string): Promise<Workflow> {
    const workflowId = generateTimestampedId('report_workflow');

    const workflow: Workflow = {
      id: workflowId,
      name: 'Report Generation Automation',
      description: 'Generates VR compliance reports and progress summaries',
      category: 'reporting',
      isActive: true,
      createdAt: new Date().toISOString(),
      trigger: {
        id: 'trigger_1',
        name: 'Report Schedule',
        type: 'trigger',
        configuration: {
          schedule: {
            weekly: 'friday_16:00',
            monthly: 'last_day_16:00',
            quarterly: 'last_day_of_quarter_16:00'
          },
          clientId,
          onDemand: true
        },
        nextStepId: 'step_1'
      },
      steps: [
        {
          id: 'step_1',
          name: 'Gather Report Data',
          type: 'action',
          configuration: {
            action: 'gather_data',
            sources: ['progress_tracking', 'documents', 'communications', 'milestones'],
            dateRange: 'report_period'
          },
          nextStepId: 'step_2'
        },
        {
          id: 'step_2',
          name: 'Generate Report Content',
          type: 'action',
          configuration: {
            action: 'generate_content',
            sections: [
              'executive_summary',
              'progress_metrics',
              'milestones_achieved',
              'activities_completed',
              'upcoming_goals',
              'recommendations'
            ],
            format: 'accessible_pdf'
          },
          nextStepId: 'step_3'
        },
        {
          id: 'step_3',
          name: 'Apply VR Compliance Format',
          type: 'action',
          configuration: {
            action: 'format_compliance',
            template: 'vr_progress_report',
            includeSignature: true,
            accessibilityCompliant: true
          },
          nextStepId: 'step_4'
        },
        {
          id: 'step_4',
          name: 'Distribute Report',
          type: 'action',
          configuration: {
            action: 'distribute',
            recipients: ['client', 'vr_counselor', 'program_coordinator'],
            methods: ['email', 'portal_upload']
          }
        }
      ]
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, triggerData?: Record<string, unknown>): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    const executionId = generateTimestampedId('exec');

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date().toISOString(),
      stepResults: []
    };

    this.executions.set(executionId, execution);

    // Execute workflow steps
    try {
      for (const step of workflow.steps) {
        const result = await this.executeStep(step, triggerData);
        execution.stepResults.push({
          stepId: step.id,
          status: result.success ? 'success' : 'failed',
          output: result.output,
          error: result.error
        });

        if (!result.success) {
          execution.status = 'failed';
          break;
        }
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
    } catch (error) {
      execution.status = 'failed';
    }

    execution.completedAt = new Date().toISOString();
    workflow.lastTriggeredAt = new Date().toISOString();

    return execution;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    _context?: Record<string, unknown>
  ): Promise<{ success: boolean; output?: unknown; error?: string }> {
    // Simulate step execution
    // In production, this would integrate with actual services
    console.log(`Executing step: ${step.name} (${step.type})`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      output: {
        stepId: step.id,
        completedAt: new Date().toISOString(),
        configuration: step.configuration
      }
    };
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows for a client
   */
  getClientWorkflows(clientId: string): Workflow[] {
    return Array.from(this.workflows.values()).filter(
      workflow => {
        const triggerConfig = workflow.trigger.configuration as { clientId?: string };
        return triggerConfig.clientId === clientId;
      }
    );
  }

  /**
   * Get workflow execution history
   */
  getExecutionHistory(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  /**
   * Pause a workflow
   */
  pauseWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }
    workflow.isActive = false;
    return true;
  }

  /**
   * Resume a workflow
   */
  resumeWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }
    workflow.isActive = true;
    return true;
  }
}

export const taskAutomation = new TaskAutomation();
