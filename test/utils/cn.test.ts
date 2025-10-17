import { describe, it, expect } from 'vitest';
import { cn } from '../../client/src/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-4 py-2', 'bg-blue-500');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).toContain('bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class');
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
  });

  it('should ignore false conditional classes', () => {
    const result = cn('base-class', false && 'hidden-class');
    expect(result).toContain('base-class');
    expect(result).not.toContain('hidden-class');
  });

  it('should merge conflicting tailwind classes', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toContain('px-6');
    expect(result).not.toContain('px-4');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
