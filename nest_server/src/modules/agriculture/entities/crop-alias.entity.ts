import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Crop } from './crop.entity';
@Entity({ tableName: 'agriculture_crop_aliases' })
@Index({ properties: ['crop'] })
export class CropAlias {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @ManyToOne(() => Crop, { fieldName: 'crop_id', deleteRule: 'restrict' }) crop!: Crop;
  @Property({ type: 'string', length: 100 }) alias!: string;
  @Property({ fieldName: 'normalized_alias', type: 'string', length: 100, unique: true })
  normalizedAlias!: string;
}
