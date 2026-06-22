import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Cpu, Activity, LogOut, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { coursesData } from '../data/coursesData';
import { projectsData } from '../data/projectsData';

const Profile = () => {
    const { user, signOut, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('courses');

    // Redirect to login if user is not authenticated
    useEffect(() => {
        if (!user && !loading) {
            navigate('/auth');
        }
    }, [user, loading, navigate]);

    if (loading || !user) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-4 border-gray-800 border-t-red-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Mock enrolled courses with progress
    const enrolledCourses = [
        {
            ...coursesData[0], // Foundations of Electronics
            progress: 80,
            lastAccessed: '2 hours ago',
            status: 'In Progress'
        },
        {
            ...coursesData[1], // Arduino Masterclass
            progress: 40,
            lastAccessed: 'Yesterday',
            status: 'In Progress'
        },
        {
            ...coursesData[4], // 3D Printing Basics
            progress: 100,
            lastAccessed: '3 days ago',
            status: 'Completed'
        }
    ];

    // Mock active projects with step progress
    const activeProjects = [
        {
            ...projectsData[0], // LED Circuit Logic
            completedSteps: 5,
            totalSteps: 5,
            status: 'Completed',
            lastUpdated: 'June 20, 2026'
        },
        {
            ...projectsData[3], // Smart Night Light
            completedSteps: 3,
            totalSteps: 5,
            status: 'In Progress',
            lastUpdated: 'June 22, 2026'
        }
    ];

    // Mock activity timeline
    const activities = [
        {
            id: 1,
            title: 'Started Smart Night Light project',
            description: 'Completed transistor-based LDR trigger configuration.',
            date: 'Today, 2:15 PM',
            icon: Cpu,
            color: 'text-sky-400 bg-sky-500/10'
        },
        {
            id: 2,
            title: 'Enrolled in Arduino Masterclass',
            description: 'Started beginner hardware coding modules.',
            date: 'Yesterday, 10:30 AM',
            icon: BookOpen,
            color: 'text-purple-400 bg-purple-500/10'
        },
        {
            id: 3,
            title: 'Completed 3D Printing Basics Course',
            description: 'Final design files exported and verified successfully.',
            date: 'June 19, 2026',
            icon: CheckCircle,
            color: 'text-emerald-400 bg-emerald-500/10 animate-pulse'
        },
        {
            id: 4,
            title: 'Joined CircuitCrate Platform',
            description: 'Account created and authenticated.',
            date: 'June 18, 2026',
            icon: Activity,
            color: 'text-rose-400 bg-rose-500/10'
        }
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8 font-[sans-serif]">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* 1. Header Profile Card */}
                <div className="relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                    <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-2xl font-bold tracking-wider shadow-lg shadow-red-500/20">
                            {initials}
                        </div>
                        {/* User Details */}
                        <div className="space-y-1">
                            <h1 className="text-3xl font-extrabold tracking-tight">{displayName}</h1>
                            <p className="text-zinc-400 text-sm">{user.email}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-full text-xs font-semibold text-zinc-300 border border-zinc-700/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active Learner
                            </div>
                        </div>
                    </div>
                    {/* Logout Button */}
                    <button
                        onClick={handleSignOut}
                        className="px-5 py-3 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/80 rounded-xl text-zinc-300 hover:text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>

                {/* 2. Tabs Selector */}
                <div className="flex border-b border-zinc-800/80">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`py-4 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'courses'
                                ? 'border-red-500 text-red-500 bg-red-500/5'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <BookOpen size={16} />
                        Courses ({enrolledCourses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`py-4 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'projects'
                                ? 'border-red-500 text-red-500 bg-red-500/5'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Cpu size={16} />
                        Projects ({activeProjects.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`py-4 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'activities'
                                ? 'border-red-500 text-red-500 bg-red-500/5'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Activity size={16} />
                        Activity Logs
                    </button>
                </div>

                {/* 3. Tab Contents */}
                <div className="mt-6">
                    {/* Courses Tab */}
                    {activeTab === 'courses' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {enrolledCourses.map((course) => (
                                <div key={course.id} className="group p-5 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl flex gap-4 transition-all duration-300">
                                    <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 space-y-3 min-w-0">
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="px-2 py-0.5 bg-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider rounded">
                                                    {course.category}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {course.lastAccessed}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-red-500 transition-colors truncate mt-1">
                                                {course.title}
                                            </h3>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span>Progress</span>
                                                <span className="font-bold">{course.progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <button className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-0.5 group-hover:gap-1 transition-all cursor-pointer">
                                            {course.status === 'Completed' ? 'Review Lessons' : 'Resume Learning'}
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Projects Tab */}
                    {activeTab === 'projects' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeProjects.map((project) => (
                                <div key={project.id} className="group p-5 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                                            <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 bg-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider rounded">
                                                    {project.category}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                                                    project.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    project.difficulty === 'Intermediate' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {project.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-red-500 transition-colors truncate mt-1">
                                                {project.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Step completion counter */}
                                        <div className="flex items-center justify-between text-xs text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={14} className={project.status === 'Completed' ? 'text-emerald-400' : 'text-zinc-500'} />
                                                Steps Completed
                                            </span>
                                            <span className="font-bold">{project.completedSteps}/{project.totalSteps}</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    project.status === 'Completed' ? 'bg-emerald-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${(project.completedSteps / project.totalSteps) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                                        <span className="text-zinc-500">Updated {project.lastUpdated}</span>
                                        <button className="font-bold text-red-500 hover:text-red-400 cursor-pointer">
                                            {project.status === 'Completed' ? 'Rebuild Guide' : 'Continue Project'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="bg-zinc-900/20 border border-zinc-800/85 rounded-2xl p-6 relative">
                            <div className="absolute left-9 top-8 bottom-8 w-[2px] bg-zinc-800 pointer-events-none" />
                            <div className="space-y-8">
                                {activities.map((act) => {
                                    const IconComponent = act.icon;
                                    return (
                                        <div key={act.id} className="relative flex gap-4 items-start pl-8 group">
                                            {/* Icon Indicator */}
                                            <div className={`absolute left-[7px] w-6 h-6 rounded-full flex items-center justify-center border border-zinc-950 ${act.color} z-[1] transition-transform duration-300 group-hover:scale-110`}>
                                                <IconComponent size={12} />
                                            </div>
                                            {/* Details */}
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <h4 className="font-bold text-zinc-100 group-hover:text-red-500 transition-colors text-sm md:text-base">
                                                        {act.title}
                                                    </h4>
                                                    <span className="text-xs text-zinc-500">{act.date}</span>
                                                </div>
                                                <p className="text-xs md:text-sm text-zinc-400">{act.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;
