import { useState, useEffect } from 'react'
import './SettingsModal.css'

interface Props {
  visible: boolean
  onClose: () => void
}

export function SettingsModal({ visible, onClose }: Props): JSX.Element | null {
  const [dataPath, setDataPath] = useState('')
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (visible) {
      window.api.db.getDataPath().then((p) => {
        setDataPath(p)
        setPendingPath(null)
        setStatus('idle')
        setErrorMsg('')
      })
      setClosing(false)
    }
  }, [visible])

  const doClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 180)
  }

  if (!visible && !closing) return null

  const displayPath = pendingPath ?? dataPath

  const handlePick = async (): Promise<void> => {
    const picked = await window.api.db.pickDataPath()
    if (picked) {
      setPendingPath(picked)
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!pendingPath || pendingPath === dataPath) {
      doClose()
      return
    }
    setStatus('saving')
    const ok = await window.api.db.setDataPath(pendingPath)
    if (ok) {
      setStatus('saved')
      setDataPath(pendingPath)
      setPendingPath(null)
      setTimeout(() => doClose(), 800)
    } else {
      setStatus('error')
      setErrorMsg('切换失败，请检查目标路径是否有写入权限')
    }
  }

  return (
    <div
      className={`settings-overlay ${closing ? 'settings-overlay--closing' : ''}`}
      onClick={doClose}
    >
      <div
        className={`settings-modal glass ${closing ? 'settings-modal--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="settings-modal__title">⚙️ 设置</h2>

        <div className="settings-modal__section">
          <label className="settings-modal__label">数据存储位置</label>
          <p className="settings-modal__desc">
            默认在 C 盘 AppData，可改为其他盘目录。现有数据会自动迁移。
          </p>
          <div className="settings-modal__path-row">
            <input
              className="settings-modal__path-input"
              value={displayPath}
              readOnly
            />
            <button className="settings-modal__btn" onClick={handlePick}>
              📁 选择文件夹
            </button>
          </div>
          {pendingPath && pendingPath !== dataPath && (
            <p className="settings-modal__hint">已选新路径：{pendingPath}</p>
          )}
        </div>

        {status === 'error' && (
          <p className="settings-modal__error">❌ {errorMsg}</p>
        )}
        {status === 'saved' && (
          <p className="settings-modal__success">✅ 已保存，下次启动生效</p>
        )}

        <div className="settings-modal__actions">
          <button className="settings-modal__btn settings-modal__btn--secondary" onClick={doClose}>
            取消
          </button>
          <button
            className="settings-modal__btn settings-modal__btn--primary"
            disabled={!pendingPath || pendingPath === dataPath || status === 'saving'}
            onClick={handleSave}
          >
            {status === 'saving' ? '迁移中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
