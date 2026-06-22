'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

interface Course {
  id?: string
  title: string
  category: string
  image: string
  level: number
  lessons: number
  desc_text: string
  color: string
  syllabus: string[]
  outcomes: string[]
}

interface CourseModalProps {
  course: Course | null // null means Create mode, object means Edit mode
  onClose: () => void
  onSave: (courseData: Course) => Promise<void>
}

export default function CourseModal({ course, onClose, onSave }: CourseModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Beginner')
  const [image, setImage] = useState('/src/assets/courses/electronics.png')
  const [level, setLevel] = useState(1)
  const [lessons, setLessons] = useState(10)
  const [descText, setDescText] = useState('')
  const [color, setColor] = useState('#38bdf8')
  
  const [syllabus, setSyllabus] = useState<string[]>([])
  const [newSyllabusItem, setNewSyllabusItem] = useState('')
  
  const [outcomes, setOutcomes] = useState<string[]>([])
  const [newOutcomeItem, setNewOutcomeItem] = useState('')
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (course) {
      setTitle(course.title || '')
      setCategory(course.category || 'Beginner')
      setImage(course.image || '/src/assets/courses/electronics.png')
      setLevel(course.level || 1)
      setLessons(course.lessons || 10)
      setDescText(course.desc_text || '')
      setColor(course.color || '#38bdf8')
      setSyllabus(course.syllabus || [])
      setOutcomes(course.outcomes || [])
    } else {
      // Reset to defaults
      setTitle('')
      setCategory('Beginner')
      setImage('/src/assets/courses/electronics.png')
      setLevel(1)
      setLessons(10)
      setDescText('')
      setColor('#38bdf8')
      setSyllabus([])
      setOutcomes([])
    }
  }, [course])

  const handleAddSyllabus = () => {
    if (newSyllabusItem.trim()) {
      setSyllabus([...syllabus, newSyllabusItem.trim()])
      setNewSyllabusItem('')
    }
  }

  const handleRemoveSyllabus = (index: number) => {
    setSyllabus(syllabus.filter((_, i) => i !== index))
  }

  const handleAddOutcome = () => {
    if (newOutcomeItem.trim()) {
      setOutcomes([...outcomes, newOutcomeItem.trim()])
      setNewOutcomeItem('')
    }
  }

  const handleRemoveOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !category.trim()) return

    setSaving(true)
    try {
      const data: Course = {
        title: title.trim(),
        category: category.trim(),
        image: image.trim(),
        level,
        lessons,
        desc_text: descText.trim(),
        color,
        syllabus,
        outcomes
      }
      if (course?.id) {
        data.id = course.id
      }
      await onSave(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
            {course ? 'Edit Course' : 'Create New Course'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Course Title</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Intro to Hardware"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-255 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm cursor-pointer text-gray-800 dark:text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Level</label>
              <input 
                type="number" 
                required 
                min={1} 
                max={5} 
                value={level} 
                onChange={e => setLevel(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Lessons Count</label>
              <input 
                type="number" 
                required 
                min={1} 
                value={lessons} 
                onChange={e => setLessons(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Theme Color (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)}
                  className="w-12 h-10 border border-gray-200 dark:border-neutral-700/80 rounded-xl cursor-pointer bg-transparent"
                />
                <input 
                  type="text" 
                  required 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  placeholder="#38bdf8"
                  className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Image URL</label>
              <input 
                type="text" 
                required 
                value={image} 
                onChange={e => {
                  const val = e.target.value;
                  try {
                    const trimmed = val.trim();
                    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                      const urlObj = new URL(trimmed);
                      const imgUrlParam = urlObj.searchParams.get('imgurl');
                      if (imgUrlParam) {
                        setImage(decodeURIComponent(imgUrlParam));
                        return;
                      }
                      const mediaUrlParam = urlObj.searchParams.get('mediaurl');
                      if (mediaUrlParam) {
                        setImage(decodeURIComponent(mediaUrlParam));
                        return;
                      }
                    }
                  } catch (err) {}
                  setImage(val);
                }} 
                placeholder="e.g. /src/assets/courses/electronics.png or https://example.com/image.png"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm text-gray-800 dark:text-white"
              />
              {image && (
                <div className="mt-2 flex items-center gap-3 p-2 border border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50 dark:bg-neutral-900/50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-850 flex items-center justify-center border border-gray-250 dark:border-neutral-700 shrink-0">
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="9" cy="9" r="2"/%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 dark:text-neutral-500">Live Preview</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Description</label>
            <textarea 
              value={descText} 
              onChange={e => setDescText(e.target.value)} 
              rows={3}
              placeholder="Short explanation of this course..."
              className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
            />
          </div>

          {/* Syllabus Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Syllabus / Topics Covered</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newSyllabusItem} 
                onChange={e => setNewSyllabusItem(e.target.value)} 
                placeholder="Add syllabus topic..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSyllabus())}
                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddSyllabus}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white p-2 rounded-xl border border-gray-200 dark:border-neutral-700/80 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
            {syllabus.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border border-gray-150 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-900/30 overflow-hidden">
                {syllabus.map((item, index) => (
                  <li key={index} className="flex justify-between items-center py-2 pl-4 pr-3 text-sm text-gray-700 dark:text-neutral-300">
                    <span>{item}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSyllabus(index)}
                      className="text-red-500 hover:text-red-650 p-1 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Outcomes Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Outcomes / Skills Gained</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newOutcomeItem} 
                onChange={e => setNewOutcomeItem(e.target.value)} 
                placeholder="Add skill outcome..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddOutcome())}
                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddOutcome}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white p-2 rounded-xl border border-gray-200 dark:border-neutral-700/80 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
            {outcomes.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border border-gray-150 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-900/30 overflow-hidden">
                {outcomes.map((item, index) => (
                  <li key={index} className="flex justify-between items-center py-2 pl-4 pr-3 text-sm text-gray-700 dark:text-neutral-300">
                    <span>{item}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveOutcome(index)}
                      className="text-red-500 hover:text-red-650 p-1 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm cursor-pointer border border-gray-200 dark:border-neutral-700"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-2.5 px-6 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
            >
              {saving ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
