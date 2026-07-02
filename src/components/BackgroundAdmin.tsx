import { useEffect, useState } from 'react'
import { App as AntdApp, Button, Card, Slider, Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { setBackgroundPosition, setLightBackground, uploadBackground } from '../lib/settings'

interface Props {
  userId: string
  lightBgUrl: string | null
  lightBgPosition: number
  onChanged: () => void
}

export default function BackgroundAdmin({ userId, lightBgUrl, lightBgPosition, onChanged }: Props) {
  const { message } = AntdApp.useApp()
  const [uploading, setUploading] = useState(false)
  // 拖动滑块时先只改本地预览，松手才写数据库，避免拖动过程里疯狂请求
  const [previewPosition, setPreviewPosition] = useState(lightBgPosition)

  useEffect(() => {
    setPreviewPosition(lightBgPosition)
  }, [lightBgPosition])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadBackground(userId, file)
      await setLightBackground(userId, url)
      message.success('背景已更新')
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
    return false // 阻止 antd 自动上传，我们自己控制上传流程
  }

  async function handleRemove() {
    try {
      await setLightBackground(userId, null)
      message.success('已恢复默认背景')
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    }
  }

  async function handlePositionCommit(value: number) {
    try {
      await setBackgroundPosition(userId, value)
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Card title="亮色模式背景" style={{ marginBottom: 16 }}>
      <div className="muted small" style={{ marginBottom: 12 }}>
        上传一张喜欢的图片，切换到亮色模式时会显示为背景。
        <br />
        建议尺寸 1920×1080 或更大（横版/竖版都可以，配合下面的位置滑块调整），图片太小会被拉伸模糊。
      </div>
      <Upload
        listType="picture-card"
        showUploadList={false}
        disabled={uploading}
        beforeUpload={handleUpload}
      >
        {lightBgUrl ? (
          <img src={lightBgUrl} alt="背景预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>
            <PlusOutlined /> 上传
          </span>
        )}
      </Upload>

      {lightBgUrl && (
        <>
          <div
            style={{
              marginTop: 16,
              height: 160,
              borderRadius: 8,
              backgroundImage: `url(${lightBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `50% ${previewPosition}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="muted small" style={{ margin: '8px 0 4px' }}>
            拖动调整图片露出的部分：拖到最左显示图片顶部，拖到最右显示图片底部（比如脸被裁掉了就往左拖）
          </div>
          <Slider
            min={0}
            max={100}
            value={previewPosition}
            onChange={setPreviewPosition}
            onChangeComplete={handlePositionCommit}
          />
          <Button danger onClick={handleRemove}>
            恢复默认背景
          </Button>
        </>
      )}
    </Card>
  )
}
