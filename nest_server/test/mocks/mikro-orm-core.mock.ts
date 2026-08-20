export class EntityManager {}

export enum QueryOrder {
  DESC = 'desc',
}

export enum LockMode {
  PESSIMISTIC_WRITE = 'pessimistic_write',
}

export class UniqueConstraintViolationException extends Error {}
