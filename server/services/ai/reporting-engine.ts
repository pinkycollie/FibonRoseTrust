/**
 * Reporting Engine Service
 * Creates required VR documentation and progress reports
 */

export interface ProgressMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  targetValue?: number;
  percentComplete?: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  targetDate: string;
  completedDate?: string;
  category: string;
}

export interface ServiceUtilization {
  serviceType: string;
  hoursUsed: number;
  hoursAllocated: number;
  utilizationPercent: number;
  provider?: string;
}

export interface OutcomeProjection {
  metric: string;
  currentValue: number;
  projectedValue: number;
  confidence: number;
  timeframe: string;
}

export interface VRComplianceReport {
  id: string;
  clientId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  summary: string;
  progressMetrics: ProgressMetric[];
  milestoneAchievements: Milestone[];
  serviceUtilization: ServiceUtilization[];
  outcomeProjections: OutcomeProjection[];
  recommendations: string[];
  accessibilityFeatures: string[];
  vrCounselorNotes?: string;
  clientFeedback?: string;
}

export interface ReportConfiguration {
  clientId: string;
  reportingInterval: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  includeProjections: boolean;
  includeRecommendations: boolean;
  accessibleFormats: ('pdf' | 'html' | 'audio' | 'braille')[];
  recipients: string[];
  customMetrics?: string[];
}

export class ReportingEngine {
  private reports: Map<string, VRComplianceReport>;
  private configurations: Map<string, ReportConfiguration>;
  private reportingInterval: string;

  constructor() {
    this.reports = new Map();
    this.configurations = new Map();
    this.reportingInterval = 'weekly';
  }

  /**
   * Configure reporting for a client
   */
  configureReporting(config: ReportConfiguration): ReportConfiguration {
    this.configurations.set(config.clientId, config);
    return config;
  }

  /**
   * Get reporting configuration for a client
   */
  getConfiguration(clientId: string): ReportConfiguration | undefined {
    return this.configurations.get(clientId);
  }

  /**
   * Generate VR compliance report
   */
  async generateVRComplianceReport(
    clientId: string,
    periodStart: string,
    periodEnd: string,
    reportType: VRComplianceReport['reportType'] = 'on_demand'
  ): Promise<VRComplianceReport> {
    const report = await this.compileReport({
      clientId,
      periodStart,
      periodEnd,
      reportType
    });

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Compile full report with all sections
   */
  private async compileReport(params: {
    clientId: string;
    periodStart: string;
    periodEnd: string;
    reportType: VRComplianceReport['reportType'];
  }): Promise<VRComplianceReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const progressMetrics = this.calculateProgress(params.clientId, params.periodStart, params.periodEnd);
    const milestones = this.trackMilestones(params.clientId, params.periodStart, params.periodEnd);
    const serviceUtilization = this.analyzeServiceUsage(params.clientId, params.periodStart, params.periodEnd);
    const outcomeProjections = this.forecastOutcomes(params.clientId, progressMetrics);

    const summary = this.generateSummary(progressMetrics, milestones, serviceUtilization);
    const recommendations = this.generateRecommendations(progressMetrics, milestones, serviceUtilization);

    const config = this.configurations.get(params.clientId);
    const accessibilityFeatures = config?.accessibleFormats || ['pdf', 'html'];

    return {
      id: reportId,
      clientId: params.clientId,
      reportType: params.reportType,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      generatedAt: new Date().toISOString(),
      summary,
      progressMetrics,
      milestoneAchievements: milestones,
      serviceUtilization,
      outcomeProjections,
      recommendations,
      accessibilityFeatures: accessibilityFeatures.map(String)
    };
  }

  /**
   * Calculate progress metrics for the period
   */
  private calculateProgress(
    clientId: string,
    _periodStart: string,
    _periodEnd: string
  ): ProgressMetric[] {
    // In production, this would pull from actual data sources
    return [
      {
        name: 'Business Plan Progress',
        value: 75,
        unit: 'percent',
        trend: 'up',
        targetValue: 100,
        percentComplete: 75
      },
      {
        name: 'Training Modules Completed',
        value: 8,
        unit: 'modules',
        trend: 'up',
        targetValue: 12,
        percentComplete: 67
      },
      {
        name: 'Mentoring Sessions Attended',
        value: 4,
        unit: 'sessions',
        trend: 'stable',
        targetValue: 4,
        percentComplete: 100
      },
      {
        name: 'Skills Assessments Passed',
        value: 5,
        unit: 'assessments',
        trend: 'up',
        targetValue: 6,
        percentComplete: 83
      },
      {
        name: 'Hours of Assistive Technology Training',
        value: 16,
        unit: 'hours',
        trend: 'up',
        targetValue: 20,
        percentComplete: 80
      },
      {
        name: 'Client Engagement Score',
        value: 92,
        unit: 'points',
        trend: 'up',
        targetValue: 85,
        percentComplete: 108
      }
    ];
  }

  /**
   * Track milestone achievements for the period
   */
  private trackMilestones(
    clientId: string,
    _periodStart: string,
    _periodEnd: string
  ): Milestone[] {
    // In production, this would pull from the learning path and business plan data
    return [
      {
        id: 'milestone_1',
        name: 'Business Concept Defined',
        description: 'Successfully defined clear business concept and value proposition',
        status: 'completed',
        targetDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'business_planning'
      },
      {
        id: 'milestone_2',
        name: 'Market Research Completed',
        description: 'Completed comprehensive market research and competitor analysis',
        status: 'completed',
        targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'business_planning'
      },
      {
        id: 'milestone_3',
        name: 'Accessibility Technology Setup',
        description: 'Completed setup of all required assistive technologies',
        status: 'completed',
        targetDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'technology'
      },
      {
        id: 'milestone_4',
        name: 'Financial Literacy Training',
        description: 'Complete financial literacy training module',
        status: 'in_progress',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'training'
      },
      {
        id: 'milestone_5',
        name: 'Business License Application',
        description: 'Submit business license application',
        status: 'pending',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'legal'
      }
    ];
  }

  /**
   * Analyze service utilization for the period
   */
  private analyzeServiceUsage(
    clientId: string,
    _periodStart: string,
    _periodEnd: string
  ): ServiceUtilization[] {
    // In production, this would pull from actual service tracking data
    return [
      {
        serviceType: 'Business Planning Support',
        hoursUsed: 12,
        hoursAllocated: 20,
        utilizationPercent: 60,
        provider: 'Small Business Development Center'
      },
      {
        serviceType: 'Mentoring',
        hoursUsed: 8,
        hoursAllocated: 10,
        utilizationPercent: 80,
        provider: 'SCORE Mentorship Program'
      },
      {
        serviceType: 'Assistive Technology Training',
        hoursUsed: 16,
        hoursAllocated: 20,
        utilizationPercent: 80,
        provider: 'Assistive Technology Center'
      },
      {
        serviceType: 'VR Counseling',
        hoursUsed: 4,
        hoursAllocated: 4,
        utilizationPercent: 100,
        provider: 'Vocational Rehabilitation Services'
      },
      {
        serviceType: 'Legal Consultation',
        hoursUsed: 2,
        hoursAllocated: 5,
        utilizationPercent: 40,
        provider: 'Disability Legal Aid Services'
      }
    ];
  }

  /**
   * Forecast outcomes based on current progress
   */
  private forecastOutcomes(
    _clientId: string,
    progressMetrics: ProgressMetric[]
  ): OutcomeProjection[] {
    const averageProgress = progressMetrics.reduce(
      (sum, m) => sum + (m.percentComplete || 0), 0
    ) / progressMetrics.length;

    return [
      {
        metric: 'Business Launch Readiness',
        currentValue: averageProgress,
        projectedValue: Math.min(100, averageProgress + 15),
        confidence: 0.85,
        timeframe: '30 days'
      },
      {
        metric: 'Self-Employment Sustainability',
        currentValue: averageProgress * 0.8,
        projectedValue: Math.min(100, averageProgress * 0.8 + 20),
        confidence: 0.75,
        timeframe: '90 days'
      },
      {
        metric: 'Revenue Generation Capability',
        currentValue: averageProgress * 0.6,
        projectedValue: Math.min(100, averageProgress * 0.6 + 25),
        confidence: 0.70,
        timeframe: '120 days'
      },
      {
        metric: 'Program Completion Likelihood',
        currentValue: 90,
        projectedValue: 95,
        confidence: 0.90,
        timeframe: '180 days'
      }
    ];
  }

  /**
   * Generate executive summary
   */
  private generateSummary(
    progressMetrics: ProgressMetric[],
    milestones: Milestone[],
    serviceUtilization: ServiceUtilization[]
  ): string {
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = milestones.length;
    const avgProgress = progressMetrics.reduce(
      (sum, m) => sum + (m.percentComplete || 0), 0
    ) / progressMetrics.length;
    const avgUtilization = serviceUtilization.reduce(
      (sum, s) => sum + s.utilizationPercent, 0
    ) / serviceUtilization.length;

    return `This report covers the client's progress toward self-employment goals. ` +
      `Overall program completion is at ${avgProgress.toFixed(0)}%, with ${completedMilestones} of ${totalMilestones} ` +
      `milestones achieved. Service utilization is at ${avgUtilization.toFixed(0)}% of allocated hours. ` +
      `The client is on track to meet program objectives within the expected timeline. ` +
      `Key accomplishments this period include completion of business concept definition and market research. ` +
      `Next priorities include completing financial literacy training and submitting the business license application.`;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    progressMetrics: ProgressMetric[],
    milestones: Milestone[],
    serviceUtilization: ServiceUtilization[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for low progress areas
    const lowProgressMetrics = progressMetrics.filter(
      m => (m.percentComplete || 0) < 50
    );
    if (lowProgressMetrics.length > 0) {
      recommendations.push(
        `Focus additional support on: ${lowProgressMetrics.map(m => m.name).join(', ')}`
      );
    }

    // Check for underutilized services
    const underutilizedServices = serviceUtilization.filter(
      s => s.utilizationPercent < 50
    );
    if (underutilizedServices.length > 0) {
      recommendations.push(
        `Consider increasing engagement with: ${underutilizedServices.map(s => s.serviceType).join(', ')}`
      );
    }

    // Check for delayed milestones
    const delayedMilestones = milestones.filter(m => m.status === 'delayed');
    if (delayedMilestones.length > 0) {
      recommendations.push(
        `Address delayed milestones: ${delayedMilestones.map(m => m.name).join(', ')}`
      );
    }

    // General recommendations
    recommendations.push(
      'Continue regular check-ins with VR counselor to maintain momentum',
      'Utilize remaining allocated hours for mentoring and training services',
      'Begin preparation for upcoming business license application milestone'
    );

    return recommendations;
  }

  /**
   * Export report in accessible format
   */
  async exportReport(
    reportId: string,
    format: 'pdf' | 'html' | 'audio' | 'json'
  ): Promise<{ content: string; format: string; filename: string }> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    let content: string;
    let filename: string;

    switch (format) {
      case 'html':
        content = this.generateHtmlReport(report);
        filename = `vr_report_${report.id}.html`;
        break;
      case 'audio':
        content = this.generateAudioScript(report);
        filename = `vr_report_${report.id}_audio.txt`;
        break;
      case 'json':
        content = JSON.stringify(report, null, 2);
        filename = `vr_report_${report.id}.json`;
        break;
      case 'pdf':
      default:
        content = this.generatePdfContent(report);
        filename = `vr_report_${report.id}.pdf`;
        break;
    }

    return { content, format, filename };
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: VRComplianceReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VR Progress Report - ${report.id}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; }
    h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    .metric { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .milestone { padding: 10px; border-left: 4px solid #3498db; margin: 10px 0; }
    .milestone.completed { border-color: #27ae60; }
    .milestone.in_progress { border-color: #f39c12; }
    .milestone.pending { border-color: #95a5a6; }
    .recommendation { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>VR Compliance Report</h1>
  <p><strong>Report ID:</strong> ${report.id}</p>
  <p><strong>Period:</strong> ${new Date(report.periodStart).toLocaleDateString()} - ${new Date(report.periodEnd).toLocaleDateString()}</p>
  <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
  
  <h2>Executive Summary</h2>
  <p>${report.summary}</p>
  
  <h2>Progress Metrics</h2>
  ${report.progressMetrics.map(m => `
    <div class="metric">
      <strong>${m.name}:</strong> ${m.value} ${m.unit}
      (${m.percentComplete}% complete, trend: ${m.trend})
    </div>
  `).join('')}
  
  <h2>Milestone Achievements</h2>
  ${report.milestoneAchievements.map(m => `
    <div class="milestone ${m.status}">
      <strong>${m.name}</strong> - ${m.status}
      <p>${m.description}</p>
      <small>Target: ${new Date(m.targetDate).toLocaleDateString()}</small>
    </div>
  `).join('')}
  
  <h2>Service Utilization</h2>
  <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
    <tr>
      <th>Service</th>
      <th>Hours Used</th>
      <th>Hours Allocated</th>
      <th>Utilization</th>
    </tr>
    ${report.serviceUtilization.map(s => `
      <tr>
        <td>${s.serviceType}</td>
        <td>${s.hoursUsed}</td>
        <td>${s.hoursAllocated}</td>
        <td>${s.utilizationPercent}%</td>
      </tr>
    `).join('')}
  </table>
  
  <h2>Recommendations</h2>
  ${report.recommendations.map(r => `
    <div class="recommendation">• ${r}</div>
  `).join('')}
</body>
</html>
    `.trim();
  }

  /**
   * Generate audio script for accessibility
   */
  private generateAudioScript(report: VRComplianceReport): string {
    const lines: string[] = [
      'VR Progress Report Audio Version',
      '',
      `This report covers the period from ${new Date(report.periodStart).toLocaleDateString()} to ${new Date(report.periodEnd).toLocaleDateString()}.`,
      '',
      'Executive Summary:',
      report.summary,
      '',
      'Progress Metrics:',
      ...report.progressMetrics.map(m => 
        `${m.name}: ${m.value} ${m.unit}, which is ${m.percentComplete} percent complete. The trend is ${m.trend}.`
      ),
      '',
      'Milestone Achievements:',
      ...report.milestoneAchievements.map(m =>
        `${m.name}: ${m.status}. ${m.description}`
      ),
      '',
      'Recommendations:',
      ...report.recommendations.map((r, i) => `${i + 1}. ${r}`),
      '',
      'End of report.'
    ];

    return lines.join('\n');
  }

  /**
   * Generate PDF content (placeholder - would use PDF library in production)
   */
  private generatePdfContent(report: VRComplianceReport): string {
    // In production, this would use a PDF generation library
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): VRComplianceReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports for a client
   */
  getClientReports(clientId: string): VRComplianceReport[] {
    return Array.from(this.reports.values())
      .filter(report => report.clientId === clientId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  /**
   * Schedule automatic report generation
   */
  scheduleReports(clientId: string, interval: 'weekly' | 'bi-weekly' | 'monthly'): void {
    const config = this.configurations.get(clientId);
    if (config) {
      config.reportingInterval = interval;
      this.configurations.set(clientId, config);
    } else {
      this.configurations.set(clientId, {
        clientId,
        reportingInterval: interval,
        includeProjections: true,
        includeRecommendations: true,
        accessibleFormats: ['pdf', 'html'],
        recipients: []
      });
    }

    console.log(`Scheduled ${interval} reports for client ${clientId}`);
  }
}

export const reportingEngine = new ReportingEngine();
