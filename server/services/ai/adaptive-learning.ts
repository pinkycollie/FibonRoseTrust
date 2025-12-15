/**
 * Adaptive Learning System Service
 * Generates personalized learning modules based on client needs and accessibility requirements
 */

import { generateTimestampedId } from './utils';

export type LearningStyle = 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';
export type ContentFormat = 'video' | 'audio' | 'text' | 'interactive';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  businessType: string;
  learningStyle: LearningStyle;
  difficultyLevel: DifficultyLevel;
  duration: number; // in minutes
  content: ModuleContent[];
  assessments: Assessment[];
  prerequisites?: string[];
  accessibilityFeatures: string[];
  createdAt: string;
}

export interface ModuleContent {
  id: string;
  type: ContentFormat;
  title: string;
  url?: string;
  text?: string;
  duration?: number;
  accessibilityOptions: {
    captions?: boolean;
    audioDescription?: boolean;
    transcript?: string;
    signLanguageVideo?: string;
    highContrast?: boolean;
    largeText?: boolean;
    simplifiedText?: boolean;
  };
}

export interface Assessment {
  id: string;
  type: 'quiz' | 'practical' | 'self_reflection' | 'project';
  title: string;
  questions?: AssessmentQuestion[];
  passingScore?: number;
  accessibilityOptions: {
    extendedTime?: boolean;
    textToSpeech?: boolean;
    simplifiedLanguage?: boolean;
  };
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string | boolean;
  points: number;
}

export interface ClientAssessment {
  clientId: string;
  businessType: string;
  learningStyle: LearningStyle;
  accommodations: string[];
  experienceLevel: DifficultyLevel;
  goals: string[];
  timeAvailable: number; // hours per week
}

export interface LearningProgress {
  clientId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedContent: string[];
  assessmentScores: Array<{
    assessmentId: string;
    score: number;
    completedAt: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  timeSpent: number; // in minutes
}

export interface LearningPath {
  id: string;
  clientId: string;
  modules: LearningModule[];
  currentModuleIndex: number;
  progress: Map<string, LearningProgress>;
  createdAt: string;
  estimatedCompletionDate: string;
}

export class AdaptiveLearningSystem {
  private learningModules: Map<string, LearningModule>;
  private learningPaths: Map<string, LearningPath>;
  private progressRecords: Map<string, LearningProgress>;

  constructor() {
    this.learningModules = new Map();
    this.learningPaths = new Map();
    this.progressRecords = new Map();
    this.initializeDefaultModules();
  }

  /**
   * Initialize default learning modules
   */
  private initializeDefaultModules(): void {
    const defaultModules: LearningModule[] = [
      {
        id: 'biz_fundamentals_01',
        title: 'Business Fundamentals',
        description: 'Introduction to basic business concepts and terminology',
        businessType: 'general',
        learningStyle: 'visual',
        difficultyLevel: 'beginner',
        duration: 60,
        content: [
          {
            id: 'content_1',
            type: 'video',
            title: 'What is a Business?',
            url: '/learning/videos/what-is-business.mp4',
            duration: 10,
            accessibilityOptions: {
              captions: true,
              audioDescription: true,
              transcript: 'A business is an organization engaged in commercial activities...'
            }
          },
          {
            id: 'content_2',
            type: 'text',
            title: 'Types of Business Structures',
            text: 'Understanding different business structures: Sole Proprietorship, LLC, Corporation...',
            accessibilityOptions: {
              highContrast: true,
              largeText: true,
              simplifiedText: true
            }
          }
        ],
        assessments: [
          {
            id: 'assess_1',
            type: 'quiz',
            title: 'Business Basics Quiz',
            passingScore: 70,
            questions: [
              {
                id: 'q1',
                text: 'What is a sole proprietorship?',
                type: 'multiple_choice',
                options: [
                  'A business owned by one person',
                  'A business owned by the government',
                  'A business with multiple shareholders',
                  'A non-profit organization'
                ],
                correctAnswer: 'A business owned by one person',
                points: 10
              }
            ],
            accessibilityOptions: {
              extendedTime: true,
              textToSpeech: true,
              simplifiedLanguage: true
            }
          }
        ],
        accessibilityFeatures: ['screen_reader_compatible', 'keyboard_navigation', 'high_contrast_mode'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'financial_literacy_01',
        title: 'Financial Literacy for Entrepreneurs',
        description: 'Understanding basic financial concepts for business owners',
        businessType: 'general',
        learningStyle: 'reading_writing',
        difficultyLevel: 'beginner',
        duration: 90,
        content: [
          {
            id: 'content_1',
            type: 'text',
            title: 'Introduction to Business Finance',
            text: 'This module covers the fundamentals of managing business finances...',
            accessibilityOptions: {
              highContrast: true,
              largeText: true
            }
          },
          {
            id: 'content_2',
            type: 'interactive',
            title: 'Budget Planning Exercise',
            url: '/learning/interactive/budget-planner',
            accessibilityOptions: {
              simplifiedText: true
            }
          }
        ],
        assessments: [
          {
            id: 'assess_1',
            type: 'practical',
            title: 'Create a Simple Budget',
            accessibilityOptions: {
              extendedTime: true
            }
          }
        ],
        accessibilityFeatures: ['text_to_speech', 'simplified_content'],
        createdAt: new Date().toISOString()
      }
    ];

    for (const module of defaultModules) {
      this.learningModules.set(module.id, module);
    }
  }

  /**
   * Generate a personalized learning path based on client assessment
   */
  async generateLearningPath(clientAssessment: ClientAssessment): Promise<LearningPath> {
    const modules = await this.aiGenerateModules(clientAssessment);
    const sequencedModules = this.sequenceModules(modules);

    const pathId = generateTimestampedId('path');

    // Calculate estimated completion date
    const totalDuration = sequencedModules.reduce((sum, m) => sum + m.duration, 0);
    const weeksNeeded = Math.ceil(totalDuration / 60 / clientAssessment.timeAvailable);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + weeksNeeded * 7);

    const learningPath: LearningPath = {
      id: pathId,
      clientId: clientAssessment.clientId,
      modules: sequencedModules,
      currentModuleIndex: 0,
      progress: new Map(),
      createdAt: new Date().toISOString(),
      estimatedCompletionDate: completionDate.toISOString()
    };

    this.learningPaths.set(pathId, learningPath);

    // Initialize progress records
    for (const module of sequencedModules) {
      const progressKey = `${clientAssessment.clientId}_${module.id}`;
      this.progressRecords.set(progressKey, {
        clientId: clientAssessment.clientId,
        moduleId: module.id,
        status: 'not_started',
        completedContent: [],
        assessmentScores: [],
        timeSpent: 0
      });
    }

    return learningPath;
  }

  /**
   * AI-powered module generation based on client needs
   */
  private async aiGenerateModules(clientAssessment: ClientAssessment): Promise<LearningModule[]> {
    // In production, this would integrate with an AI service
    // For now, we generate modules based on business type and skill level
    
    const generatedModules: LearningModule[] = [];

    // Get appropriate content based on learning style and accommodations
    const contentFormats = this.getContentFormatsForStyle(clientAssessment.learningStyle);
    const accessibilityFeatures = this.getAccessibilityFeatures(clientAssessment.accommodations);

    // Business-specific modules
    const businessModules = this.getBusinessTypeModules(
      clientAssessment.businessType,
      clientAssessment.experienceLevel
    );

    for (const moduleTemplate of businessModules) {
      const adaptedModule = this.adaptModuleForClient(
        moduleTemplate,
        clientAssessment.learningStyle,
        accessibilityFeatures,
        contentFormats
      );
      generatedModules.push(adaptedModule);
    }

    // Add goal-specific modules
    for (const goal of clientAssessment.goals) {
      const goalModule = this.createGoalModule(
        goal,
        clientAssessment.learningStyle,
        accessibilityFeatures,
        clientAssessment.experienceLevel
      );
      generatedModules.push(goalModule);
    }

    return generatedModules;
  }

  /**
   * Get content formats based on learning style
   */
  private getContentFormatsForStyle(learningStyle: LearningStyle): ContentFormat[] {
    const formatMap: Record<LearningStyle, ContentFormat[]> = {
      visual: ['video', 'interactive'],
      auditory: ['audio', 'video'],
      reading_writing: ['text', 'interactive'],
      kinesthetic: ['interactive', 'video']
    };
    return formatMap[learningStyle] || ['text', 'video'];
  }

  /**
   * Get accessibility features based on accommodations
   */
  private getAccessibilityFeatures(accommodations: string[]): string[] {
    const features: string[] = [];

    const accommodationFeatureMap: Record<string, string[]> = {
      'visual_impairment': ['screen_reader', 'audio_description', 'high_contrast', 'large_text'],
      'hearing_impairment': ['captions', 'sign_language', 'visual_cues', 'transcripts'],
      'mobility_impairment': ['keyboard_navigation', 'voice_control', 'switch_access'],
      'cognitive_disability': ['simplified_text', 'step_by_step', 'visual_guides', 'progress_indicators'],
      'learning_disability': ['text_to_speech', 'dyslexia_font', 'extended_time', 'chunked_content']
    };

    for (const accommodation of accommodations) {
      const mappedFeatures = accommodationFeatureMap[accommodation] || [];
      features.push(...mappedFeatures);
    }

    return [...new Set(features)];
  }

  /**
   * Get modules specific to business type
   */
  private getBusinessTypeModules(businessType: string, level: DifficultyLevel): LearningModule[] {
    // Return relevant modules from the library
    const allModules = Array.from(this.learningModules.values());
    return allModules.filter(
      m => (m.businessType === businessType || m.businessType === 'general') &&
           m.difficultyLevel === level
    );
  }

  /**
   * Adapt a module for specific client needs
   */
  private adaptModuleForClient(
    module: LearningModule,
    learningStyle: LearningStyle,
    accessibilityFeatures: string[],
    contentFormats: ContentFormat[]
  ): LearningModule {
    const adaptedModule: LearningModule = {
      ...module,
      id: `${module.id}_adapted_${generateTimestampedId('')}`,
      learningStyle,
      accessibilityFeatures: [...module.accessibilityFeatures, ...accessibilityFeatures],
      content: module.content.filter(c => contentFormats.includes(c.type))
    };

    // Ensure at least some content exists
    if (adaptedModule.content.length === 0) {
      adaptedModule.content = module.content.slice(0, 2);
    }

    return adaptedModule;
  }

  /**
   * Create a goal-specific module
   */
  private createGoalModule(
    goal: string,
    learningStyle: LearningStyle,
    accessibilityFeatures: string[],
    level: DifficultyLevel
  ): LearningModule {
    return {
      id: generateTimestampedId(`goal_${goal.replace(/\s+/g, '_').toLowerCase()}`),
      title: `Achieving: ${goal}`,
      description: `Targeted learning module to help you achieve your goal: ${goal}`,
      businessType: 'goal_specific',
      learningStyle,
      difficultyLevel: level,
      duration: 45,
      content: [
        {
          id: 'goal_content_1',
          type: learningStyle === 'visual' ? 'video' : 'text',
          title: `Understanding ${goal}`,
          text: `This module helps you work toward: ${goal}`,
          accessibilityOptions: {
            captions: true,
            simplifiedText: true,
            largeText: true
          }
        },
        {
          id: 'goal_content_2',
          type: 'interactive',
          title: 'Action Planning',
          url: `/learning/interactive/action-plan`,
          accessibilityOptions: {
            simplifiedText: true
          }
        }
      ],
      assessments: [
        {
          id: generateTimestampedId('goal_assess'),
          type: 'self_reflection',
          title: 'Progress Reflection',
          accessibilityOptions: {
            extendedTime: true,
            textToSpeech: true
          }
        }
      ],
      accessibilityFeatures,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Sequence modules in optimal learning order
   */
  private sequenceModules(modules: LearningModule[]): LearningModule[] {
    // Sort by difficulty level, then by prerequisites
    const levelOrder: Record<DifficultyLevel, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3
    };

    return modules.sort((a, b) => {
      // First by difficulty
      const levelDiff = levelOrder[a.difficultyLevel] - levelOrder[b.difficultyLevel];
      if (levelDiff !== 0) return levelDiff;

      // Then by prerequisites (modules with no prerequisites first)
      const aPrereqs = a.prerequisites?.length || 0;
      const bPrereqs = b.prerequisites?.length || 0;
      return aPrereqs - bPrereqs;
    });
  }

  /**
   * Create adaptive content for a module
   */
  async createAdaptiveContent(
    moduleId: string,
    clientProgress: LearningProgress
  ): Promise<Record<ContentFormat, ModuleContent | null>> {
    const module = this.learningModules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Adapt content based on progress
    const adaptedContent: Record<ContentFormat, ModuleContent | null> = {
      video: null,
      audio: null,
      text: null,
      interactive: null
    };

    for (const content of module.content) {
      if (adaptedContent[content.type] === null) {
        adaptedContent[content.type] = {
          ...content,
          // Add progress-specific adaptations
          accessibilityOptions: {
            ...content.accessibilityOptions,
            // Adjust based on client's learning history
          }
        };
      }
    }

    // Generate missing content types
    if (!adaptedContent.video) {
      adaptedContent.video = this.generateCaptionedVideo(module);
    }
    if (!adaptedContent.audio) {
      adaptedContent.audio = this.createAudioDescription(module);
    }
    if (!adaptedContent.text) {
      adaptedContent.text = this.formatAccessibleText(module);
    }
    if (!adaptedContent.interactive) {
      adaptedContent.interactive = this.createAdaptiveExercises(module, clientProgress);
    }

    return adaptedContent;
  }

  /**
   * Generate captioned video content
   */
  private generateCaptionedVideo(module: LearningModule): ModuleContent {
    return {
      id: generateTimestampedId(`video_${module.id}`),
      type: 'video',
      title: `${module.title} - Video`,
      url: `/learning/videos/${module.id}.mp4`,
      duration: module.duration,
      accessibilityOptions: {
        captions: true,
        audioDescription: true,
        signLanguageVideo: `/learning/videos/${module.id}_asl.mp4`,
        transcript: `Transcript for ${module.title}...`
      }
    };
  }

  /**
   * Create audio description content
   */
  private createAudioDescription(module: LearningModule): ModuleContent {
    return {
      id: generateTimestampedId(`audio_${module.id}`),
      type: 'audio',
      title: `${module.title} - Audio`,
      url: `/learning/audio/${module.id}.mp3`,
      duration: module.duration,
      accessibilityOptions: {
        transcript: `Audio transcript for ${module.title}...`
      }
    };
  }

  /**
   * Format accessible text content
   */
  private formatAccessibleText(module: LearningModule): ModuleContent {
    return {
      id: generateTimestampedId(`text_${module.id}`),
      type: 'text',
      title: `${module.title} - Reading Material`,
      text: `Accessible text content for ${module.title}. ${module.description}`,
      accessibilityOptions: {
        highContrast: true,
        largeText: true,
        simplifiedText: true
      }
    };
  }

  /**
   * Create adaptive exercises
   */
  private createAdaptiveExercises(module: LearningModule, _progress: LearningProgress): ModuleContent {
    return {
      id: generateTimestampedId(`interactive_${module.id}`),
      type: 'interactive',
      title: `${module.title} - Practice Exercises`,
      url: `/learning/interactive/${module.id}`,
      accessibilityOptions: {
        simplifiedText: true
      }
    };
  }

  /**
   * Update learning progress
   */
  updateProgress(
    clientId: string,
    moduleId: string,
    contentId: string,
    timeSpent: number
  ): LearningProgress {
    const progressKey = `${clientId}_${moduleId}`;
    let progress = this.progressRecords.get(progressKey);

    if (!progress) {
      progress = {
        clientId,
        moduleId,
        status: 'in_progress',
        completedContent: [],
        assessmentScores: [],
        startedAt: new Date().toISOString(),
        timeSpent: 0
      };
    }

    if (progress.status === 'not_started') {
      progress.status = 'in_progress';
      progress.startedAt = new Date().toISOString();
    }

    if (!progress.completedContent.includes(contentId)) {
      progress.completedContent.push(contentId);
    }

    progress.timeSpent += timeSpent;

    this.progressRecords.set(progressKey, progress);
    return progress;
  }

  /**
   * Submit assessment score
   */
  submitAssessmentScore(
    clientId: string,
    moduleId: string,
    assessmentId: string,
    score: number
  ): LearningProgress {
    const progressKey = `${clientId}_${moduleId}`;
    const progress = this.progressRecords.get(progressKey);

    if (!progress) {
      throw new Error(`Progress record not found for client ${clientId} and module ${moduleId}`);
    }

    progress.assessmentScores.push({
      assessmentId,
      score,
      completedAt: new Date().toISOString()
    });

    // Check if module is complete
    const module = this.learningModules.get(moduleId);
    if (module) {
      const allContentCompleted = module.content.every(
        c => progress.completedContent.includes(c.id)
      );
      const allAssessmentsCompleted = module.assessments.every(
        a => progress.assessmentScores.some(s => s.assessmentId === a.id)
      );

      if (allContentCompleted && allAssessmentsCompleted) {
        progress.status = 'completed';
        progress.completedAt = new Date().toISOString();
      }
    }

    this.progressRecords.set(progressKey, progress);
    return progress;
  }

  /**
   * Get learning path for a client
   */
  getLearningPath(pathId: string): LearningPath | undefined {
    return this.learningPaths.get(pathId);
  }

  /**
   * Get client's learning paths
   */
  getClientLearningPaths(clientId: string): LearningPath[] {
    return Array.from(this.learningPaths.values())
      .filter(path => path.clientId === clientId);
  }

  /**
   * Get module by ID
   */
  getModule(moduleId: string): LearningModule | undefined {
    return this.learningModules.get(moduleId);
  }

  /**
   * Get progress for a client and module
   */
  getProgress(clientId: string, moduleId: string): LearningProgress | undefined {
    return this.progressRecords.get(`${clientId}_${moduleId}`);
  }
}

export const adaptiveLearningSystem = new AdaptiveLearningSystem();
