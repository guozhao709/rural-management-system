import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_profiles' })
export class HealthProfile {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ fieldName: 'user_id', type: 'integer', unique: true }) userId!: number;
  @Property({ type: 'string', length: 20, nullable: true }) sex: string | null = null;
  @Property({ fieldName: 'birth_date', type: 'date', nullable: true }) birthDate: string | null = null;
  @Property({ fieldName: 'height_cm', type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: string | null = null;
  @Property({ fieldName: 'smoking_status', type: 'string', length: 20, nullable: true }) smokingStatus: string | null = null;
  @Property({ fieldName: 'drinking_status', type: 'string', length: 20, nullable: true }) drinkingStatus: string | null = null;
  @Property({ fieldName: 'exercise_status', type: 'string', length: 20, nullable: true }) exerciseStatus: string | null = null;
  @Property({ fieldName: 'sleep_status', type: 'string', length: 20, nullable: true }) sleepStatus: string | null = null;
  @Property({ fieldName: 'health_history', type: 'text', nullable: true }) healthHistory: string | null = null;
  @Property({ type: 'text', nullable: true }) allergies: string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt = new Date();
  @Property({ fieldName: 'updated_at', type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date() }) updatedAt = new Date();
}
