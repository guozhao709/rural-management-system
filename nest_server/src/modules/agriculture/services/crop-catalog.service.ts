import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { EntityRepository } from '@mikro-orm/core';
import { EntityManager, QueryOrder } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { CropStatus } from '../agriculture.enums';
import { CropAlias } from '../entities/crop-alias.entity';
import { Crop } from '../entities/crop.entity';
import type {
  CreateAliasDto,
  CreateCropDto,
  CropQueryDto,
  UpdateCropDto,
} from '../dto/agriculture.dto';
import { normalizeCropAlias } from './crop-normalization';
export { normalizeCropAlias } from './crop-normalization';
@Injectable()
export class CropCatalogService {
  constructor(
    @InjectRepository(Crop) private readonly crops: EntityRepository<Crop>,
    @InjectRepository(CropAlias) private readonly aliases: EntityRepository<CropAlias>,
    private readonly em: EntityManager,
  ) {}
  async list(query: CropQueryDto, activeOnly = true) {
    const where: any = activeOnly ? { status: CropStatus.Active } : {};
    if (query.keyword)
      where.$or = [
        { name: { $ilike: `%${query.keyword.trim()}%` } },
        { aliases: { alias: { $ilike: `%${query.keyword.trim()}%` } } },
      ];
    const [list, total] = await this.crops.findAndCount(where, {
      populate: ['aliases'],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { name: QueryOrder.ASC },
    });
    return { list, total, page: query.page, pageSize: query.pageSize };
  }
  async create(dto: CreateCropDto) {
    if (await this.crops.findOne({ code: dto.code })) throw new ConflictException('作物编码已存在');
    const entity = this.crops.create(
      {
        code: dto.code,
        name: dto.name,
        scientificName: dto.scientificName ?? null,
        status: CropStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
    await this.em.flush();
    return entity;
  }
  async update(id: number, dto: UpdateCropDto) {
    const crop = await this.get(id);
    this.crops.assign(crop, dto as any);
    await this.em.flush();
    return crop;
  }
  async addAlias(cropId: number, dto: CreateAliasDto) {
    const crop = await this.get(cropId);
    const normalizedAlias = normalizeCropAlias(dto.alias);
    if (await this.aliases.findOne({ normalizedAlias }))
      throw new ConflictException('作物别名已存在');
    const alias = this.aliases.create({ crop, alias: dto.alias.trim(), normalizedAlias });
    await this.em.flush();
    return alias;
  }
  async removeAlias(cropId: number, aliasId: number) {
    const alias = await this.aliases.findOne({ id: aliasId, crop: cropId });
    if (!alias) throw new NotFoundException('作物别名不存在');
    this.em.remove(alias);
    await this.em.flush();
  }
  async resolve(id: number) {
    const crop = await this.crops.findOne({ id, status: CropStatus.Active });
    if (!crop) throw new NotFoundException('作物不存在或已停用');
    return crop;
  }
  private async get(id: number) {
    const crop = await this.crops.findOne({ id });
    if (!crop) throw new NotFoundException('作物不存在');
    return crop;
  }
}
