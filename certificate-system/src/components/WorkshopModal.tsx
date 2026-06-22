'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

interface Workshop {
  id?: string
  title: string
  date_text: string
  location: string
  image: string
  category: string
  desc_text: string
  highlights: string[]
}

interface WorkshopModalProps {
  workshop: Workshop | null // null means Create mode, object means Edit mode
  onClose: () => void
  onSave: (workshopData: Workshop) => Promise<void>
}

export default function WorkshopModal({ workshop, onClose, onSave }: WorkshopModalProps) {
  const [title, setTitle] = useState('')
  const [dateText, setDateText] = useState('')
  const [location, setLocation] = useState('')
  const [image, setImage] = useState('/src/assets/courses/robotics.png')
  const [category, setCategory] = useState('Competition')
  const [descText, setDescText] = useState('')
  
  const [highlights, setHighlights] = useState<string[]>([])
  const [newHighlightItem, setNewHighlightItem] = useState('')
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (workshop) {
      setTitle(workshop.title || '')
      setDateText(workshop.date_text || '')
      setLocation(workshop.location || '')
      setImage(workshop.image || '/src/assets/courses/robotics.png')
      setCategory(workshop.category || 'Competition')
      setDescText(workshop.desc_text || '')
      setHighlights(workshop.highlights || [])
    } else {
      // Reset to defaults
      setTitle('')
      setDateText('')
      setLocation('')
      setImage('/src/assets/courses/robotics.png')
      setCategory('Competition')
      setDescText('')
      setHighlights([])
    }
  }, [workshop])

  const handleAddHighlight = () => {
    if (newHighlightItem.trim()) {
      setHighlights([...highlights, newHighlightItem.trim()])
      setNewHighlightItem('')
    }
  }

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !category.trim()) return

    setSaving(true)
    try {
      const data: Workshop = {
        title: title.trim(),
        date_text: dateText.trim(),
        location: location.trim(),
        image: image.trim(),
        category: category.trim(),
        desc_text: descText.trim(),
        highlights
      }
      if (workshop?.id) {
        data.id = workshop.id
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
            {workshop ? 'Edit Workshop' : 'Create New Workshop'}
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
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Workshop Title</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Robo-Soccer Challenge"
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
                <option value="Competition">Competition</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Training">Training</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Date Description</label>
              <input 
                type="text" 
                required 
                value={dateText} 
                onChange={e => setDateText(e.target.value)} 
                placeholder="e.g. March 15-16, 2026"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Location / Venue</label>
              <input 
                type="text" 
                required 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                placeholder="e.g. Tech Hub, Room 102"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
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
                placeholder="e.g. /src/assets/courses/robotics.png or https://example.com/image.png"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-255 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm text-gray-800 dark:text-white"
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
              placeholder="Short description of this workshop..."
              className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-255 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
            />
          </div>

          {/* Highlights */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Workshop Highlights</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newHighlightItem} 
                onChange={e => setNewHighlightItem(e.target.value)} 
                placeholder="e.g. Wireless Control, Free Kit"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddHighlight}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white p-2 rounded-xl border border-gray-200 dark:border-neutral-700/80 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border border-gray-150 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-900/30">
                {highlights.map((item, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-full text-xs font-bold border border-gray-300 dark:border-neutral-700">
                    {item}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveHighlight(index)}
                      className="text-red-500 hover:text-red-650 cursor-pointer font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
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
              {saving ? 'Saving...' : 'Save Workshop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
