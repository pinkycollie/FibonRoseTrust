import { describe, it, expect, beforeEach } from 'vitest';
import { DeafFirstIntegration } from '../../server/services/deaf-first-integration';

describe('DeafFirstIntegration', () => {
  let service: DeafFirstIntegration;

  beforeEach(() => {
    service = new DeafFirstIntegration();
  });

  describe('getUserAccessibilityPreferences', () => {
    it('should return accessibility preferences for a user', async () => {
      const preferences = await service.getUserAccessibilityPreferences(1);
      
      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(1);
      expect(preferences.signLanguage).toBe('asl');
      expect(preferences.captionSettings).toBeDefined();
      expect(preferences.visualAlerts).toBe(true);
    });

    it('should return default caption settings', async () => {
      const preferences = await service.getUserAccessibilityPreferences(123);
      
      expect(preferences.captionSettings.fontSize).toBe(16);
      expect(preferences.captionSettings.fontFamily).toBe('Arial');
      expect(preferences.captionSettings.position).toBe('bottom');
    });
  });

  describe('updateAccessibilityPreferences', () => {
    it('should update user preferences', async () => {
      const updated = await service.updateAccessibilityPreferences(1, {
        highContrast: true,
        largeText: true
      });
      
      expect(updated.highContrast).toBe(true);
      expect(updated.largeText).toBe(true);
      expect(updated.userId).toBe(1);
    });
  });

  describe('recognizeSignLanguage', () => {
    it('should return sign language recognition result', async () => {
      const result = await service.recognizeSignLanguage('video_data', 'asl');
      
      expect(result).toBeDefined();
      expect(result.text).toBe('Hello, how are you today?');
      expect(result.confidence).toBe(0.95);
      expect(result.timestamps).toHaveLength(5);
    });

    it('should include word timestamps', async () => {
      const result = await service.recognizeSignLanguage('video_data', 'asl');
      
      expect(result.timestamps[0].word).toBe('Hello');
      expect(result.timestamps[0].start).toBe(0);
      expect(result.timestamps[0].end).toBe(1.2);
    });
  });

  describe('getGestureLibrary', () => {
    it('should return ASL gesture library', async () => {
      const gestures = await service.getGestureLibrary('asl');
      
      expect(gestures).toHaveLength(4);
      expect(gestures[0].gesture).toBe('hello');
      expect(gestures[0].videoUrl).toContain('/gestures/asl/');
    });

    it('should return BSL gesture library', async () => {
      const gestures = await service.getGestureLibrary('bsl');
      
      expect(gestures).toHaveLength(2);
      expect(gestures[0].videoUrl).toContain('/gestures/bsl/');
    });

    it('should return empty array for unknown language', async () => {
      const gestures = await service.getGestureLibrary('unknown');
      
      expect(gestures).toHaveLength(0);
    });
  });

  describe('processLiveCaptions', () => {
    it('should return caption segments', async () => {
      const segments = await service.processLiveCaptions('audio_data');
      
      expect(segments).toHaveLength(3);
      expect(segments[0].text).toContain('Welcome');
      expect(segments[0].confidence).toBeGreaterThan(0.9);
    });

    it('should include timing information', async () => {
      const segments = await service.processLiveCaptions('audio_data');
      
      expect(segments[0].startTime).toBe(0);
      expect(segments[0].endTime).toBe(3.5);
      expect(segments[0].id).toBe('seg_1');
    });
  });

  describe('exportCaptions', () => {
    const mockSegments = [
      { id: 'seg_1', startTime: 0, endTime: 3.5, text: 'Hello world', confidence: 0.98 },
      { id: 'seg_2', startTime: 4.0, endTime: 7.0, text: 'Testing captions', confidence: 0.95 }
    ];

    it('should export captions as SRT format', async () => {
      const srt = await service.exportCaptions(mockSegments, 'srt');
      
      expect(srt).toContain('1\n');
      expect(srt).toContain('00:00:00,000 --> 00:00:03,500');
      expect(srt).toContain('Hello world');
    });

    it('should export captions as VTT format', async () => {
      const vtt = await service.exportCaptions(mockSegments, 'vtt');
      
      expect(vtt).toContain('WEBVTT');
      expect(vtt).toContain('Hello world');
    });

    it('should export captions as plain text', async () => {
      const txt = await service.exportCaptions(mockSegments, 'txt');
      
      expect(txt).toBe('Hello world Testing captions');
    });
  });

  describe('findInterpreters', () => {
    it('should find ASL interpreters', async () => {
      const interpreters = await service.findInterpreters('asl');
      
      expect(interpreters.length).toBeGreaterThan(0);
      expect(interpreters[0].language).toBe('asl');
      expect(interpreters[0].rating).toBeGreaterThan(4);
    });

    it('should return empty for non-existent language', async () => {
      const interpreters = await service.findInterpreters('xyz');
      
      expect(interpreters).toHaveLength(0);
    });
  });

  describe('requestInterpreterSession', () => {
    it('should create an interpreter session', async () => {
      const sessionId = await service.requestInterpreterSession('asl', 'normal', 30);
      
      expect(sessionId).toBeDefined();
      expect(sessionId).toContain('session_');
    });
  });

  describe('checkColorContrast', () => {
    it('should check color contrast ratio', async () => {
      const result = await service.checkColorContrast('#000000', '#FFFFFF');
      
      expect(result.ratio).toBe(7.5);
      expect(result.wcagAA).toBe(true);
      expect(result.wcagAAA).toBe(true);
    });
  });

  describe('performAccessibilityAudit', () => {
    it('should return accessibility audit report', async () => {
      const report = await service.performAccessibilityAudit('https://example.com');
      
      expect(report.score).toBe(95);
      expect(report.issues).toHaveLength(1);
      expect(report.compliance.wcag21aa).toBe(true);
      expect(report.compliance.section508).toBe(true);
    });

    it('should include issue details', async () => {
      const report = await service.performAccessibilityAudit('https://example.com');
      
      expect(report.issues[0].type).toBe('missing_alt_text');
      expect(report.issues[0].severity).toBe('medium');
      expect(report.issues[0].recommendation).toBeDefined();
    });
  });

  describe('createCommunicationSession', () => {
    it('should create a communication session', async () => {
      const sessionId = await service.createCommunicationSession(
        'video_call',
        ['user1', 'user2'],
        ['captions', 'sign_language']
      );
      
      expect(sessionId).toBeDefined();
      expect(sessionId).toContain('comm_');
    });
  });

  describe('searchCommunityResources', () => {
    it('should search community resources', async () => {
      const resources = await service.searchCommunityResources('ASL');
      
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].language).toBe('asl');
    });

    it('should filter by type', async () => {
      const resources = await service.searchCommunityResources('', 'educational');
      
      expect(resources.every(r => r.type === 'educational')).toBe(true);
    });
  });

  describe('findSupportGroups', () => {
    it('should find support groups', async () => {
      const groups = await service.findSupportGroups('online', 'asl');
      
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].language).toBe('asl');
      expect(groups[0].location).toBe('online');
    });
  });

  describe('createDeafAuthSession', () => {
    it('should create a DeafAuth session', async () => {
      const session = await service.createDeafAuthSession(1);
      
      expect(session.sessionId).toContain('deaf_auth_');
      expect(session.token).toContain('token_');
      expect(session.expiresAt).toBeDefined();
    });

    it('should set expiration 24 hours from now', async () => {
      const session = await service.createDeafAuthSession(1);
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 0);
    });
  });
});
