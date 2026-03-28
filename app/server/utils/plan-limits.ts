import { UserPlan } from '@prisma/client'

// ユーザー獲得フェーズ: Freeプランを緩和中
// Pro実装時は FREE を { replyLimit: 20, ruleLimit: 2 } に戻す
export const PLAN_LIMITS: Record<UserPlan, { replyLimit: number; ruleLimit: number | null }> = {
  FREE: { replyLimit: 100, ruleLimit: 5 },
  PRO: { replyLimit: 3000, ruleLimit: null }
}
