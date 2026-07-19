import { useState, useRef, useEffect } from 'react'
import './PlanAddInput.css'

interface Props {
  onAdd: (title: string) => void
  placeholder?: string
}

export function PlanAddInput({ onAdd, placeholder = '添加新计划...' }: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const commit = (): void => {
    const trimmed = title.trim()
    if (trimmed) {
      onAdd(trimmed)
      setTitle('')
      setOpen(false)
    } else {
      setOpen(false)
      setTitle('')
    }
  }

  if (!open) {
    return (
      <button className="add-plan-btn glass" onClick={() => setOpen(true)}>
        <span className="add-plan-btn__icon">+</span>
        <span className="add-plan-btn__label">{placeholder}</span>
      </button>
    )
  }

  return (
    <div className="add-plan-input glass">
      <input
        ref={inputRef}
        className="add-plan-input__field"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setTitle('')
            setOpen(false)
          }
        }}
        placeholder="例如：Python 课程学习"
      />
    </div>
  )
}
