import { useState } from 'react'
import { resolveGameLogo, gameColor, gameInitial } from '../lib/games'

interface Props {
  game: string
  size?: number
  // 管理后台里传的实际 logo（Storage 地址或历史静态图），优先于静态映射
  logoUrl?: string | null
}

export default function GameAvatar({ game, size = 28, logoUrl }: Props) {
  const src = resolveGameLogo(logoUrl, game)
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size, minWidth: size, fontSize: size * 0.42 }

  if (src && !failed) {
    return (
      <img
        className="game-avatar"
        src={src}
        alt={game}
        title={game}
        style={style}
        onError={() => setFailed(true)}
      />
    )
  }
  // 兜底：首字母圆形头像（图片没放或加载失败时）
  return (
    <span className="game-avatar fallback" style={{ ...style, background: gameColor(game) }} title={game}>
      {gameInitial(game)}
    </span>
  )
}
