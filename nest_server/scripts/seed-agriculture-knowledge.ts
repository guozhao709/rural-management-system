import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';
import { AccountStatus } from '../src/common/enums/account-status.enum';
import { Admin } from '../src/modules/admins/admin.entity';
import { KnowledgeStatus } from '../src/modules/agriculture/agriculture.enums';
import { AgricultureKnowledge } from '../src/modules/agriculture/entities/agriculture-knowledge.entity';
import { Crop } from '../src/modules/agriculture/entities/crop.entity';

interface KnowledgeSeed { cropName: string; summary: string; sourceCodes: string; sourceUrl: string; }

const sourceUrlPattern = /^- \*\*(S\d+)（[^）]+）\*\*.*：(https:\/\/\S+)$/;
const tableRowPattern = /^\| ([^|]+) \| ([^|]+) \| (S\d+(?:、S\d+)*) \|$/;

const loadSeed = async (): Promise<KnowledgeSeed[]> => {
  const document = await readFile(path.join(process.cwd(), 'docs', 'M08', '农业知识种子来源与摘要.md'), 'utf8');
  const sources = new Map<string, string>();
  const entries: KnowledgeSeed[] = [];
  for (const line of document.split(/\r?\n/)) {
    const source = sourceUrlPattern.exec(line);
    if (source) { sources.set(source[1], source[2]); continue; }
    const row = tableRowPattern.exec(line);
    if (!row) continue;
    const sourceCode = row[3].split('、')[0];
    const sourceUrl = sources.get(sourceCode);
    if (!sourceUrl) throw new Error(`Missing URL for ${sourceCode}`);
    entries.push({ cropName: row[1], summary: row[2], sourceCodes: row[3], sourceUrl });
  }
  if (entries.length !== 50) throw new Error(`Expected 50 knowledge entries, found ${entries.length}`);
  return entries;
};

const main = async (): Promise<void> => {
  const seed = await loadSeed();
  const orm = await MikroORM.init(config);
  try {
    const em = orm.em.fork();
    const admins = em.getRepository(Admin);
    const crops = em.getRepository(Crop);
    const knowledge = em.getRepository(AgricultureKnowledge);
    const admin = await admins.findOne({ status: AccountStatus.Active, deletedAt: null });
    if (!admin) throw new Error('An active admin is required before seeding published agricultural knowledge.');
    for (const item of seed) {
      const crop = await crops.findOne({ name: item.cropName });
      if (!crop) throw new Error(`Crop not found: ${item.cropName}`);
      const title = `${item.cropName}：基础田间管理与风险提示`;
      const content = `${item.summary}\n\n安全边界：本条为公开基础管理建议，不含农药剂量或安全间隔期。具体措施应以当地农技部门、登记标签、土壤检测和实时天气为准。`;
      const contentHash = createHash('sha256').update(`${title}\n${content}`).digest('hex');
      if (await knowledge.findOne({ contentHash, deletedAt: null })) continue;
      const now = new Date();
      const entity = knowledge.create({ title, summary: item.summary, content, category: '种植管理', tags: ['田间管理', '风险提示', '绿色防控'], regionCodes: [], isGeneral: false, sourceName: `农业农村部/全国农技中心技术指导意见（${item.sourceCodes}）`, sourceUrl: item.sourceUrl, status: KnowledgeStatus.Published, version: 1, contentHash, createdBy: admin, updatedBy: admin, publishedBy: admin, publishedAt: now, createdAt: now, updatedAt: now }, { partial: true });
      entity.crops.set([crop]);
    }
    await em.flush();
    process.stdout.write(`Agriculture knowledge seed completed: ${seed.length} source entries processed.\n`);
  } finally { await orm.close(true); }
};

void main().catch((error: unknown) => { process.stderr.write(`Failed to seed agriculture knowledge: ${error instanceof Error ? error.message : 'Unknown error'}\n`); process.exitCode = 1; });
