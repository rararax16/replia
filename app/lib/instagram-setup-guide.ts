export type InstagramSetupStep = {
  id: string
  title: string
  description: string
  details: string[]
}

export const instagramSetupNotes = [
  '切り替え操作は Instagram アプリから行うのが確実です。',
  'プロアカウントは公開アカウントとして運用されます。非公開設定のままでは利用できません。',
  'Meta 連携を安定させるため、Facebook ページも接続しておくことを推奨します。'
]

export const instagramSetupSteps: InstagramSetupStep[] = [
  {
    id: 'open-settings',
    title: 'Instagram アプリで設定画面を開く',
    description: '対象の Instagram アカウントにログインし、プロフィール右上のメニューから設定を開きます。',
    details: [
      'プロフィール画面を開く',
      '右上の三本線メニューをタップする',
      '「設定とアクティビティ」または近い名前のメニューを開く'
    ]
  },
  {
    id: 'switch-professional',
    title: 'プロアカウントへ切り替える',
    description: 'アカウント種別の設定から、プロアカウントへの切り替えを進めます。',
    details: [
      '「アカウントの種類とツール」を開く',
      '「プロアカウントに切り替える」を選ぶ',
      'カテゴリを選択して次へ進む'
    ]
  },
  {
    id: 'select-business',
    title: '種別は「ビジネス」を選ぶ',
    description: 'Replia では店舗・企業向け運用を前提にしているため、ビジネスアカウントを案内します。',
    details: [
      'アカウント種別で「ビジネス」を選ぶ',
      '必要に応じて連絡先情報を入力する',
      'プロフィールが公開設定になっていることを確認する'
    ]
  },
  {
    id: 'connect-facebook-page',
    title: '必要なら Facebook ページも接続する',
    description: 'DM やコメント運用、Meta 側の権限付与で詰まりにくくするため、Facebook ページ接続を推奨します。',
    details: [
      'Instagram 側の案内に従って Facebook ページを選択する',
      '未作成なら Facebook ページを先に作成する',
      '接続後、Instagram のプロフィールに戻って設定が反映されているか確認する'
    ]
  },
  {
    id: 'connect-replia',
    title: 'Replia に戻って連携する',
    description: '準備が済んだら、この管理画面から Meta 認証を実行して連携します。',
    details: [
      'この画面の「Instagram と連携する」を押す',
      'Meta の認可画面で対象アカウントを選ぶ',
      '連携後に一覧へ表示されれば完了'
    ]
  }
]

export const instagramSetupOfficialLinks = [
  {
    label: 'プロアカウントについて',
    href: 'https://www.facebook.com/help/instagram/138925576505882'
  },
  {
    label: 'Facebook ページ接続について',
    href: 'https://www.facebook.com/help/instagram/790156881117411'
  }
]
