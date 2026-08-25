import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CropStatus } from '../agriculture.enums';
import { CropAlias } from './crop-alias.entity';
@Entity({ tableName: 'agriculture_crops' })
export class Crop {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ type: 'string', length: 64, unique: true }) code!: string;
  @Property({ type: 'string', length: 100, unique: true }) name!: string;
  @Property({ fieldName: 'scientific_name', type: 'string', length: 150, nullable: true })
  scientificName: string | null = null;
  @Property({ type: 'string', length: 16 }) status: CropStatus = CropStatus.Active;
  @OneToMany(() => CropAlias, (alias) => alias.crop) aliases = new Collection<CropAlias>(this);
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
  @Property({
    fieldName: 'updated_at',
    type: 'timestamptz',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();
}
