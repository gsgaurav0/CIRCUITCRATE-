'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Award, 
  LogOut, 
  Plus, 
  Upload, 
  Search, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Activity, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  FileCheck,
  Filter,
  RefreshCw,
  Eye,
  BookOpen,
  FolderGit,
  CalendarRange,
  Mail
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import BulkImportModal from './BulkImportModal'
import CourseModal from '@/components/CourseModal'
import ProjectModal from '@/components/ProjectModal'
import WorkshopModal from '@/components/WorkshopModal'

interface Certificate {
  id: string
  certificate_id: string
  candidate_name: string
  candidate_email: string
  certificate_title: string
  issue_date: string
  expiry_date?: string | null
  verification_status: boolean
  certificate_pdf_url?: string | null
  qr_code_url: string
  created_at: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'courses' | 'projects' | 'workshops' | 'messages'>('certificates')
  const [searchQuery, setSearchQuery] = useState('')

  // Certificates State
  const [certs, setCerts] = useState<Certificate[]>([])
  const [certsLoading, setCertsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'invalid'>('all')
  const [dateFilter, setDateFilter] = useState('') // YYYY-MM
  const [showImportModal, setShowImportModal] = useState(false)

  // Courses State
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)

  // Projects State
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)

  // Workshops State
  const [workshops, setWorkshops] = useState<any[]>([])
  const [workshopsLoading, setWorkshopsLoading] = useState(false)
  const [showWorkshopModal, setShowWorkshopModal] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<any | null>(null)

  // Messages State
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )

  // Fetching Functions
  const fetchCertificates = async () => {
    setCertsLoading(true)
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching certificates:', error)
      else setCerts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setCertsLoading(false)
    }
  }

  const fetchCourses = async () => {
    setCoursesLoading(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching courses:', error)
      else setCourses(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setCoursesLoading(false)
    }
  }

  const fetchProjects = async () => {
    setProjectsLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching projects:', error)
      else setProjects(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setProjectsLoading(false)
    }
  }

  const fetchWorkshops = async () => {
    setWorkshopsLoading(true)
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching workshops:', error)
      else setWorkshops(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setWorkshopsLoading(false)
    }
  }

  const fetchMessages = async () => {
    setMessagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching messages:', error)
      else setMessages(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
    fetchCourses()
    fetchProjects()
    fetchWorkshops()
    fetchMessages()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  // Delete Handlers
  const handleDeleteCertificate = (id: string, certificateId: string) => {
    showConfirm(
      'Delete Certificate',
      `Are you sure you want to delete certificate ${certificateId}? This action cannot be undone.`,
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('admin_audit_logs').insert({
              admin_id: user.id,
              action: 'DELETE_CERTIFICATE',
              target_id: certificateId,
              details: { id }
            })
          }

          const qrFileName = `${certificateId}.png`
          await supabase.storage.from('qr-codes').remove([qrFileName])

          const { error } = await supabase
            .from('certificates')
            .delete()
            .eq('id', id)

          if (error) alert(`Error deleting: ${error.message}`)
          else setCerts(certs.filter(c => c.id !== id))
        } catch (err: any) {
          alert(err.message || 'Error occurred during deletion.')
        }
      }
    )
  }

  const handleDeleteCourse = (id: string, title: string) => {
    showConfirm(
      'Delete Course',
      `Are you sure you want to delete course "${title}"? This action cannot be undone.`,
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const { error } = await supabase.from('courses').delete().eq('id', id)

          if (error) {
            alert(`Error deleting course: ${error.message}`)
          } else {
            if (user) {
              await supabase.from('admin_audit_logs').insert({
                admin_id: user.id,
                action: 'DELETE_COURSE',
                target_id: title,
                details: { id }
              })
            }
            setCourses(courses.filter(c => c.id !== id))
          }
        } catch (err: any) {
          alert(err.message || 'Error deleting course.')
        }
      }
    )
  }

  const handleDeleteProject = (id: string, title: string) => {
    showConfirm(
      'Delete Project',
      `Are you sure you want to delete project "${title}"? This action cannot be undone.`,
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const { error } = await supabase.from('projects').delete().eq('id', id)

          if (error) {
            alert(`Error deleting project: ${error.message}`)
          } else {
            if (user) {
              await supabase.from('admin_audit_logs').insert({
                admin_id: user.id,
                action: 'DELETE_PROJECT',
                target_id: title,
                details: { id }
              })
            }
            setProjects(projects.filter(p => p.id !== id))
          }
        } catch (err: any) {
          alert(err.message || 'Error deleting project.')
        }
      }
    )
  }

  const handleDeleteWorkshop = (id: string, title: string) => {
    showConfirm(
      'Delete Workshop',
      `Are you sure you want to delete workshop "${title}"? This action cannot be undone.`,
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const { error } = await supabase.from('workshops').delete().eq('id', id)

          if (error) {
            alert(`Error deleting workshop: ${error.message}`)
          } else {
            if (user) {
              await supabase.from('admin_audit_logs').insert({
                admin_id: user.id,
                action: 'DELETE_WORKSHOP',
                target_id: title,
                details: { id }
              })
            }
            setWorkshops(workshops.filter(w => w.id !== id))
          }
        } catch (err: any) {
          alert(err.message || 'Error deleting workshop.')
        }
      }
    )
  }

  const handleDeleteMessage = (id: string, email: string, senderName: string) => {
    showConfirm(
      'Delete Message',
      `Are you sure you want to delete this message from ${senderName}? This action cannot be undone.`,
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const { error } = await supabase.from('messages').delete().eq('id', id)

          if (error) {
            alert(`Error deleting message: ${error.message}`)
          } else {
            if (user) {
              await supabase.from('admin_audit_logs').insert({
                admin_id: user.id,
                action: 'DELETE_MESSAGE',
                target_id: email,
                details: { id, sender_name: senderName }
              })
            }
            setMessages(messages.filter(m => m.id !== id))
          }
        } catch (err: any) {
          alert(err.message || 'Error deleting message.')
        }
      }
    )
  }

  // Save Handlers
  const handleSaveCourse = async (courseData: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (courseData.id) {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseData.id)
      if (error) {
        alert(`Error saving course: ${error.message}`)
      } else {
        if (user) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: 'UPDATE_COURSE',
            target_id: courseData.title,
            details: courseData
          })
        }
        setShowCourseModal(false)
        fetchCourses()
      }
    } else {
      const { error } = await supabase
        .from('courses')
        .insert(courseData)
      if (error) {
        alert(`Error creating course: ${error.message}`)
      } else {
        if (user) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: 'CREATE_COURSE',
            target_id: courseData.title,
            details: courseData
          })
        }
        setShowCourseModal(false)
        fetchCourses()
      }
    }
  }

  const handleSaveProject = async (projectData: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if project already exists for updates vs inserts
    const isUpdate = projects.some(p => p.id === projectData.id)

    if (isUpdate) {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectData.id)
      if (error) {
        alert(`Error saving project: ${error.message}`)
      } else {
        if (user) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: 'UPDATE_PROJECT',
            target_id: projectData.title,
            details: projectData
          })
        }
        setShowProjectModal(false)
        fetchProjects()
      }
    } else {
      const { error } = await supabase
        .from('projects')
        .insert(projectData)
      if (error) {
        alert(`Error creating project: ${error.message}`)
      } else {
        if (user) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: 'CREATE_PROJECT',
            target_id: projectData.title,
            details: projectData
          })
        }
        setShowProjectModal(false)
        fetchProjects()
      }
    }
  }

  const handleSaveWorkshop = async (workshopData: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (workshopData.id) {
      const { error } = await supabase
        .from('workshops')
        .update(workshopData)
        .eq('id', workshopData.id)
      if (error) {
        alert(`Error saving workshop: ${error.message}`)
      } else {
        if (user) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: 'UPDATE_WORKSHOP',
            target_id: workshopData.title,
            details: workshopData
          })
        }
        setShowWorkshopModal(false)
        fetchWorkshops()
      }
    } else {
      const { error } = await supabase
        .from('workshops')
        .insert(workshopData)
      if (error) {
        alert(`Error creating workshop: ${error.message}`)
      } else {
        if (user) {
          await supabase.from('admin_audit_logs').insert({
            admin_id: user.id,
            action: 'CREATE_WORKSHOP',
            target_id: workshopData.title,
            details: workshopData
          })
        }
        setShowWorkshopModal(false)
        fetchWorkshops()
      }
    }
  }

  // Analytics computations (Certificates)
  const totalCertificates = certs.length
  const verifiedCertificates = certs.filter(c => c.verification_status).length
  const invalidCertificates = totalCertificates - verifiedCertificates
  const now = new Date()
  const thisMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const issuedThisMonth = certs.filter(c => c.issue_date.startsWith(thisMonthYear)).length
  const todayStr = now.toISOString().split('T')[0]
  const expiredCertificates = certs.filter(c => c.expiry_date && c.expiry_date < todayStr).length

  // Filtered Lists
  const filteredCerts = certs.filter(c => {
    const matchesSearch = 
      c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificate_title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'verified' && c.verification_status) ||
      (statusFilter === 'invalid' && !c.verification_status)

    const matchesDate = !dateFilter || c.issue_date.startsWith(dateFilter)

    return matchesSearch && matchesStatus && matchesDate
  })

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.desc_text || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWorkshops = workshops.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMessages = messages.filter(m => 
    `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.message || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExportMessagesCSV = () => {
    const headers = ['Message ID', 'Sender Name', 'Sender Email', 'Subject', 'Message Body', 'Received At']
    const rows = filteredMessages.map(m => [
      m.id,
      `"${(`${m.first_name || ''} ${m.last_name || ''}`).replace(/"/g, '""')}"`,
      m.email,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      m.created_at
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `messages_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Certificate ID', 'Candidate Name', 'Candidate Email', 'Title', 'Issue Date', 'Expiry Date', 'Status', 'PDF URL']
    const rows = filteredCerts.map(c => [
      c.certificate_id,
      `"${c.candidate_name.replace(/"/g, '""')}"`,
      c.candidate_email,
      `"${c.certificate_title.replace(/"/g, '""')}"`,
      c.issue_date,
      c.expiry_date || 'N/A',
      c.verification_status ? 'Verified' : 'Invalid',
      c.certificate_pdf_url || ''
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `certificates_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:from-neutral-950 dark:to-neutral-900 dark:bg-neutral-950 flex flex-col font-[sans-serif]">
      {/* Admin Navbar */}
      <header className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="CircuitCrate Logo" 
              className="h-8 w-auto object-contain dark:brightness-110"
              draggable={false}
            />
            <span className="font-extrabold text-sm tracking-wider text-gray-900 dark:text-white uppercase">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/logs" 
              className="text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <Activity size={16} /> Logs
            </Link>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="text-sm font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Upper Title & Header buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Manager
            </h1>
            <p className="text-gray-500 dark:text-neutral-400 text-sm mt-1">
              {activeTab === 'certificates' && 'Issue and manage candidate credentials securely.'}
              {activeTab === 'courses' && 'Create, edit, and categorize training courses.'}
              {activeTab === 'projects' && 'Maintain component-based hardware projects & instructions.'}
              {activeTab === 'workshops' && 'Manage upcoming local events, bootcamps, and schedules.'}
              {activeTab === 'messages' && 'Read and manage user messages submitted via contact form.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {activeTab === 'certificates' && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-neutral-700"
                >
                  <Upload size={16} /> Bulk Import CSV
                </button>
                <Link
                  href="/admin/certificates/new"
                  className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
                >
                  <Plus size={16} /> Issue Certificate
                </Link>
              </>
            )}
            {activeTab === 'courses' && (
              <button
                onClick={() => {
                  setSelectedCourse(null)
                  setShowCourseModal(true)
                }}
                className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
              >
                <Plus size={16} /> Add Course
              </button>
            )}
            {activeTab === 'projects' && (
              <button
                onClick={() => {
                  setSelectedProject(null)
                  setShowProjectModal(true)
                }}
                className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
              >
                <Plus size={16} /> Add Project
              </button>
            )}
            {activeTab === 'workshops' && (
              <button
                onClick={() => {
                  setSelectedWorkshop(null)
                  setShowWorkshopModal(true)
                }}
                className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
              >
                <Plus size={16} /> Add Workshop
              </button>
            )}
          </div>
        </div>

        {/* Analytics Cards Grid (Shown only for Certificates) */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 rounded-xl">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Total Issued</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{totalCertificates}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Active Verified</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{verifiedCertificates}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Expired</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{expiredCertificates}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Issued This Month</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{issuedThisMonth}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switching Navigation */}
        <div className="flex border-b border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => { setActiveTab('certificates'); setSearchQuery(''); }}
            className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
              activeTab === 'certificates'
                ? 'border-black dark:border-white border-b-black dark:border-b-white border-b-2 text-black dark:text-white font-extrabold'
                : 'border-transparent border-b-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Award size={18} /> Credentials
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setSearchQuery(''); }}
            className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
              activeTab === 'courses'
                ? 'border-black dark:border-white border-b-black dark:border-b-white border-b-2 text-black dark:text-white font-extrabold'
                : 'border-transparent border-b-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <BookOpen size={18} /> Courses
          </button>
          <button
            onClick={() => { setActiveTab('projects'); setSearchQuery(''); }}
            className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
              activeTab === 'projects'
                ? 'border-black dark:border-white border-b-black dark:border-b-white border-b-2 text-black dark:text-white font-extrabold'
                : 'border-transparent border-b-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <FolderGit size={18} /> Projects
          </button>
          <button
            onClick={() => { setActiveTab('workshops'); setSearchQuery(''); }}
            className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
              activeTab === 'workshops'
                ? 'border-black dark:border-white border-b-black dark:border-b-white border-b-2 text-black dark:text-white font-extrabold'
                : 'border-transparent border-b-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <CalendarRange size={18} /> Workshops
          </button>
          <button
            onClick={() => { setActiveTab('messages'); setSearchQuery(''); }}
            className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
              activeTab === 'messages'
                ? 'border-black dark:border-white border-b-black dark:border-b-white border-b-2 text-black dark:text-white font-extrabold'
                : 'border-transparent border-b-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Mail size={18} /> Messages
          </button>
        </div>

        {/* Registry Table Panel */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-2xl shadow-md overflow-hidden">
          
          {/* Filters Area */}
          <div className="p-5 border-b border-gray-100 dark:border-neutral-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm"
                />
              </div>

              <button
                onClick={() => {
                  if (activeTab === 'certificates') fetchCertificates()
                  if (activeTab === 'courses') fetchCourses()
                  if (activeTab === 'projects') fetchProjects()
                  if (activeTab === 'workshops') fetchWorkshops()
                  if (activeTab === 'messages') fetchMessages()
                }}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Refresh List"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {activeTab === 'certificates' && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                  <Filter size={16} />
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl px-3 py-2 focus:outline-none text-sm font-semibold cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="verified">Verified Only</option>
                    <option value="invalid">Invalid Only</option>
                  </select>
                </div>

                {/* Month Filter */}
                <input
                  type="month"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl px-3 py-1.5 focus:outline-none text-sm font-semibold cursor-pointer text-gray-700 dark:text-neutral-300"
                />

                {/* Export Trigger */}
                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 border-none"
                >
                  <FileSpreadsheet size={16} /> Export CSV
                </button>
              </div>
            )}
            {activeTab === 'messages' && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportMessagesCSV}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 border-none"
                >
                  <FileSpreadsheet size={16} /> Export CSV
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {/* 1. CERTIFICATES TAB */}
            {activeTab === 'certificates' && (
              <>
                {certsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-neutral-500/20 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-neutral-400 font-semibold text-sm">Loading registry...</p>
                  </div>
                ) : filteredCerts.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 dark:text-neutral-500">
                    <FileCheck size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-base">No certificates found</p>
                    <p className="text-xs mt-1">Try adjusting search query or filters.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-neutral-800/40 text-gray-400 dark:text-neutral-500 font-black uppercase text-xs border-b border-gray-100 dark:border-neutral-800/50">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Candidate</th>
                        <th className="py-4 px-6">Certificate Title</th>
                        <th className="py-4 px-6">Issue Date</th>
                        <th className="py-4 px-6">Expiry Date</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                      {filteredCerts.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-xs">{c.certificate_id}</td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-gray-900 dark:text-white">{c.candidate_name}</p>
                            <p className="text-xs text-gray-400 dark:text-neutral-500">{c.candidate_email}</p>
                          </td>
                          <td className="py-4 px-6 font-semibold">{c.certificate_title}</td>
                          <td className="py-4 px-6">{c.issue_date}</td>
                          <td className="py-4 px-6 text-gray-400 dark:text-neutral-500">{c.expiry_date || 'No Expiry'}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              c.verification_status 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' 
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10'
                            }`}>
                              {c.verification_status ? 'Verified' : 'Invalid'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <Link
                              href={`/certificate/${c.certificate_id}`}
                              target="_blank"
                              className="p-1.5 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                              title="View Public Page"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              href={`/admin/certificates/${c.id}/edit`}
                              className="p-1.5 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                              title="Edit Certificate"
                            >
                              <Edit3 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDeleteCertificate(c.id, c.certificate_id)}
                              className="p-1.5 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                              title="Delete Certificate"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* 2. COURSES TAB */}
            {activeTab === 'courses' && (
              <>
                {coursesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-neutral-500/20 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-neutral-400 font-semibold text-sm">Loading courses...</p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 dark:text-neutral-500">
                    <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-base">No courses found</p>
                    <p className="text-xs mt-1">Try adding a course or adjusting your search.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-neutral-800/40 text-gray-400 dark:text-neutral-500 font-black uppercase text-xs border-b border-gray-100 dark:border-neutral-800/50">
                        <th className="py-4 px-6">Title</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Level</th>
                        <th className="py-4 px-6">Lessons</th>
                        <th className="py-4 px-6">Syllabus Topics</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                      {filteredCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span 
                                className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10" 
                                style={{ backgroundColor: c.color || '#38bdf8' }}
                              />
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{c.title}</p>
                                <p className="text-xs text-gray-400 dark:text-neutral-500 truncate max-w-[300px]">{c.desc_text || 'No description'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/10">
                              {c.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold">Lvl {c.level}</td>
                          <td className="py-4 px-6 font-semibold">{c.lessons} lessons</td>
                          <td className="py-4 px-6 text-gray-400 dark:text-neutral-500">
                            {c.syllabus?.length || 0} items
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedCourse(c)
                                setShowCourseModal(true)
                              }}
                              className="p-1.5 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                              title="Edit Course"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.title)}
                              className="p-1.5 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                              title="Delete Course"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* 3. PROJECTS TAB */}
            {activeTab === 'projects' && (
              <>
                {projectsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-neutral-500/20 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-neutral-400 font-semibold text-sm">Loading projects...</p>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 dark:text-neutral-500">
                    <FolderGit size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-base">No projects found</p>
                    <p className="text-xs mt-1">Try adding a project or adjusting your search.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-neutral-800/40 text-gray-400 dark:text-neutral-500 font-black uppercase text-xs border-b border-gray-100 dark:border-neutral-800/50">
                        <th className="py-4 px-6">Slug ID</th>
                        <th className="py-4 px-6">Project Title</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Difficulty</th>
                        <th className="py-4 px-6">Time Estimate</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                      {filteredProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                          <td className="py-4 px-6 font-mono text-xs font-semibold">{p.id}</td>
                          <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">{p.title}</td>
                          <td className="py-4 px-6 text-gray-500 dark:text-neutral-400">{p.category}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.difficulty === 'Beginner' && 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/10' ||
                              p.difficulty === 'Intermediate' && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10' ||
                              p.difficulty === 'Advanced' && 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/10' ||
                              'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10'
                            }`}>
                              {p.difficulty}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-500 dark:text-neutral-400">{p.time_est}</td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedProject(p)
                                setShowProjectModal(true)
                              }}
                              className="p-1.5 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                              title="Edit Project"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(p.id, p.title)}
                              className="p-1.5 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                              title="Delete Project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* 4. WORKSHOPS TAB */}
            {activeTab === 'workshops' && (
              <>
                {workshopsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-neutral-500/20 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-neutral-400 font-semibold text-sm">Loading workshops...</p>
                  </div>
                ) : filteredWorkshops.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 dark:text-neutral-500">
                    <CalendarRange size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-base">No workshops found</p>
                    <p className="text-xs mt-1">Try adding a workshop or adjusting your search.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-neutral-800/40 text-gray-400 dark:text-neutral-500 font-black uppercase text-xs border-b border-gray-100 dark:border-neutral-800/50">
                        <th className="py-4 px-6">Workshop Title</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Schedule Date</th>
                        <th className="py-4 px-6">Location</th>
                        <th className="py-4 px-6">Highlights</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                      {filteredWorkshops.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{w.title}</p>
                              <p className="text-xs text-gray-400 dark:text-neutral-500 truncate max-w-[300px]">{w.desc_text}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/10">
                              {w.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold">{w.date_text}</td>
                          <td className="py-4 px-6 text-gray-500 dark:text-neutral-400">{w.location}</td>
                          <td className="py-4 px-6 text-gray-400 dark:text-neutral-500">
                            {w.highlights?.length || 0} items
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedWorkshop(w)
                                setShowWorkshopModal(true)
                              }}
                              className="p-1.5 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                              title="Edit Workshop"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkshop(w.id, w.title)}
                              className="p-1.5 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                              title="Delete Workshop"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* 5. MESSAGES TAB */}
            {activeTab === 'messages' && (
              <>
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-neutral-500/20 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-neutral-400 font-semibold text-sm">Loading messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="py-20 text-center text-gray-500 dark:text-neutral-500">
                    <Mail size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-base">No messages found</p>
                    <p className="text-xs mt-1">Try adjusting your search query.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-neutral-800/40 text-gray-400 dark:text-neutral-500 font-black uppercase text-xs border-b border-gray-100 dark:border-neutral-800/50">
                        <th className="py-4 px-6">Sender</th>
                        <th className="py-4 px-6">Email</th>
                        <th className="py-4 px-6">Subject</th>
                        <th className="py-4 px-6">Message Excerpt</th>
                        <th className="py-4 px-6">Received At</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                      {filteredMessages.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                          <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                            {m.first_name || ''} {m.last_name || ''}
                          </td>
                          <td className="py-4 px-6 font-semibold">{m.email}</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/10">
                              {m.subject || 'General Inquiry'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-500 dark:text-neutral-400 max-w-[250px] truncate" title={m.message}>
                            {m.message}
                          </td>
                          <td className="py-4 px-6 text-gray-400 dark:text-neutral-500 font-medium">
                            {m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedMessage(m)}
                              className="p-1.5 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                              title="View Full Message"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(m.id, m.email, `${m.first_name || ''} ${m.last_name || ''}`)}
                              className="p-1.5 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                              title="Delete Message"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showImportModal && (
        <BulkImportModal 
          onClose={() => {
            setShowImportModal(false)
            fetchCertificates()
          }} 
        />
      )}

      {showCourseModal && (
        <CourseModal 
          course={selectedCourse} 
          onClose={() => setShowCourseModal(false)} 
          onSave={handleSaveCourse} 
        />
      )}

      {showProjectModal && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setShowProjectModal(false)} 
          onSave={handleSaveProject} 
        />
      )}

      {showWorkshopModal && (
        <WorkshopModal 
          workshop={selectedWorkshop} 
          onClose={() => setShowWorkshopModal(false)} 
          onSave={handleSaveWorkshop} 
        />
      )}

      {/* Message Detail Modal Overlay */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {selectedMessage.subject || 'General Inquiry'}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                    Received on {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-white font-bold p-1 transition-all cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <div className="border-t border-b border-gray-100 dark:border-neutral-800/80 py-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2">
                <div>
                  <span className="font-bold text-gray-400 dark:text-neutral-500 uppercase text-xs tracking-wider block">From</span>
                  <span className="font-extrabold text-gray-900 dark:text-white text-base">
                    {selectedMessage.first_name || ''} {selectedMessage.last_name || ''}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 dark:text-neutral-500 uppercase text-xs tracking-wider block sm:text-right">Email Address</span>
                  <a 
                    href={`mailto:${selectedMessage.email}`} 
                    className="font-bold text-neutral-800 dark:text-neutral-200 hover:underline block sm:text-right"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <span className="font-bold text-gray-400 dark:text-neutral-500 uppercase text-xs tracking-wider block mb-2">Message Body</span>
                <div className="bg-gray-50 dark:bg-neutral-950/60 border border-gray-100 dark:border-neutral-800/50 rounded-xl p-4 max-h-[300px] overflow-y-auto leading-relaxed text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap select-text font-medium">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  handleDeleteMessage(
                    selectedMessage.id, 
                    selectedMessage.email, 
                    `${selectedMessage.first_name || ''} ${selectedMessage.last_name || ''}`
                  )
                  setSelectedMessage(null)
                }}
                className="bg-transparent hover:bg-red-500/10 text-red-500 font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer border border-red-500/20"
              >
                <Trash2 size={14} /> Delete Message
              </button>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="bg-gray-100 hover:bg-gray-250 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white font-black py-2.5 px-5 rounded-xl transition-all text-xs cursor-pointer border border-gray-200/60 dark:border-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-gray-150 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-xl transition-all text-xs cursor-pointer border border-gray-200 dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-red-500/10 border-none"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-6 text-center text-xs text-gray-500 dark:text-neutral-600 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} CircuitCrate Private Limited. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
