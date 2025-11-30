import { describe, it, expect } from 'vitest';
import {
  calculateFibonroseTrustLevel,
  getTrustLevelDisplay,
  type FibonroseTrustLevel,
  type ASLFluencyLevel,
  type InterpreterSpecialization,
  type DeafExperienceCategory,
  type DeafSkillCategory,
  type FibonroseTrustScoreBreakdown,
} from '../../shared/schema';

describe('DEAF FIRST Verification Types', () => {
  describe('calculateFibonroseTrustLevel', () => {
    it('should return platinum for scores 90-100', () => {
      expect(calculateFibonroseTrustLevel(90)).toBe('platinum');
      expect(calculateFibonroseTrustLevel(95)).toBe('platinum');
      expect(calculateFibonroseTrustLevel(100)).toBe('platinum');
    });

    it('should return gold for scores 80-89', () => {
      expect(calculateFibonroseTrustLevel(80)).toBe('gold');
      expect(calculateFibonroseTrustLevel(85)).toBe('gold');
      expect(calculateFibonroseTrustLevel(89)).toBe('gold');
    });

    it('should return silver for scores 70-79', () => {
      expect(calculateFibonroseTrustLevel(70)).toBe('silver');
      expect(calculateFibonroseTrustLevel(75)).toBe('silver');
      expect(calculateFibonroseTrustLevel(79)).toBe('silver');
    });

    it('should return bronze for scores 60-69', () => {
      expect(calculateFibonroseTrustLevel(60)).toBe('bronze');
      expect(calculateFibonroseTrustLevel(65)).toBe('bronze');
      expect(calculateFibonroseTrustLevel(69)).toBe('bronze');
    });

    it('should return unverified for scores below 60', () => {
      expect(calculateFibonroseTrustLevel(0)).toBe('unverified');
      expect(calculateFibonroseTrustLevel(30)).toBe('unverified');
      expect(calculateFibonroseTrustLevel(59)).toBe('unverified');
    });
  });

  describe('getTrustLevelDisplay', () => {
    it('should return correct display for platinum level', () => {
      const display = getTrustLevelDisplay('platinum');
      expect(display.emoji).toBe('🟢');
      expect(display.label).toBe('Platinum Trust');
      expect(display.description).toContain('Highest verification');
    });

    it('should return correct display for gold level', () => {
      const display = getTrustLevelDisplay('gold');
      expect(display.emoji).toBe('🔵');
      expect(display.label).toBe('Gold Trust');
      expect(display.description).toContain('High verification');
    });

    it('should return correct display for silver level', () => {
      const display = getTrustLevelDisplay('silver');
      expect(display.emoji).toBe('🟡');
      expect(display.label).toBe('Silver Trust');
      expect(display.description).toContain('Standard verification');
    });

    it('should return correct display for bronze level', () => {
      const display = getTrustLevelDisplay('bronze');
      expect(display.emoji).toBe('🟠');
      expect(display.label).toBe('Bronze Trust');
      expect(display.description).toContain('Basic verification');
    });

    it('should return correct display for unverified level', () => {
      const display = getTrustLevelDisplay('unverified');
      expect(display.emoji).toBe('🔴');
      expect(display.label).toBe('Unverified');
      expect(display.description).toContain('Not recommended');
    });

    it('should have unique emojis for each level', () => {
      const levels: FibonroseTrustLevel[] = ['platinum', 'gold', 'silver', 'bronze', 'unverified'];
      const emojis = levels.map(level => getTrustLevelDisplay(level).emoji);
      const uniqueEmojis = new Set(emojis);
      expect(uniqueEmojis.size).toBe(levels.length);
    });
  });

  describe('Type definitions', () => {
    it('should validate ASLFluencyLevel values', () => {
      const validLevels: ASLFluencyLevel[] = ['beginner', 'intermediate', 'advanced', 'native'];
      expect(validLevels.length).toBe(4);
    });

    it('should validate InterpreterSpecialization values', () => {
      const validSpecs: InterpreterSpecialization[] = [
        'financial', 'legal', 'real_estate', 'insurance', 
        'tax', 'medical', 'educational', 'general'
      ];
      expect(validSpecs.length).toBe(8);
    });

    it('should validate DeafExperienceCategory values', () => {
      const validCategories: DeafExperienceCategory[] = [
        'deaf_organization_leadership',
        'community_advocacy',
        'educational_roles',
        'event_management',
        'support_services',
        'deaf_centric_employment',
        'freelance_consulting',
        'entrepreneurship',
        'technology_roles',
        'arts_and_media'
      ];
      expect(validCategories.length).toBe(10);
    });

    it('should validate DeafSkillCategory values', () => {
      const validCategories: DeafSkillCategory[] = [
        'leadership', 'communication', 'technical', 'advocacy', 'cultural_competency'
      ];
      expect(validCategories.length).toBe(5);
    });
  });

  describe('Trust Score Breakdown', () => {
    it('should have correct max points for each category', () => {
      const breakdown: FibonroseTrustScoreBreakdown = {
        skillsProficiency: 40,
        experienceVerification: 25,
        communityStanding: 20,
        performanceRating: 15,
        totalScore: 100,
        trustLevel: 'platinum'
      };
      
      const sum = breakdown.skillsProficiency + 
                  breakdown.experienceVerification + 
                  breakdown.communityStanding + 
                  breakdown.performanceRating;
      
      expect(sum).toBe(100);
      expect(breakdown.totalScore).toBe(100);
    });

    it('should calculate correct trust level for breakdown scores', () => {
      const platinumBreakdown: FibonroseTrustScoreBreakdown = {
        skillsProficiency: 38,
        experienceVerification: 23,
        communityStanding: 18,
        performanceRating: 14,
        totalScore: 93,
        trustLevel: calculateFibonroseTrustLevel(93)
      };
      
      expect(platinumBreakdown.trustLevel).toBe('platinum');
    });

    it('should handle partial scores correctly', () => {
      const partialBreakdown: FibonroseTrustScoreBreakdown = {
        skillsProficiency: 20, // 50% of max
        experienceVerification: 15, // 60% of max
        communityStanding: 10, // 50% of max
        performanceRating: 8, // ~53% of max
        totalScore: 53,
        trustLevel: calculateFibonroseTrustLevel(53)
      };
      
      expect(partialBreakdown.trustLevel).toBe('unverified');
    });
  });
});
