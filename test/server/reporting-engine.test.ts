/**
 * Reporting Engine Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportingEngine } from '../../server/services/ai/reporting-engine';

describe('ReportingEngine', () => {
  let reportingEngine: ReportingEngine;

  beforeEach(() => {
    reportingEngine = new ReportingEngine();
  });

  describe('configureReporting', () => {
    it('should configure reporting for a client', () => {
      const config = {
        clientId: 'client_1',
        reportingInterval: 'weekly' as const,
        includeProjections: true,
        includeRecommendations: true,
        accessibleFormats: ['pdf', 'html'] as const,
        recipients: ['counselor@vr.gov', 'client@email.com']
      };

      const result = reportingEngine.configureReporting(config);

      expect(result.clientId).toBe('client_1');
      expect(result.reportingInterval).toBe('weekly');
      expect(result.includeProjections).toBe(true);
      expect(result.recipients).toHaveLength(2);
    });
  });

  describe('getConfiguration', () => {
    it('should return configured reporting settings', () => {
      const config = {
        clientId: 'client_1',
        reportingInterval: 'monthly' as const,
        includeProjections: false,
        includeRecommendations: true,
        accessibleFormats: ['pdf', 'audio'] as const,
        recipients: ['test@example.com']
      };

      reportingEngine.configureReporting(config);
      const result = reportingEngine.getConfiguration('client_1');

      expect(result).toBeDefined();
      expect(result?.reportingInterval).toBe('monthly');
    });

    it('should return undefined for non-configured client', () => {
      const result = reportingEngine.getConfiguration('non_existent');
      expect(result).toBeUndefined();
    });
  });

  describe('generateVRComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const clientId = 'client_1';
      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const report = await reportingEngine.generateVRComplianceReport(
        clientId,
        periodStart,
        periodEnd
      );

      expect(report.id).toBeDefined();
      expect(report.clientId).toBe(clientId);
      expect(report.reportType).toBe('on_demand');
      expect(report.summary).toBeDefined();
      expect(report.progressMetrics.length).toBeGreaterThan(0);
      expect(report.milestoneAchievements.length).toBeGreaterThan(0);
      expect(report.serviceUtilization.length).toBeGreaterThan(0);
      expect(report.outcomeProjections.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate weekly report type', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        'weekly'
      );

      expect(report.reportType).toBe('weekly');
    });

    it('should generate monthly report type', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        'monthly'
      );

      expect(report.reportType).toBe('monthly');
    });
  });

  describe('getReport', () => {
    it('should retrieve a generated report', async () => {
      const generatedReport = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      const retrievedReport = reportingEngine.getReport(generatedReport.id);

      expect(retrievedReport).toEqual(generatedReport);
    });

    it('should return undefined for non-existent report', () => {
      const result = reportingEngine.getReport('non_existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getClientReports', () => {
    it('should return all reports for a client', async () => {
      await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

      const reports = reportingEngine.getClientReports('client_1');

      expect(reports.length).toBe(2);
      // Should be sorted by generatedAt descending
      expect(new Date(reports[0].generatedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(reports[1].generatedAt).getTime());
    });

    it('should return empty array for client with no reports', () => {
      const reports = reportingEngine.getClientReports('non_existent');
      expect(reports).toEqual([]);
    });
  });

  describe('exportReport', () => {
    it('should export report as HTML', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      const exported = await reportingEngine.exportReport(report.id, 'html');

      expect(exported.format).toBe('html');
      expect(exported.filename).toContain('.html');
      expect(exported.content).toContain('<!DOCTYPE html>');
      expect(exported.content).toContain('VR Progress Report');
    });

    it('should export report as JSON', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      const exported = await reportingEngine.exportReport(report.id, 'json');

      expect(exported.format).toBe('json');
      expect(exported.filename).toContain('.json');
      const parsed = JSON.parse(exported.content);
      expect(parsed.clientId).toBe('client_1');
    });

    it('should export report as audio script', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      const exported = await reportingEngine.exportReport(report.id, 'audio');

      expect(exported.format).toBe('audio');
      expect(exported.filename).toContain('_audio.txt');
      expect(exported.content).toContain('VR Progress Report Audio Version');
      expect(exported.content).toContain('Executive Summary');
      expect(exported.content).toContain('End of report');
    });

    it('should throw error for non-existent report', async () => {
      await expect(reportingEngine.exportReport('non_existent', 'html'))
        .rejects.toThrow('not found');
    });
  });

  describe('scheduleReports', () => {
    it('should schedule weekly reports for a client', () => {
      reportingEngine.scheduleReports('client_1', 'weekly');

      const config = reportingEngine.getConfiguration('client_1');
      expect(config).toBeDefined();
      expect(config?.reportingInterval).toBe('weekly');
    });

    it('should update existing configuration', () => {
      reportingEngine.configureReporting({
        clientId: 'client_1',
        reportingInterval: 'weekly',
        includeProjections: true,
        includeRecommendations: true,
        accessibleFormats: ['pdf'],
        recipients: []
      });

      reportingEngine.scheduleReports('client_1', 'monthly');

      const config = reportingEngine.getConfiguration('client_1');
      expect(config?.reportingInterval).toBe('monthly');
    });
  });

  describe('Progress Metrics', () => {
    it('should include progress metrics with trends', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      expect(report.progressMetrics.length).toBeGreaterThan(0);
      report.progressMetrics.forEach(metric => {
        expect(metric.name).toBeDefined();
        expect(metric.value).toBeDefined();
        expect(metric.unit).toBeDefined();
        expect(['up', 'down', 'stable']).toContain(metric.trend);
      });
    });
  });

  describe('Milestone Tracking', () => {
    it('should include milestone achievements', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      expect(report.milestoneAchievements.length).toBeGreaterThan(0);
      report.milestoneAchievements.forEach(milestone => {
        expect(milestone.id).toBeDefined();
        expect(milestone.name).toBeDefined();
        expect(milestone.description).toBeDefined();
        expect(['pending', 'in_progress', 'completed', 'delayed']).toContain(milestone.status);
        expect(milestone.targetDate).toBeDefined();
        expect(milestone.category).toBeDefined();
      });
    });
  });

  describe('Service Utilization', () => {
    it('should include service utilization data', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      expect(report.serviceUtilization.length).toBeGreaterThan(0);
      report.serviceUtilization.forEach(service => {
        expect(service.serviceType).toBeDefined();
        expect(typeof service.hoursUsed).toBe('number');
        expect(typeof service.hoursAllocated).toBe('number');
        expect(typeof service.utilizationPercent).toBe('number');
      });
    });
  });

  describe('Outcome Projections', () => {
    it('should include outcome projections', async () => {
      const report = await reportingEngine.generateVRComplianceReport(
        'client_1',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      expect(report.outcomeProjections.length).toBeGreaterThan(0);
      report.outcomeProjections.forEach(projection => {
        expect(projection.metric).toBeDefined();
        expect(typeof projection.currentValue).toBe('number');
        expect(typeof projection.projectedValue).toBe('number');
        expect(typeof projection.confidence).toBe('number');
        expect(projection.confidence).toBeGreaterThanOrEqual(0);
        expect(projection.confidence).toBeLessThanOrEqual(1);
        expect(projection.timeframe).toBeDefined();
      });
    });
  });
});
