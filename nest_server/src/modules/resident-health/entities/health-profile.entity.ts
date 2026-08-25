import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_profiles' })
export class HealthProfile {
  @PrimaryKey({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ fieldName: 'medical_history_ciphertext', type: 'json', nullable: true })
  medicalHistoryCiphertext: object | null = null;
  @Property({ fieldName: 'allergies_ciphertext', type: 'json', nullable: true })
  allergiesCiphertext: object | null = null;
  @Property({ fieldName: 'special_population_ciphertext', type: 'json', nullable: true })
  specialPopulationCiphertext: object | null = null;
  @Property({ fieldName: 'key_version', type: 'string', length: 100, nullable: true }) keyVersion:
    string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt: Date = new Date();
  @Property({
    fieldName: 'updated_at',
    type: 'timestamptz',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
