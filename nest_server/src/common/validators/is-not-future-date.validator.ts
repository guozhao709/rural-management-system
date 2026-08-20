import { registerDecorator } from 'class-validator';
import type { ValidationArguments, ValidationOptions } from 'class-validator';

export const IsNotFutureDate =
  (validationOptions?: ValidationOptions): PropertyDecorator =>
  (target, propertyKey) => {
    registerDecorator({
      name: 'isNotFutureDate',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && value <= new Date().toISOString().slice(0, 10);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must not be a future date`;
        },
      },
    });
  };
