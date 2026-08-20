import { describe, expect, it } from 'vitest';
import { defaultFormConfig } from './form-config';

describe('defaultFormConfig', () => {
  it('starts new forms with the five editable auto-body intake steps', () => {
    expect(defaultFormConfig.steps.map((step) => step.heading)).toEqual([
      'WHERE WAS YOUR VEHICLE DAMAGED?',
      'VEHICLE YEAR, MAKE, MODEL',
      'HOW DO YOU PLAN ON PAYING FOR THE REPAIRS?',
      'WHICH INSURANCE COMPANY?',
      'THIS IS THE LAST STEP!',
    ]);

    const [damage, vehicle, payment, insurance, contact] = defaultFormConfig.steps;

    expect(damage.fields[0]).toMatchObject({
      type: 'checkbox-group',
      label: 'Damage Areas',
      hideLabel: true,
      required: true,
    });
    expect(damage.fields[0].options?.map((option) => option.label)).toEqual([
      'Front',
      'Side',
      'Rear',
      'Wheel(s)',
      'Roof',
      'Underbody',
      'Other',
    ]);

    expect(vehicle.fields[0]).toMatchObject({
      type: 'text',
      label: 'Vehicle Year, Make, Model',
      hideLabel: true,
      required: true,
    });

    expect(payment.fields[0]).toMatchObject({
      type: 'radio',
      label: 'Payment Method',
      hideLabel: true,
      required: true,
    });
    expect(payment.fields[0].options?.map((option) => option.label)).toEqual([
      'My own insurance',
      'Insurance of the person who hit me',
      "Out of pocket (you're paying)",
      'Not sure yet (we can guide you)',
    ]);

    expect(insurance.fields[0]).toMatchObject({
      type: 'text',
      label: 'Insurance Company',
      hideLabel: true,
      required: false,
    });

    expect(contact.fields).toMatchObject([
      { type: 'text', label: 'First and Last Name', required: true },
      { type: 'phone', label: 'Your Cell Phone Number', required: true },
    ]);

    const stepIds = defaultFormConfig.steps.map((step) => step.id);
    const fieldIds = defaultFormConfig.steps.flatMap((step) =>
      step.fields.map((field) => field.id)
    );
    expect(new Set(stepIds).size).toBe(stepIds.length);
    expect(new Set(fieldIds).size).toBe(fieldIds.length);
  });
});
