import fixtures from '@/data/cases.json';
import { SyntheticCaseSchema } from '@/server/synthetic-case';
export const cases = SyntheticCaseSchema.array().parse(fixtures);
