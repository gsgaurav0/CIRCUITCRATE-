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
  Mail,
  Menu,
  Tag,
  Layers,
  Inbox,
  X,
  ChevronRight,
  TrendingUp,
  Briefcase
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import ThemeToggle from '@/components/ThemeToggle'
import BulkImportModal from './BulkImportModal'
import CourseModal from '@/components/CourseModal'
import ProjectModal from '@/components/ProjectModal'
import WorkshopModal from '@/components/WorkshopModal'
import { fetchProjectsFromSanity, saveProjectToSanity, deleteProjectFromSanity } from '@/lib/sanity'

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
  certificate_type?: 'course' | 'internship' | 'position' | 'project' | null
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'courses' | 'projects' | 'workshops' | 'messages'>('certificates')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Certificates State
  const [certs, setCerts] = useState<Certificate[]>([])
  const [certsLoading, setCertsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'invalid'>('all')
  const [dateFilter, setDateFilter] = useState('') // YYYY-MM
  const [showImportModal, setShowImportModal] = useState(false)

  // Traffic / Verification Logs State
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

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

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const { data, error } = await supabase
        .from('verification_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('Error fetching logs:', error)
      else setLogs(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLogsLoading(false)
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
      // 1. Attempt fetching from Sanity CMS first
      const sanityData = await fetchProjectsFromSanity()
      if (sanityData && sanityData.length > 0) {
        const mapped = sanityData.map((p: any) => ({
          id: p._id,
          title: p.title,
          category: p.category,
          difficulty: p.difficulty,
          time_est: p.time_est,
          desc_text: p.desc_text,
          image: p.image,
          tools: p.tools || [],
          steps: p.steps || []
        }))
        setProjects(mapped)
        return
      }

      // 2. Fallback to Supabase
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
    setMounted(true)
    fetchCertificates()
    fetchCourses()
    fetchProjects()
    fetchWorkshops()
    fetchMessages()
    fetchLogs()
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

          // 1. Attempt deleting from Sanity CMS first
          const sanityDeleted = await deleteProjectFromSanity(id)
          if (sanityDeleted) {
            if (user) {
              await supabase.from('admin_audit_logs').insert({
                admin_id: user.id,
                action: 'DELETE_PROJECT_SANITY',
                target_id: title,
                details: { id }
              })
            }
            setProjects(projects.filter(p => p.id !== id))
            return
          }

          // 2. Fallback to Supabase
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
    
    // 1. Attempt saving to Sanity CMS first
    const sanitySaved = await saveProjectToSanity(projectData)
    if (sanitySaved) {
      if (user) {
        const isUpdate = projects.some(p => p.id === projectData.id)
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: isUpdate ? 'UPDATE_PROJECT_SANITY' : 'CREATE_PROJECT_SANITY',
          target_id: projectData.title,
          details: projectData
        })
      }
      setShowProjectModal(false)
      fetchProjects()
      return
    }

    // 2. Fallback to Supabase
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

  // Courses Analytics
  const totalCourses = courses.length
  const uniqueCategories = Array.from(new Set(courses.map(c => c.category))).length
  const totalLessons = courses.reduce((acc, c) => acc + (parseInt(c.lessons) || 0), 0)
  const avgLessons = totalCourses > 0 ? Math.round(totalLessons / totalCourses) : 0

  // Projects Analytics
  const totalProjects = projects.length
  const beginnerProjects = projects.filter(p => p.difficulty === 'Beginner').length
  const intermediateProjects = projects.filter(p => p.difficulty === 'Intermediate').length
  const advancedProjects = projects.filter(p => p.difficulty === 'Advanced').length

  // Workshops Analytics
  const totalWorkshops = workshops.length
  const uniqueWorkshopLocs = Array.from(new Set(workshops.map(w => w.location))).length
  const workshopCategories = Array.from(new Set(workshops.map(w => w.category))).length
  const totalWorkshopHighlights = workshops.reduce((acc, w) => acc + (w.highlights?.length || 0), 0)

  // Messages Analytics
  const totalMessages = messages.length
  const supportMessages = messages.filter(m => (m.subject || '').toLowerCase().includes('support')).length
  const businessMessages = messages.filter(m => (m.subject || '').toLowerCase().includes('business') || (m.subject || '').toLowerCase().includes('work')).length
  const generalMessages = totalMessages - supportMessages - businessMessages

  // Semicircular Gauge Compliance Calculations
  const complianceRate = totalCertificates > 0 ? Math.round((verifiedCertificates / totalCertificates) * 100) : 100

  // Dynamic traffic trend compilation from Supabase verification_logs table
  const getActiveUsersData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const trendMap: { [key: string]: number } = {}
    const now = new Date()
    const last6Months = []
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`
      last6Months.push(monthLabel)
      trendMap[monthLabel] = 0
    }

    logs.forEach(l => {
      if (!l.created_at) return
      const logDate = new Date(l.created_at)
      if (isNaN(logDate.getTime())) return
      const label = `${months[logDate.getMonth()]} ${logDate.getFullYear().toString().slice(-2)}`
      if (label in trendMap) {
        trendMap[label] += 1
      }
    })

    return last6Months.map(month => ({
      name: month,
      ActiveUsers: trendMap[month]
    }))
  }

  // Certificate Type Distribution Percentages
  const internshipCerts = certs.filter(c => c.certificate_type === 'internship').length
  const courseCerts = certs.filter(c => !c.certificate_type || c.certificate_type === 'course').length
  const projectCerts = certs.filter(c => c.certificate_type === 'project').length
  const positionCerts = certs.filter(c => c.certificate_type === 'position').length

  const totalCertsVal = totalCertificates || 1
  const internshipPct = Math.round((internshipCerts / totalCertsVal) * 100)
  const coursePct = Math.round((courseCerts / totalCertsVal) * 100)
  const projectPct = Math.round((projectCerts / totalCertsVal) * 100)
  const positionPct = Math.round((positionCerts / totalCertsVal) * 100)

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

  // Custom Tooltip for Recharts AreaChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-3 rounded-xl shadow-lg text-xs font-semibold">
          <p className="font-bold text-gray-500 dark:text-neutral-400 mb-1">{label}</p>
          <p className="font-black text-blue-600 dark:text-blue-400">
            Active Users: {payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex font-[sans-serif]">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800/80 transition-transform duration-300 transform md:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="CircuitCrate Logo" 
              className="h-8 w-auto object-contain dark:brightness-110"
              draggable={false}
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-gray-900 dark:text-white uppercase leading-none">CircuitCrate</span>
              <span className="text-[9px] font-black tracking-widest text-blue-500 dark:text-blue-400 uppercase mt-1">Admin Console</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
          {/* Menu Section */}
          <div>
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-3">Menu</span>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('certificates'); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer bg-transparent border-none ${
                  activeTab === 'certificates' 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Award size={18} className={activeTab === 'certificates' ? 'text-blue-500' : ''} />
                  <span>Credentials</span>
                </div>
                <ChevronRight size={14} className={`opacity-40 transition-transform ${activeTab === 'certificates' ? 'rotate-90' : ''}`} />
              </button>

              <button
                onClick={() => { setActiveTab('courses'); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer bg-transparent border-none ${
                  activeTab === 'courses' 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className={activeTab === 'courses' ? 'text-blue-500' : ''} />
                  <span>Courses</span>
                </div>
                <ChevronRight size={14} className={`opacity-40 transition-transform ${activeTab === 'courses' ? 'rotate-90' : ''}`} />
              </button>

              <button
                onClick={() => { setActiveTab('projects'); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer bg-transparent border-none ${
                  activeTab === 'projects' 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderGit size={18} className={activeTab === 'projects' ? 'text-blue-500' : ''} />
                  <span>Projects</span>
                </div>
                <ChevronRight size={14} className={`opacity-40 transition-transform ${activeTab === 'projects' ? 'rotate-90' : ''}`} />
              </button>

              <button
                onClick={() => { setActiveTab('workshops'); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer bg-transparent border-none ${
                  activeTab === 'workshops' 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarRange size={18} className={activeTab === 'workshops' ? 'text-blue-500' : ''} />
                  <span>Workshops</span>
                </div>
                <ChevronRight size={14} className={`opacity-40 transition-transform ${activeTab === 'workshops' ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Communication Section */}
          <div>
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-3">Communication</span>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('messages'); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer bg-transparent border-none ${
                  activeTab === 'messages' 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail size={18} className={activeTab === 'messages' ? 'text-blue-500' : ''} />
                  <span>Messages</span>
                </div>
                {totalMessages > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {totalMessages}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* System Section */}
          <div>
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-3">System</span>
            <div className="space-y-1">
              <Link 
                href="/admin/logs" 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-all decoration-none"
              >
                <Activity size={18} />
                <span>Audit Logs</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all text-left cursor-pointer bg-transparent border-none"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/55 backdrop-blur-xs z-40 md:hidden" 
        />
      )}

      {/* Main Content Area Container */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800/80 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-1 text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <Menu size={22} />
            </button>
            
            {/* Top Search bar */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'certificates' ? 'credentials' : activeTab}...`}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Theme, notification badge & user info */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-neutral-800" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs uppercase shadow-inner border border-blue-500/10">
                CC
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">CircuitCrate Admin</p>
                <p className="text-[9px] text-emerald-500 font-semibold tracking-wider uppercase mt-1 leading-none">Authorized</p>
              </div>
            </div>
          </div>
        </header>

        {/* Console Content Dashboard Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Header Title Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {activeTab === 'certificates' ? 'Credentials' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard
              </h1>
              <p className="text-gray-400 dark:text-neutral-500 text-xs mt-1 font-semibold">
                {activeTab === 'certificates' && 'Securely manage, issue, and verify candidate credentials.'}
                {activeTab === 'courses' && 'Maintain educational training courses and categories.'}
                {activeTab === 'projects' && 'Add, update, or remove hardware robotics projects.'}
                {activeTab === 'workshops' && 'Coordinate schedules, highlights, and bootcamps.'}
                {activeTab === 'messages' && 'Review and respond to client contact form inquiries.'}
              </p>
            </div>

            {/* Quick Action Button for Active Tab */}
            <div className="flex flex-wrap gap-2.5">
              {activeTab === 'certificates' && (
                <>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-800 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-neutral-700/80"
                  >
                    <Upload size={14} /> Bulk Import CSV
                  </button>
                  <Link
                    href="/admin/certificates/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 decoration-none"
                  >
                    <Plus size={14} /> Issue Credential
                  </Link>
                </>
              )}
              {activeTab === 'courses' && (
                <button
                  onClick={() => { setSelectedCourse(null); setShowCourseModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Plus size={14} /> Add Course
                </button>
              )}
              {activeTab === 'projects' && (
                <button
                  onClick={() => { setSelectedProject(null); setShowProjectModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Plus size={14} /> Add Project
                </button>
              )}
              {activeTab === 'workshops' && (
                <button
                  onClick={() => { setSelectedWorkshop(null); setShowWorkshopModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Plus size={14} /> Add Workshop
                </button>
              )}
            </div>
          </div>

          {/* Dynamic KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {activeTab === 'certificates' && (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Award size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Total Issued</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalCertificates}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Active Verified</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{verifiedCertificates}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Expired</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{expiredCertificates}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Issued Month</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{issuedThisMonth}</h3>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'courses' && (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Total Courses</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalCourses}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Tag size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Categories</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{uniqueCategories}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                    <Layers size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Total Lessons</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalLessons}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Avg Lessons</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{avgLessons}</h3>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'projects' && (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <FolderGit size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Total Projects</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalProjects}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Beginner</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{beginnerProjects}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Intermediate</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{intermediateProjects}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Advanced</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{advancedProjects}</h3>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'workshops' && (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <CalendarRange size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Workshops</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalWorkshops}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Tag size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Categories</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{workshopCategories}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                    <Layers size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Locations</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{uniqueWorkshopLocs}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Highlights</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalWorkshopHighlights}</h3>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'messages' && (
              <>
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Inbox size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Inbox Total</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{totalMessages}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Support Req</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{supportMessages}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Business</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{businessMessages}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Mail size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">General</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 leading-none">{generalMessages}</h3>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Interactive Recharts Charts Grid - Only shown when Credentials is selected */}
          {activeTab === 'certificates' && mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Area Chart Card - Active Users */}
              <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Active Users on Website</h3>
                  <p className="text-gray-400 dark:text-neutral-500 text-xs font-semibold mt-1">Real-time website traffic based on verification scans and logs.</p>
                </div>
                
                <div className="w-full h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getActiveUsersData()}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#e5e7eb" 
                        className="dark:stroke-neutral-800"
                      />
                      <XAxis 
                        dataKey="name" 
                        stroke="#a3a3a3" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#a3a3a3" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="ActiveUsers" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorActiveUsers)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Semicircular progress & type distribution */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between relative">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Registry Metrics</h3>
                  <p className="text-gray-400 dark:text-neutral-500 text-xs font-semibold mt-1">Verification compliance and type distributions.</p>
                </div>

                {/* Semicircular Gauge (GUI Improved) */}
                <div className="relative flex flex-col items-center justify-center mt-6">
                  <div className="relative w-44 h-24 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 55">
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 10 50 A 38 38 0 0 1 90 50"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="7"
                        strokeLinecap="round"
                        className="dark:stroke-neutral-800"
                      />
                      <path
                        d="M 10 50 A 38 38 0 0 1 90 50"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray="120"
                        strokeDashoffset={120 - (120 * complianceRate) / 100}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    {/* Centered text located below the arc peak, completely non-overlapping */}
                    <div className="absolute bottom-1.5 text-center flex flex-col items-center justify-end">
                      <span className="text-[8px] font-black text-gray-450 dark:text-neutral-500 uppercase tracking-widest leading-none">Verified Rate</span>
                      <span className="text-xl font-black text-gray-900 dark:text-white mt-1 leading-none block">{complianceRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Distribution bars */}
                <div className="space-y-3 mt-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-500 dark:text-neutral-400">Courses</span>
                      <span className="text-gray-900 dark:text-white">{courseCerts} ({coursePct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${coursePct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-500 dark:text-neutral-400">Internships</span>
                      <span className="text-gray-900 dark:text-white">{internshipCerts} ({internshipPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${internshipPct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-500 dark:text-neutral-400">Projects</span>
                      <span className="text-gray-900 dark:text-white">{projectCerts} ({projectPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${projectPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Modern Manager Table Card */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-3xl shadow-xs overflow-hidden">
            
            {/* Table Filters Header bar */}
            <div className="p-5 border-b border-gray-100 dark:border-neutral-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md sm:hidden">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div className="hidden sm:block text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                  Details View
                </div>

                <button
                  onClick={() => {
                    if (activeTab === 'certificates') { fetchCertificates(); fetchLogs(); }
                    if (activeTab === 'courses') fetchCourses()
                    if (activeTab === 'projects') fetchProjects()
                    if (activeTab === 'workshops') fetchWorkshops()
                    if (activeTab === 'messages') fetchMessages()
                  }}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title="Refresh Database"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Table Action Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {activeTab === 'certificates' && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                      <Filter size={14} />
                      <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl px-3 py-2.5 focus:outline-none text-xs font-bold cursor-pointer text-gray-700 dark:text-neutral-300"
                      >
                        <option value="all">All Statuses</option>
                        <option value="verified">Verified Only</option>
                        <option value="invalid">Invalid Only</option>
                      </select>
                    </div>

                    <input
                      type="month"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 focus:outline-none text-xs font-bold cursor-pointer text-gray-700 dark:text-neutral-300"
                    />

                    <button
                      onClick={handleExportCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 border-none"
                    >
                      <FileSpreadsheet size={14} /> Export CSV
                    </button>
                  </>
                )}

                {activeTab === 'messages' && (
                  <button
                    onClick={handleExportMessagesCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 border-none"
                  >
                    <FileSpreadsheet size={14} /> Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Table Scroll wrapper */}
            <div className="overflow-x-auto">
              
              {/* 1. CERTIFICATES TAB */}
              {activeTab === 'certificates' && (
                <>
                  {certsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-gray-400 dark:text-neutral-500 font-bold text-xs">Loading registry data...</p>
                    </div>
                  ) : filteredCerts.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 dark:text-neutral-500">
                      <FileCheck size={36} className="mx-auto text-gray-300 dark:text-neutral-750 mb-3" />
                      <p className="font-extrabold text-sm uppercase tracking-wider">No certificates found</p>
                      <p className="text-xs mt-1 font-semibold">Try adjusting search query or filters.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-neutral-800/40 text-gray-500 dark:text-neutral-300 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-neutral-800">
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
                          <tr key={c.id} className="hover:bg-gray-100/35 dark:hover:bg-neutral-800/30 transition-colors">
                            <td className="py-4 px-6 font-mono font-bold text-gray-500 dark:text-neutral-300">{c.certificate_id}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black uppercase text-[10px]">
                                  {c.candidate_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 dark:text-white leading-none">{c.candidate_name}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-neutral-400 mt-1 leading-none">{c.candidate_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-black text-gray-800 dark:text-neutral-200">{c.certificate_title}</td>
                            <td className="py-4 px-6">{c.issue_date}</td>
                            <td className="py-4 px-6 text-gray-400 dark:text-neutral-500">{c.expiry_date || 'No Expiry'}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                c.verification_status 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15' 
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15'
                              }`}>
                                {c.verification_status ? 'Verified' : 'Invalid'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                              <Link
                                href={`/certificate/${c.certificate_id}`}
                                target="_blank"
                                className="p-2 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                title="View Certificate Page"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                href={`/admin/certificates/${c.id}/edit`}
                                className="p-2 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                title="Edit Credential"
                              >
                                <Edit3 size={16} />
                              </Link>
                              <button
                                onClick={() => handleDeleteCertificate(c.id, c.certificate_id)}
                                className="p-2 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                                title="Delete Certificate"
                              >
                                <Trash2 size={16} />
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
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-gray-400 dark:text-neutral-500 font-bold text-xs">Loading course list...</p>
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 dark:text-neutral-500">
                      <BookOpen size={36} className="mx-auto text-gray-300 dark:text-neutral-750 mb-3" />
                      <p className="font-extrabold text-sm uppercase tracking-wider">No courses found</p>
                      <p className="text-xs mt-1 font-semibold">Add a new course to populate the library.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-neutral-800/40 text-gray-500 dark:text-neutral-300 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-neutral-800">
                          <th className="py-4 px-6">Course Name</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Difficulty Level</th>
                          <th className="py-4 px-6">Total Lessons</th>
                          <th className="py-4 px-6">Syllabus Items</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                        {filteredCourses.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-100/35 dark:hover:bg-neutral-800/30 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <span 
                                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10" 
                                  style={{ backgroundColor: c.color || '#38bdf8' }}
                                />
                                <div>
                                  <p className="font-black text-gray-950 dark:text-white leading-none">{c.title}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-neutral-400 mt-1 max-w-[280px] truncate leading-none">{c.desc_text || 'No description provided'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/80">
                                {c.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-black">Level {c.level}</td>
                            <td className="py-4 px-6 font-black">{c.lessons} lessons</td>
                            <td className="py-4 px-6 text-gray-400 dark:text-neutral-500 font-bold">{c.syllabus?.length || 0} modules</td>
                            <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => { setSelectedCourse(c); setShowCourseModal(true); }}
                                className="p-2 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                                title="Edit Course"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(c.id, c.title)}
                                className="p-2 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                                title="Delete Course"
                              >
                                <Trash2 size={16} />
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
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-gray-400 dark:text-neutral-500 font-bold text-xs">Loading projects list...</p>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 dark:text-neutral-500">
                      <FolderGit size={36} className="mx-auto text-gray-300 dark:text-neutral-750 mb-3" />
                      <p className="font-extrabold text-sm uppercase tracking-wider">No projects found</p>
                      <p className="text-xs mt-1 font-semibold">Build a hardware project kit registry to list.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-neutral-800/40 text-gray-500 dark:text-neutral-300 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-neutral-800">
                          <th className="py-4 px-6">Slug ID</th>
                          <th className="py-4 px-6">Project Title</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Difficulty</th>
                          <th className="py-4 px-6">Duration Estimate</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                        {filteredProjects.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-100/35 dark:hover:bg-neutral-800/30 transition-colors">
                            <td className="py-4 px-6 font-mono font-bold text-gray-500 dark:text-neutral-300">{p.id}</td>
                            <td className="py-4 px-6 font-black text-gray-950 dark:text-white">{p.title}</td>
                            <td className="py-4 px-6 text-gray-400 dark:text-neutral-500">{p.category}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                p.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/15' :
                                p.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15' :
                                'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15'
                              }`}>
                                {p.difficulty}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-black text-gray-500 dark:text-neutral-400">{p.time_est}</td>
                            <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => { setSelectedProject(p); setShowProjectModal(true); }}
                                className="p-2 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                                title="Edit Project"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(p.id, p.title)}
                                className="p-2 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                                title="Delete Project"
                              >
                                <Trash2 size={16} />
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
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-gray-400 dark:text-neutral-500 font-bold text-xs">Loading workshop data...</p>
                    </div>
                  ) : filteredWorkshops.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 dark:text-neutral-500">
                      <CalendarRange size={36} className="mx-auto text-gray-300 dark:text-neutral-750 mb-3" />
                      <p className="font-extrabold text-sm uppercase tracking-wider">No workshops scheduled</p>
                      <p className="text-xs mt-1 font-semibold">Organize local hardware and electronics bootcamps.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-neutral-800/40 text-gray-505 dark:text-neutral-300 font-black uppercase text-[10px] tracking-wider border-b border-gray-150 dark:border-neutral-800">
                          <th className="py-4 px-6">Workshop Program</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Schedule Date</th>
                          <th className="py-4 px-6">Venue/Location</th>
                          <th className="py-4 px-6">Key Focus Modules</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                        {filteredWorkshops.map((w) => (
                          <tr key={w.id} className="hover:bg-gray-100/35 dark:hover:bg-neutral-800/30 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-black text-gray-955 dark:text-white leading-none">{w.title}</p>
                                <p className="text-[10px] text-gray-400 dark:text-neutral-400 mt-1 max-w-[280px] truncate leading-none">{w.desc_text}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/80">
                                {w.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-black">{w.date_text}</td>
                            <td className="py-4 px-6 text-gray-500 dark:text-neutral-400">{w.location}</td>
                            <td className="py-4 px-6 text-gray-400 dark:text-neutral-500 font-bold">{w.highlights?.length || 0} modules</td>
                            <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => { setSelectedWorkshop(w); setShowWorkshopModal(true); }}
                                className="p-2 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                                title="Edit Workshop Details"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteWorkshop(w.id, w.title)}
                                className="p-2 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                                title="Delete Workshop"
                              >
                                <Trash2 size={16} />
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
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-gray-400 dark:text-neutral-500 font-bold text-xs">Loading contact messages...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 dark:text-neutral-500">
                      <Mail size={36} className="mx-auto text-gray-300 dark:text-neutral-750 mb-3" />
                      <p className="font-extrabold text-sm uppercase tracking-wider">Inbox is empty</p>
                      <p className="text-xs mt-1 font-semibold">No messages have been submitted through the portal.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-neutral-800/40 text-gray-500 dark:text-neutral-300 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-neutral-800">
                          <th className="py-4 px-6">Sender Details</th>
                          <th className="py-4 px-6">Email Address</th>
                          <th className="py-4 px-6">Message Subject</th>
                          <th className="py-4 px-6">Brief Excerpt</th>
                          <th className="py-4 px-6">Date Received</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/50 text-gray-700 dark:text-neutral-300">
                        {filteredMessages.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-100/35 dark:hover:bg-neutral-800/30 transition-colors">
                            <td className="py-4 px-6 font-black text-gray-955 dark:text-white">
                              {m.first_name || ''} {m.last_name || ''}
                            </td>
                            <td className="py-4 px-6 font-bold">{m.email}</td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-gray-200 dark:border-neutral-850">
                                {m.subject || 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 dark:text-neutral-500 max-w-[220px] truncate" title={m.message}>
                              {m.message}
                            </td>
                            <td className="py-4 px-6 text-gray-400 dark:text-neutral-500 font-bold">
                              {m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedMessage(m)}
                                className="p-2 inline-block text-gray-400 hover:text-black dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                                title="Open Message Panel"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(m.id, m.email, `${m.first_name || ''} ${m.last_name || ''}`)}
                                className="p-2 inline-block text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                                title="Delete Message"
                              >
                                <Trash2 size={16} />
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
      </div>

      {/* Modals and Overlays */}
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
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-905 dark:text-white uppercase tracking-tight">
                    {selectedMessage.subject || 'General Inquiry'}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1 font-bold">
                    Received: {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : 'N/A'}
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
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs gap-2">
                <div>
                  <span className="font-bold text-gray-400 dark:text-neutral-500 uppercase text-[10px] tracking-wider block">From Sender</span>
                  <span className="font-black text-gray-900 dark:text-white text-base">
                    {selectedMessage.first_name || ''} {selectedMessage.last_name || ''}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 dark:text-neutral-500 uppercase text-[10px] tracking-wider block sm:text-right">Mailbox Contact</span>
                  <a 
                    href={`mailto:${selectedMessage.email}`} 
                    className="font-black text-blue-600 dark:text-blue-400 hover:underline block sm:text-right"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <span className="font-bold text-gray-400 dark:text-neutral-500 uppercase text-[10px] tracking-wider block mb-2">Message Body</span>
                <div className="bg-gray-50 dark:bg-neutral-950/60 border border-gray-100 dark:border-neutral-800/50 rounded-xl p-4 max-h-[300px] overflow-y-auto leading-relaxed text-xs text-gray-700 dark:text-neutral-350 whitespace-pre-wrap select-text font-semibold">
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
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white font-black py-2.5 px-5 rounded-xl transition-all text-xs cursor-pointer border border-gray-200/60 dark:border-neutral-700"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 size={22} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500 leading-relaxed font-bold">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-xl transition-all text-xs cursor-pointer border border-gray-200 dark:border-neutral-700"
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

    </div>
  )
}
