import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  ColorField,
  NumberInput,
  Section,
  Select,
  Slider,
  TextInput,
  Toggle,
} from './controls';

describe('controls.tsx contract', () => {
  it('Section renders title and description', () => {
    const el = Section({ title: 'T', description: 'D', children: 'C' });
    expect(el.props.children[0].props.children).toBe('T');
  });

  it('Select emits string values via onChange', () => {
    const onChange = vi.fn();
    const el = Select({
      value: 'a',
      onChange,
      options: [{ value: 'a', label: 'A' }],
    });
    el.props.onChange({ target: { value: 'b' } } as React.ChangeEvent<HTMLSelectElement>);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('TextInput emits string values', () => {
    const onChange = vi.fn();
    const el = TextInput({ value: 'v', onChange, placeholder: 'p' });
    el.props.onChange({ target: { value: 'x' } } as React.ChangeEvent<HTMLInputElement>);
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('NumberInput emits numeric values', () => {
    const onChange = vi.fn();
    const el = NumberInput({ value: 1, onChange, min: 0, max: 10 });
    el.props.onChange({ target: { value: '5' } } as React.ChangeEvent<HTMLInputElement>);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('Toggle emits boolean values', () => {
    const onChange = vi.fn();
    const el = Toggle({ checked: false, onChange, label: 'L' });
    el.props.children[1].props.onCheckedChange(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('Slider emits numeric values and preserves unit', () => {
    const onChange = vi.fn();
    const el = Slider({ value: 10, onChange, min: 0, max: 100, label: 'L', unit: '%' });
    el.props.children[1].props.onChange({ target: { value: '42' } } as React.ChangeEvent<HTMLInputElement>);
    expect(onChange).toHaveBeenCalledWith(42);
    expect(el.props.children[0].props.children).toContain('%');
  });

  it('ColorField emits hex color strings unchanged', () => {
    const onChange = vi.fn();
    const el = ColorField({ label: 'C', value: '#00a86b', onChange });
    const input = el.props.children[1].props.children[0];
    input.props.onChange({
      target: { value: '#ff0000' },
    } as React.ChangeEvent<HTMLInputElement>);
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });
});
