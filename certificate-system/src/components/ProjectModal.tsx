'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

interface Project {
  id: string
  category: string
  title: string
  image: string
  difficulty: string
  time_est: string
  desc_text: string
  tools: string[]
  steps: string[]
}

interface ProjectModalProps {
  project: Project | null // null means Create mode, object means Edit mode
  onClose: () => void
  onSave: (projectData: Project) => Promise<void>
}

export default function ProjectModal({ project, onClose, onSave }: ProjectModalProps) {
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Start from Basics')
  const [image, setImage] = useState('/src/assets/projects/basics.png')
  const [difficulty, setDifficulty] = useState('Beginner')
  const [timeEst, setTimeEst] = useState('15 mins')
  const [descText, setDescText] = useState('')
  
  const [tools, setTools] = useState<string[]>([])
  const [newToolItem, setNewToolItem] = useState('')
  
  const [steps, setSteps] = useState<string[]>([])
  const [newStepItem, setNewStepItem] = useState('')
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setId(project.id || '')
      setTitle(project.title || '')
      setCategory(project.category || 'Start from Basics')
      setImage(project.image || '/src/assets/projects/basics.png')
      setDifficulty(project.difficulty || 'Beginner')
      setTimeEst(project.time_est || '15 mins')
      setDescText(project.desc_text || '')
      setTools(project.tools || [])
      setSteps(project.steps || [])
    } else {
      // Reset to defaults
      setId('')
      setTitle('')
      setCategory('Start from Basics')
      setImage('/src/assets/projects/basics.png')
      setDifficulty('Beginner')
      setTimeEst('15 mins')
      setDescText('')
      setTools([])
      setSteps([])
    }
  }, [project])

  const handleAddTool = () => {
    if (newToolItem.trim()) {
      setTools([...tools, newToolItem.trim()])
      setNewToolItem('')
    }
  }

  const handleRemoveTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index))
  }

  const handleAddStep = () => {
    if (newStepItem.trim()) {
      setSteps([...steps, newStepItem.trim()])
      setNewStepItem('')
    }
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !title.trim() || !category.trim()) return

    setSaving(true)
    try {
      const data: Project = {
        id: id.trim().toLowerCase().replace(/\s+/g, '-'), // URL-safe id
        category: category.trim(),
        title: title.trim(),
        image: image.trim(),
        difficulty: difficulty.trim(),
        time_est: timeEst.trim(),
        desc_text: descText.trim(),
        tools,
        steps
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
            {project ? 'Edit Project' : 'Create New Project'}
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
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Project ID (Slug)</label>
              <input 
                type="text" 
                required 
                disabled={!!project}
                value={id} 
                onChange={e => setId(e.target.value)} 
                placeholder="e.g. smart-alarm"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Project Title</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Smart Distance Alarm"
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
                <option value="Start from Basics">Start from Basics</option>
                <option value="Understand Components">Understand Components</option>
                <option value="Write Simple Code">Write Simple Code</option>
                <option value="Build Real Hardware">Build Real Hardware</option>
                <option value="Improve Through Projects">Improve Through Projects</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Difficulty</label>
              <select 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value)}
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-255 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm cursor-pointer text-gray-800 dark:text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Estimated Time</label>
              <input 
                type="text" 
                required 
                value={timeEst} 
                onChange={e => setTimeEst(e.target.value)} 
                placeholder="e.g. 30 mins, 2 hours"
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
                placeholder="e.g. /src/assets/projects/basics.png or https://example.com/image.png"
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-255 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm text-gray-800 dark:text-white"
              />
              {image && (
                <div className="mt-2 flex items-center gap-3 p-2 border border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50 dark:bg-neutral-900/50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-855 flex items-center justify-center border border-gray-250 dark:border-neutral-700 shrink-0">
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
              placeholder="Short explanation of this project..."
              className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-255 dark:border-neutral-700/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
            />
          </div>

          {/* Tools Required */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Tools & Components Required</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newToolItem} 
                onChange={e => setNewToolItem(e.target.value)} 
                placeholder="e.g. Breadboard, 10k Resistor"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTool())}
                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddTool}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white p-2 rounded-xl border border-gray-200 dark:border-neutral-700/80 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border border-gray-150 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-900/30">
                {tools.map((item, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-full text-xs font-bold border border-gray-300 dark:border-neutral-700">
                    {item}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTool(index)}
                      className="text-red-500 hover:text-red-650 cursor-pointer font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Step-by-step Instructions</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newStepItem} 
                onChange={e => setNewStepItem(e.target.value)} 
                placeholder="Describe next step..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-250 dark:border-neutral-700/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddStep}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white p-2 rounded-xl border border-gray-200 dark:border-neutral-700/80 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
            {steps.length > 0 && (
              <ol className="divide-y divide-gray-100 dark:divide-neutral-800 border border-gray-150 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-900/30 overflow-hidden list-decimal pl-0">
                {steps.map((item, index) => (
                  <li key={index} className="flex gap-3 py-2.5 pl-4 pr-3 text-sm text-gray-700 dark:text-neutral-300">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{index + 1}.</span>
                    <span className="flex-1">{item}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveStep(index)}
                      className="text-red-500 hover:text-red-650 p-1 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ol>
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
              {saving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
