import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000'
const EMAIL_FROM = process.env.EMAIL_FROM || 'Replia <noreply@replia.jp>'

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_BASE_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '【Replia】メールアドレスの確認',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">メールアドレスの確認</h1>
        <p style="font-size: 14px; line-height: 1.8; color: #374151; margin-bottom: 24px;">
          Replia へのご登録ありがとうございます。<br>
          以下のボタンをクリックして、メールアドレスの確認を完了してください。
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          メールアドレスを確認する
        </a>
        <p style="font-size: 12px; line-height: 1.8; color: #9ca3af; margin-top: 24px;">
          このリンクは24時間有効です。<br>
          ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください。
        </p>
        <p style="font-size: 12px; word-break: break-all; color: #6b7280;">${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 11px; color: #9ca3af;">
          このメールに心当たりがない場合は、無視してください。
        </p>
      </div>
    `
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_BASE_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '【Replia】パスワードのリセット',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">パスワードのリセット</h1>
        <p style="font-size: 14px; line-height: 1.8; color: #374151; margin-bottom: 24px;">
          パスワードリセットのリクエストを受け付けました。<br>
          以下のボタンをクリックして、新しいパスワードを設定してください。
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          パスワードをリセットする
        </a>
        <p style="font-size: 12px; line-height: 1.8; color: #9ca3af; margin-top: 24px;">
          このリンクは24時間有効です。<br>
          ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください。
        </p>
        <p style="font-size: 12px; word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 11px; color: #9ca3af;">
          このメールに心当たりがない場合は、無視してください。パスワードは変更されません。
        </p>
      </div>
    `
  })
}
