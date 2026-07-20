import { useState, useEffect, useCallback, useRef } from 'react'
import { marked } from 'marked'
import './JournalView.css'

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function JournalView(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()))
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedDateRef = useRef(selectedDate)

  // 加载日记
  const load = useCallback(async (date: string) => {
    setLoading(true)
    setSaved(false)
    const entry = await window.api.db.journalGet(date)
    setContent(entry?.content ?? '')
    lastSavedDateRef.current = date
    setLoading(false)
  }, [])

  useEffect(() => {
    load(selectedDate)
  }, [selectedDate, load])

  // 防抖自动保存：编辑后 1.5 秒自动保存
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      setSaved(false)
      await window.api.db.journalUpsert(selectedDate, content)
      setSaving(false)
      setSaved(true)
    }, 1500)
  }, [selectedDate, content])

  // 手动保存 (Ctrl+S)
  const handleManualSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setSaving(true)
    setSaved(false)
    await window.api.db.journalUpsert(selectedDate, content)
    setSaving(false)
    setSaved(true)
  }, [selectedDate, content])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleManualSave])

  // 切换日期前保存当前内容
  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    // 立即保存当前内容
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    await window.api.db.journalUpsert(selectedDate, content)
    setSelectedDate(newDate)
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setSaved(false)
    scheduleSave()
  }

  const goToday = () => {
    setSelectedDate(fmtDate(new Date()))
  }

  // Markdown 渲染为 HTML
  const renderedHtml = content
    ? (marked.parse(content, { async: false }) as string)
    : '<p class="journal-preview__placeholder">写点什么吧...</p>'

  const isToday = selectedDate === fmtDate(new Date())

  return (
    <div className="journal">
      {/* 顶部栏 */}
      <div className="journal__toolbar">
        <input
          type="date"
          className="journal__datepicker"
          value={selectedDate}
          onChange={handleDateChange}
          title="选择日记日期"
        />
        <button className="journal__today-btn" onClick={goToday} title="回到今天">
          今天
        </button>
        <div className="journal__spacer" />
        {saving ? (
          <span className="journal__status">保存中...</span>
        ) : saved ? (
          <span className="journal__status journal__status--saved">已保存</span>
        ) : null}
        <button className="journal__save-btn" onClick={handleManualSave}>
          💾 保存
        </button>
      </div>

      {loading ? (
        <div className="journal__loading">加载中…</div>
      ) : (
        <div className="journal__editor">
          {/* 左侧：Markdown 编辑区 */}
          <div className="journal__input-panel">
            <div className="journal__panel-header">📝 编辑</div>
            <textarea
              className="journal__textarea"
              value={content}
              onChange={handleInput}
              placeholder={isToday ? '记录今天的学习心得...# 标题\n- 列表\n**加粗**' : '这天没有日记，写点什么吧...'}
            />
          </div>
          {/* 右侧：Markdown 预览区 */}
          <div className="journal__preview-panel">
            <div className="journal__panel-header">👁️ 预览</div>
            <div
              className="journal__preview"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
