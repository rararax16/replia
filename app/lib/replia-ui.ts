import type { EventChannel, ReplyStatus } from '@prisma/client'

export type StatusBadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline'

export function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP')
}

export function getChannelLabel(channel: EventChannel) {
  return channel === 'COMMENT' ? 'コメント' : 'DM'
}

export function getReplyStatusLabel(status?: ReplyStatus) {
  switch (status) {
    case 'SENT':
      return '送信済み'
    case 'FAILED':
      return '失敗'
    case 'SKIPPED':
      return 'スキップ'
    case 'STUBBED':
      return 'テスト返信'
    default:
      return '未処理'
  }
}

export function getReplyStatusVariant(status?: ReplyStatus): StatusBadgeVariant {
  switch (status) {
    case 'SENT':
      return 'default'
    case 'FAILED':
      return 'destructive'
    case 'SKIPPED':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function getInstagramProfileUrl(senderUsername: string) {
  return `https://www.instagram.com/${encodeURIComponent(senderUsername.trim())}/`
}
