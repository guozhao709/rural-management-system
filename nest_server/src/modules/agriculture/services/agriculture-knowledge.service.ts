/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { EntityRepository } from '@mikro-orm/core';
import { EntityManager, QueryOrder } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Admin } from '../../admins/admin.entity';
import { KnowledgeStatus } from '../agriculture.enums';
import type { CreateKnowledgeDto, KnowledgeQueryDto } from '../dto/agriculture.dto';
import { AgricultureKnowledge } from '../entities/agriculture-knowledge.entity';
import { Crop } from '../entities/crop.entity';
@Injectable()
export class AgricultureKnowledgeService {
  constructor(
    @InjectRepository(AgricultureKnowledge)
    private readonly knowledge: EntityRepository<AgricultureKnowledge>,
    @InjectRepository(Crop) private readonly crops: EntityRepository<Crop>,
    private readonly em: EntityManager,
  ) {}
  private hash(dto: CreateKnowledgeDto) {
    return createHash('sha256').update(`${dto.title}\n${dto.content}`).digest('hex');
  }
  async create(dto: CreateKnowledgeDto, admin: Admin) {
    const now = new Date();
    const entity = this.knowledge.create(
      {
        title: dto.title,
        summary: dto.summary ?? null,
        content: dto.content,
        category: dto.category,
        tags: dto.tags ?? [],
        regionCodes: dto.regionCodes ?? [],
        isGeneral: dto.isGeneral ?? false,
        sourceName: dto.sourceName ?? null,
        sourceUrl: dto.sourceUrl ?? null,
        validUntil: dto.validUntil ?? null,
        contentHash: this.hash(dto),
        createdBy: admin,
        updatedBy: admin,
        status: KnowledgeStatus.Draft,
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    await this.setCrops(entity, dto.cropIds);
    await this.em.flush();
    return entity;
  }
  async update(id: number, dto: CreateKnowledgeDto, admin: Admin) {
    const entity = await this.getAdmin(id);
    if (entity.status === KnowledgeStatus.Archived)
      throw new BadRequestException('已归档知识不可编辑');
    const hash = this.hash(dto);
    if (hash !== entity.contentHash) entity.version++;
    this.knowledge.assign(entity, {
      ...dto,
      summary: dto.summary ?? null,
      sourceName: dto.sourceName ?? null,
      sourceUrl: dto.sourceUrl ?? null,
      validUntil: dto.validUntil ?? null,
      contentHash: hash,
      updatedBy: admin,
    } as any);
    await this.setCrops(entity, dto.cropIds);
    await this.em.flush();
    return entity;
  }
  async publish(id: number, admin: Admin) {
    const entity = await this.getAdmin(id);
    if (entity.status !== KnowledgeStatus.Draft) throw new BadRequestException('仅草稿可以发布');
    if (!entity.sourceName || (!entity.isGeneral && entity.crops.count() === 0))
      throw new BadRequestException('发布需要来源和适用作物或通用标记');
    entity.status = KnowledgeStatus.Published;
    entity.publishedBy = admin;
    entity.publishedAt = new Date();
    await this.em.flush();
    return entity;
  }
  async archive(id: number, admin: Admin) {
    const entity = await this.getAdmin(id);
    if (entity.status !== KnowledgeStatus.Published)
      throw new BadRequestException('仅已发布知识可以归档');
    entity.status = KnowledgeStatus.Archived;
    entity.updatedBy = admin;
    await this.em.flush();
    return entity;
  }
  async remove(id: number) {
    const entity = await this.getAdmin(id);
    entity.deletedAt = new Date();
    await this.em.flush();
  }
  async list(query: KnowledgeQueryDto, publishedOnly: boolean) {
    const where: any = { deletedAt: null };
    if (publishedOnly) {
      where.status = KnowledgeStatus.Published;
      where.$and = [
        {
          $or: [
            { validUntil: null },
            { validUntil: { $gte: new Date().toISOString().slice(0, 10) } },
          ],
        },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.cropId) where.crops = query.cropId;
    if (query.keyword)
      where.$or = [
        { title: { $ilike: `%${query.keyword}%` } },
        { content: { $ilike: `%${query.keyword}%` } },
      ];
    if (query.tag) where.tags = { $overlap: [query.tag] };
    if (query.regionCode) where.regionCodes = { $overlap: [query.regionCode] };
    const [list, total] = await this.knowledge.findAndCount(where, {
      populate: ['crops'],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { publishedAt: QueryOrder.DESC },
    });
    return { list, total, page: query.page, pageSize: query.pageSize };
  }
  async findPublished(id: number) {
    const entity = await this.knowledge.findOne(
      { id, status: KnowledgeStatus.Published, deletedAt: null },
      { populate: ['crops'] },
    );
    if (!entity || (entity.validUntil && entity.validUntil < new Date().toISOString().slice(0, 10)))
      throw new NotFoundException('农业知识不存在');
    return entity;
  }
  async getAdmin(id: number) {
    const entity = await this.knowledge.findOne({ id, deletedAt: null }, { populate: ['crops'] });
    if (!entity) throw new NotFoundException('农业知识不存在');
    return entity;
  }
  private async setCrops(entity: AgricultureKnowledge, ids: number[] | undefined) {
    if (ids === undefined) return;
    const crops = ids.length ? await this.crops.find({ id: { $in: ids } }) : [];
    if (crops.length !== ids.length) throw new ConflictException('存在无效作物');
    entity.crops.set(crops);
  }
}
