import { currencyFlagUrl } from '../lib/currency'

// 币种旗帜 + 代码，如 🇯🇵 JPY（用真实图标而非 emoji，避免 Windows 上显示成字母）
export default function CurrencyFlag({ code }: { code: string }) {
  const url = currencyFlagUrl(code)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {url && (
        <img
          src={url}
          alt=""
          width={16}
          height={12}
          style={{ objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
        />
      )}
      {code}
    </span>
  )
}
