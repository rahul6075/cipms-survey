import type { ColumnKind, Op } from "./types"

export type OpDef = {
  op: Op
  label: string
  needsValue: boolean
  needsValue2?: boolean
  input?: "text" | "number" | "date" | "enum" | "multienum"
}

const EMPTY: OpDef[] = [
  { op: "isEmpty", label: "is empty", needsValue: false },
  { op: "isNotEmpty", label: "is not empty", needsValue: false },
]

const TEXT: OpDef[] = [
  { op: "contains", label: "contains", needsValue: true, input: "text" },
  { op: "equals", label: "equals", needsValue: true, input: "text" },
  { op: "startsWith", label: "starts with", needsValue: true, input: "text" },
  { op: "endsWith", label: "ends with", needsValue: true, input: "text" },
  { op: "isAnyOf", label: "is any of (comma)", needsValue: true, input: "text" },
  ...EMPTY,
]

const NUMBER: OpDef[] = [
  { op: "eq", label: "=", needsValue: true, input: "number" },
  { op: "ne", label: "≠", needsValue: true, input: "number" },
  { op: "gt", label: ">", needsValue: true, input: "number" },
  { op: "gte", label: "≥", needsValue: true, input: "number" },
  { op: "lt", label: "<", needsValue: true, input: "number" },
  { op: "lte", label: "≤", needsValue: true, input: "number" },
  { op: "between", label: "between", needsValue: true, needsValue2: true, input: "number" },
  ...EMPTY,
]

const DATE: OpDef[] = [
  { op: "eq", label: "on", needsValue: true, input: "date" },
  { op: "ne", label: "not on", needsValue: true, input: "date" },
  { op: "lt", label: "before", needsValue: true, input: "date" },
  { op: "gt", label: "after", needsValue: true, input: "date" },
  { op: "lte", label: "on or before", needsValue: true, input: "date" },
  { op: "gte", label: "on or after", needsValue: true, input: "date" },
  { op: "between", label: "between", needsValue: true, needsValue2: true, input: "date" },
  ...EMPTY,
]

const ENUM: OpDef[] = [
  { op: "is", label: "is", needsValue: true, input: "enum" },
  { op: "isNot", label: "is not", needsValue: true, input: "enum" },
  { op: "isAnyOf", label: "is any of", needsValue: true, input: "multienum" },
  ...EMPTY,
]

const ARRAY_ENUM: OpDef[] = [
  { op: "includes", label: "includes", needsValue: true, input: "enum" },
  { op: "includesAnyOf", label: "includes any of", needsValue: true, input: "multienum" },
  { op: "includesAllOf", label: "includes all of", needsValue: true, input: "multienum" },
  ...EMPTY,
]

const BOOL: OpDef[] = [
  { op: "isTrue", label: "is true", needsValue: false },
  { op: "isFalse", label: "is false", needsValue: false },
]

export const OPS_BY_KIND: Record<ColumnKind, OpDef[]> = {
  text: TEXT, number: NUMBER, date: DATE, boolean: BOOL,
  enum: ENUM, arrayEnum: ARRAY_ENUM, custom: [],
}

export function opDef(kind: ColumnKind, op: Op): OpDef | undefined {
  return OPS_BY_KIND[kind]?.find((o) => o.op === op)
}

export function defaultOp(kind: ColumnKind): Op {
  switch (kind) {
    case "text": return "contains"
    case "number": return "eq"
    case "date": return "eq"
    case "boolean": return "isTrue"
    case "enum": return "is"
    case "arrayEnum": return "includes"
    default: return "contains"
  }
}
