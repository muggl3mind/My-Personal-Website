import { describe, it, expect } from 'vitest';
import { normalizeForRefusalCompare, REFUSAL_SENTENCE } from '../index';

describe('normalizeForRefusalCompare', () => {
  it('returns input unchanged when already canonical', () => {
    expect(normalizeForRefusalCompare('hello world')).toBe('hello world');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalizeForRefusalCompare('  hi  ')).toBe('hi');
  });

  it('converts curly single quotes to straight', () => {
    expect(normalizeForRefusalCompare('I\u2019ve got it')).toBe("I've got it");
  });

  it('converts curly double quotes to straight', () => {
    expect(normalizeForRefusalCompare('\u201Chello\u201D')).toBe('"hello"');
  });

  it('converts non-breaking space to regular space', () => {
    expect(normalizeForRefusalCompare('a\u00A0b')).toBe('a b');
  });

  it('detects the refusal sentence even with non-breaking spaces', () => {
    const variant =
      "I can only speak to my work and\u00A0experience. For anything else, use the [contact form](/contact).";
    expect(normalizeForRefusalCompare(variant)).toBe(
      normalizeForRefusalCompare(REFUSAL_SENTENCE),
    );
  });
});
