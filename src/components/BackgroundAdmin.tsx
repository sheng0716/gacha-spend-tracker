import { useCallback, useEffect, useState } from 'react'
import { App as AntdApp, Button, Image, Popconfirm, Slider, Space, Upload } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import {
  type BackgroundHistoryItem,
  deleteBackgroundFile,
  listBackgroundHistory,
  setBackgroundPosition,
  setLightBackground,
  uploadBackground,
} from '../lib/settings'

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
  const [history, setHistory] = useState<BackgroundHistoryItem[]>([])
  const [busyPath, setBusyPath] = useState<string | null>(null)

  useEffect(() => {
    setPreviewPosition(lightBgPosition)
  }, [lightBgPosition])

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await listBackgroundHistory(userId))
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    }
  }, [userId, message])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }
    setUploading(true)
    try {
      const url = await uploadBackground(userId, file)
      await setLightBackground(userId, url)
      message.success('背景已更新')
      onChanged()
      await refreshHistory()
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

  async function handleRestore(item: BackgroundHistoryItem) {
    setBusyPath(item.path)
    try {
      await setLightBackground(userId, item.url)
      message.success('已切换回这张背景')
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyPath(null)
    }
  }

  async function handleDeleteHistory(item: BackgroundHistoryItem) {
    setBusyPath(item.path)
    try {
      await deleteBackgroundFile(item.path)
      // 删的正好是当前在用的那张，恢复默认背景，避免指向一个已经不存在的文件
      if (item.url === lightBgUrl) {
        await setLightBackground(userId, null)
        onChanged()
      }
      message.success('已删除')
      await refreshHistory()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyPath(null)
    }
  }

  return (
    <div>
      <div className="muted small" style={{ marginBottom: 12 }}>
        上传一张喜欢的图片，切换到亮色模式时会显示为背景。
        <br />
        建议尺寸 1920×1080 或更大（横版/竖版都可以，配合下面的位置滑块调整），图片太小会被拉伸模糊。
      </div>
      <Upload
        listType="picture-card"
        showUploadList={false}
        disabled={uploading}
        accept="image/*"
        beforeUpload={handleUpload}
        className="bg-uploader"
      >
        {lightBgUrl ? (
          // 已有背景时，图片上叠一层 hover 才显示的「点击更换」遮罩，明确告诉用户这里可以点
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img src={lightBgUrl} alt="背景预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="bg-uploader-overlay">
              <UploadOutlined />
              <span>点击更换</span>
            </div>
          </div>
        ) : (
          <span>
            <PlusOutlined /> 上传背景
          </span>
        )}
      </Upload>
      <div className="muted small" style={{ marginTop: 6 }}>
        {lightBgUrl ? '点上方图片可更换背景。' : '点上方方框选择一张图片作为背景。'}
      </div>

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

      {history.length > 0 && (
        <>
          <div className="muted small" style={{ margin: '20px 0 8px' }}>
            历史背景（{history.length} 张，包含已替换掉的，可以切换回去或者彻底删除）
          </div>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {history.map((item) => {
                const isCurrent = item.url === lightBgUrl
                const busy = busyPath === item.path
                return (
                  <div
                    key={item.path}
                    style={{
                      width: 120,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: isCurrent ? '2px solid var(--ant-color-primary, #722ed1)' : '1px solid var(--ant-color-border, #d9d9d9)',
                    }}
                  >
                    <Image
                      src={item.url}
                      width={120}
                      height={80}
                      style={{ objectFit: 'cover' }}
                      alt="历史背景"
                    />
                    <div style={{ padding: 6 }}>
                    {isCurrent ? (
                      <div className="muted small" style={{ textAlign: 'center' }}>
                        使用中
                      </div>
                    ) : (
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Button size="small" block loading={busy} onClick={() => handleRestore(item)}>
                          设为当前
                        </Button>
                        <Popconfirm
                          title="删除这张历史背景？"
                          description="删除后无法恢复"
                          onConfirm={() => handleDeleteHistory(item)}
                        >
                          <Button size="small" danger block loading={busy}>
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Image.PreviewGroup>
        </>
      )}
    </div>
  )
}
