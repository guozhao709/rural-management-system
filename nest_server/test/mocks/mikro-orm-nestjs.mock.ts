import { Inject, Module } from '@nestjs/common';
import type { DynamicModule, Type } from '@nestjs/common';

const entityName = (entity: Type<unknown> | string): string =>
  typeof entity === 'string' ? entity : entity.name;

export const getRepositoryToken = (entity: Type<unknown> | string): string =>
  `${entityName(entity)}Repository`;

export const InjectRepository = (entity: Type<unknown> | string): ParameterDecorator =>
  Inject(getRepositoryToken(entity));

@Module({})
export class MikroOrmModule {
  static forFeature(): DynamicModule {
    return { module: MikroOrmModule };
  }
}
