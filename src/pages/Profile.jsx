import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
    BookOpen, Cpu, Award, Settings, LogOut, CheckCircle, 
    Clock, ChevronRight, User, ExternalLink, Download, FileText, Camera 
} from 'lucide-react';
import { coursesData } from '../data/coursesData';
import { projectsData } from '../data/projectsData';

const Profile = () => {
    const { user, signOut, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dbCertificates, setDbCertificates] = useState([]);
    const [loadingCerts, setLoadingCerts] = useState(true);

    const [avatarUrl, setAvatarUrl] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [interestInput, setInterestInput] = useState('Student');
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setAvatarUrl(user?.user_metadata?.avatar_url || '');
            setNameInput(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '');
            setInterestInput(user?.user_metadata?.interest || 'Student');
        }
    }, [user]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setProfileError('Please upload an image file.');
            return;
        }

        setUpdatingProfile(true);
        setProfileError('');
        setProfileSuccess('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

                supabase.auth.updateUser({
                    data: { avatar_url: dataUrl }
                }).then(({ error }) => {
                    if (error) {
                        setProfileError(error.message);
                    } else {
                        setAvatarUrl(dataUrl);
                        setProfileSuccess('Profile picture updated successfully!');
                    }
                    setUpdatingProfile(false);
                }).catch((err) => {
                    setProfileError(err.message || 'Failed to upload profile picture.');
                    setUpdatingProfile(false);
                });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: nameInput.trim(),
                    interest: interestInput
                }
            });

            if (error) throw error;
            setProfileSuccess('Profile updated successfully!');
        } catch (err) {
            setProfileError(err.message || 'Failed to update profile settings.');
        } finally {
            setUpdatingProfile(false);
        }
    };

    // Redirect to login if user is not authenticated
    useEffect(() => {
        if (!user && !loading) {
            navigate('/auth');
        }
    }, [user, loading, navigate]);

    // Fetch user certificates from Supabase
    useEffect(() => {
        const fetchCertificates = async () => {
            if (!user) return;
            try {
                setLoadingCerts(true);
                const { data, error } = await supabase
                    .from('certificates')
                    .select('*')
                    .eq('candidate_email', user.email);

                if (error) throw error;
                setDbCertificates(data || []);
            } catch (err) {
                console.warn('Failed to fetch certificates from Supabase:', err);
            } finally {
                setLoadingCerts(false);
            }
        };

        if (user) {
            fetchCertificates();
        }
    }, [user]);

    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (!user) return;
        const list = [
            {
                id: 'register',
                title: 'Joined CircuitCrate',
                description: 'Account successfully registered and verified.',
                date: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                timestamp: new Date(user.created_at).getTime()
            }
        ];

        dbCertificates.forEach(cert => {
            list.push({
                id: cert.id,
                title: `Earned Certificate: ${cert.certificate_title}`,
                description: `Verified certificate ID ${cert.certificate_id} issued.`,
                date: new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                timestamp: new Date(cert.issue_date).getTime()
            });
        });

        list.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(list);
    }, [user, dbCertificates]);

    if (loading || !user) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-4 border-gray-800 border-t-red-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const displayName = nameInput || 'User';
    const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Calculate active days since registration
    const activeDays = Math.max(1, Math.ceil((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)));

    // Derive real completed courses from Supabase certificates
    const completedCourses = dbCertificates
        .filter(c => c.certificate_type === 'course' || !c.certificate_type)
        .map(cert => {
            const match = coursesData.find(cd => cd.title.toLowerCase() === cert.certificate_title.toLowerCase());
            return {
                id: cert.id,
                title: cert.certificate_title,
                category: match?.category || 'Electronics',
                image: match?.image || '',
                color: match?.color || '#ef4444',
                progress: 100,
                status: 'Completed',
                lastAccessed: new Date(cert.issue_date).toLocaleDateString()
            };
        });

    // Derive real completed projects from certificates
    const completedProjects = dbCertificates
        .filter(c => c.certificate_type === 'project')
        .map(cert => {
            const match = projectsData.find(pd => pd.title.toLowerCase() === cert.certificate_title.toLowerCase());
            return {
                id: cert.id,
                title: cert.certificate_title,
                category: match?.category || 'Hardware',
                image: match?.image || '',
                difficulty: match?.difficulty || 'Intermediate',
                completedSteps: 5,
                totalSteps: 5,
                status: 'Completed',
                lastUpdated: new Date(cert.issue_date).toLocaleDateString()
            };
        });

    const certificatesToDisplay = dbCertificates;

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-16 px-4 md:px-8 font-[sans-serif]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* COLUMN 1: LEFT SIDEBAR NAVIGATION */}
                <div className="lg:col-span-3 space-y-6">
                    {/* App Identity Box Removed */} 

                    {/* Sidebar Buttons */}
                    <div 
                        className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-2 lg:p-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 lg:gap-1 space-y-0 lg:space-y-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`w-auto lg:w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center lg:justify-start gap-2 lg:gap-3 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === 'dashboard'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                            }`}
                        >
                            <User size={16} />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`w-auto lg:w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center lg:justify-start gap-2 lg:gap-3 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === 'courses'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                            }`}
                        >
                            <BookOpen size={16} />
                            My Courses
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`w-auto lg:w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center lg:justify-start gap-2 lg:gap-3 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === 'projects'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                            }`}
                        >
                            <Cpu size={16} />
                            My Projects
                        </button>
                        <button
                            onClick={() => setActiveTab('certificates')}
                            className={`w-auto lg:w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center lg:justify-start gap-2 lg:gap-3 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === 'certificates'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                            }`}
                        >
                            <Award size={16} />
                            Certificates
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-auto lg:w-full py-2.5 lg:py-3 px-3 lg:px-4 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center lg:justify-start gap-2 lg:gap-3 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === 'settings'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                            }`}
                        >
                            <Settings size={16} />
                            Settings
                        </button>
                    </div>
                </div>

                {/* COLUMN 2: MAIN DYNAMIC CONTENT */}
                <div className="lg:col-span-6 space-y-8 min-w-0">
                    
                    {/* TAB: DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            {/* Profile Header Greeting */}
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase">Profile</h1>
                                <p className="text-zinc-400 text-sm mt-1">Welcome back to your dashboard! Here to check your activity you done!</p>
                            </div>

                            {/* Active Course Carousel Cards */}
                            {completedCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {completedCourses.map((c) => (
                                        <div key={c.id} className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-4 hover:border-zinc-700/80 transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold tracking-wide text-zinc-500">{c.category}</span>
                                                <span className="text-xs font-semibold text-emerald-400">{c.progress}%</span>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-extrabold text-sm text-zinc-100 truncate">{c.title}</h4>
                                                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">Completed on {c.lastAccessed}</p>
                                            </div>
                                            <div className="w-full h-1 bg-zinc-850 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full bg-emerald-500" 
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 bg-gradient-to-r from-red-950/20 to-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-3">
                                    <h3 className="font-extrabold text-lg text-white">Start Your Learning Journey</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                                        You haven't completed any courses yet. Browse our interactive curriculum, complete lessons, and unlock your first verified certificate!
                                    </p>
                                    <Link 
                                        to="/courses"
                                        className="inline-flex px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wide cursor-pointer"
                                    >
                                        Explore Courses
                                    </Link>
                                </div>
                            )}

                            {/* Bottom Split Layout: Activity logs & Certificates Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Side: Activity Logs */}
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4">
                                    <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-tight">Activity Log</h3>
                                    <div className="space-y-4">
                                        {activities.length > 0 ? (
                                            activities.map((act) => (
                                                <div key={act.id} className="flex gap-3 items-start">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                    <div className="space-y-0.5">
                                                        <h5 className="font-extrabold text-sm text-zinc-200">{act.title}</h5>
                                                        <p className="text-xs text-zinc-400">{act.description}</p>
                                                        <span className="text-[10px] text-zinc-555 block">{act.date}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-zinc-500">No recent activity logs.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Latest Certificate summary */}
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl flex flex-col justify-between gap-4">
                                    {certificatesToDisplay.length > 0 ? (
                                        <>
                                            <div className="space-y-2">
                                                <div className="inline-flex px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider">
                                                    Latest Certificate
                                                </div>
                                                <h3 className="text-xl font-extrabold text-white leading-tight">
                                                    {certificatesToDisplay[0].certificate_title}
                                                </h3>
                                                <p className="text-xs text-zinc-400">
                                                    ID: {certificatesToDisplay[0].certificate_id} • Issued on {certificatesToDisplay[0].issue_date}
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle size={14} />
                                                    Verified Certificate
                                                </span>
                                                <button 
                                                    onClick={() => setActiveTab('certificates')}
                                                    className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                                                >
                                                    View All
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <div className="inline-flex px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] uppercase font-bold tracking-wider">
                                                    Latest Certificate
                                                </div>
                                                <h3 className="text-lg font-extrabold text-white leading-tight">
                                                    No certificates earned yet
                                                </h3>
                                                <p className="text-xs text-zinc-400">
                                                    Complete courses and pass evaluations to receive your verified certifications here.
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
                                                <Link 
                                                    to="/courses"
                                                    className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                                                >
                                                    Browse Courses
                                                    <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'courses' && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white uppercase">My Courses</h1>
                                <p className="text-zinc-400 text-sm mt-1">Review your completed courses.</p>
                            </div>
                            {completedCourses.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {completedCourses.map((course) => (
                                        <div key={course.id} className="group p-5 bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl flex flex-col sm:flex-row gap-4 transition-all duration-300">
                                            {course.image && (
                                                <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-3 min-w-0">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="px-2 py-0.5 bg-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider rounded">
                                                            {course.category}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-555 flex items-center gap-1">
                                                            <Clock size={12} />
                                                            Completed {course.lastAccessed}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg text-white group-hover:text-red-500 transition-colors truncate mt-1">
                                                        {course.title}
                                                    </h3>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                                        <span>Progress</span>
                                                        <span className="font-bold text-emerald-400">100%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-emerald-500"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4">
                                    <p className="text-zinc-400 text-sm">No courses completed yet.</p>
                                    <Link 
                                        to="/courses"
                                        className="inline-flex px-4 py-2 bg-red-650 hover:bg-red-550 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Start Learning
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: MY PROJECTS */}
                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white uppercase">Hardware Projects</h1>
                                <p className="text-zinc-400 text-sm mt-1">Review your completed hardware projects.</p>
                            </div>
                            {completedProjects.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {completedProjects.map((project) => (
                                        <div key={project.id} className="p-5 bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl space-y-4 transition-all duration-300">
                                            <div className="flex gap-4">
                                                {project.image && (
                                                    <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 bg-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider rounded">
                                                            {project.category}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
                                                            {project.difficulty}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg text-white mt-1 truncate">
                                                        {project.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-zinc-400">
                                                    <span>Steps Completed</span>
                                                    <span>5/5</span>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-850 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-500"
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4">
                                    <p className="text-zinc-400 text-sm">No hardware projects built yet.</p>
                                    <Link 
                                        to="/learning"
                                        className="inline-flex px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Explore Projects
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: CERTIFICATES */}
                    {activeTab === 'certificates' && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white uppercase">My Certifications</h1>
                                <p className="text-zinc-400 text-sm mt-1">Verified course completions and rewards.</p>
                            </div>

                            {loadingCerts ? (
                                <div className="py-8 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                certificatesToDisplay.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {certificatesToDisplay.map((cert) => (
                                            <div key={cert.id} className="p-5 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4 hover:border-zinc-700/80 transition-all duration-300">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                                                            <Award size={24} />
                                                        </div>
                                                        <div>
                                                            <span className="px-2 py-0.5 bg-zinc-800 text-[9px] uppercase font-bold text-zinc-400 tracking-wider rounded">
                                                                {cert.certificate_type || 'Course Completion'}
                                                            </span>
                                                            <h3 className="font-extrabold text-lg text-white mt-1">
                                                                {cert.certificate_title}
                                                            </h3>
                                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                                ID: {cert.certificate_id} • Issued {cert.issue_date}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        <CheckCircle size={10} />
                                                        {cert.verification_status ? 'Verified' : 'Pending'}
                                                    </span>
                                                </div>

                                                <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3 justify-end">
                                                    {cert.certificate_pdf_url && cert.certificate_pdf_url !== '#' && (
                                                        <a
                                                            href={cert.certificate_pdf_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                                                        >
                                                            <Download size={14} />
                                                            Download PDF
                                                        </a>
                                                    )}
                                                    <Link
                                                        to={`/certificate/${cert.certificate_id}`}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                                                    >
                                                        <FileText size={14} />
                                                        View Details
                                                        <ExternalLink size={12} />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
                                        <p className="text-zinc-400 text-sm">No verified certificates found on your account.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* TAB: SETTINGS */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-white uppercase">Profile Settings</h1>
                                <p className="text-zinc-400 text-sm mt-1">Manage your account information and preferences.</p>
                            </div>

                            {profileError && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {profileError}
                                </div>
                            )}

                            {profileSuccess && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                                    {profileSuccess}
                                </div>
                            )}

                            <form onSubmit={handleSaveProfile} className="p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4">
                                {/* Profile Picture Upload Section in Settings */}
                                <div className="space-y-2 border-b border-zinc-800/80 pb-4 flex items-center gap-4">
                                    <div className="relative group/settings-avatar cursor-pointer" onClick={() => document.getElementById('avatar-upload-settings-input').click()}>
                                        {avatarUrl ? (
                                            <img 
                                                src={avatarUrl} 
                                                alt="Profile" 
                                                className="w-16 h-16 rounded-full object-cover border border-zinc-800 group-hover/settings-avatar:opacity-60 transition-all"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-2xl font-extrabold text-white group-hover/settings-avatar:opacity-85 transition-all">
                                                {initials}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/settings-avatar:opacity-100 transition-opacity">
                                            <Camera size={14} className="text-white" />
                                            <span className="text-[8px] uppercase font-bold tracking-wider text-white mt-0.5">Upload</span>
                                        </div>
                                        <input 
                                            type="file" 
                                            id="avatar-upload-settings-input" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200">Profile Picture</h4>
                                        <button 
                                            type="button"
                                            onClick={() => document.getElementById('avatar-upload-settings-input').click()}
                                            className="text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer bg-transparent border-0 p-0"
                                        >
                                            Change avatar
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={nameInput} 
                                        onChange={(e) => setNameInput(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500" 
                                        required
                                    />
                                    <p className="text-[10px] text-zinc-500">This name will be displayed on your profile and certificates.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Primary Interest / Role</label>
                                    <select
                                        value={interestInput}
                                        onChange={(e) => setInterestInput(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 cursor-pointer"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Hobbyist">Hobbyist</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Educator">Educator</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email Address</label>
                                    <input 
                                        type="text" 
                                        value={user.email} 
                                        disabled
                                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-555 cursor-not-allowed" 
                                    />
                                    <p className="text-[10px] text-zinc-600">Email addresses cannot be modified directly.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Registered Account Date</label>
                                    <input 
                                        type="text" 
                                        value={new Date(user.created_at).toLocaleDateString()} 
                                        disabled
                                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-555 cursor-not-allowed" 
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={updatingProfile}
                                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer border-0"
                                >
                                    {updatingProfile ? 'Saving Changes...' : 'Save Settings'}
                                </button>
                            </form>
                        </div>
                    )}

                </div>

                {/* COLUMN 3: RIGHT USER PANEL CARD */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
                        
                        {/* Profile Details header */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group/avatar cursor-pointer" onClick={() => document.getElementById('avatar-upload-input').click()}>
                                {avatarUrl ? (
                                    <img 
                                        src={avatarUrl} 
                                        alt="Profile" 
                                        className="w-20 h-20 rounded-full object-cover border-2 border-zinc-800 shadow-xl group-hover/avatar:opacity-60 transition-all"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-red-500/20 group-hover/avatar:opacity-85 transition-all">
                                        {initials}
                                    </div>
                                )}
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                    <Camera size={18} className="text-white" />
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-white mt-0.5">Upload</span>
                                </div>
                                <input 
                                    type="file" 
                                    id="avatar-upload-input" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="font-extrabold text-xl text-white tracking-tight">{displayName}</h3>
                                <p className="text-xs text-zinc-555 font-medium">{user.email}</p>
                                <span className="inline-block px-2.5 py-0.5 mt-1 rounded bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    {interestInput}
                                </span>
                            </div>
                        </div>

                        {/* Stats Counter Matrix */}
                        <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80">
                            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-500">enrolled</span>
                                <h4 className="font-extrabold text-lg text-zinc-100">{completedCourses.length}</h4>
                            </div>
                            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-500">projects</span>
                                <h4 className="font-extrabold text-lg text-zinc-100">{completedProjects.length}</h4>
                            </div>
                            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-500">certificates</span>
                                <h4 className="font-extrabold text-lg text-zinc-100">{certificatesToDisplay.length}</h4>
                            </div>
                            <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-500">active days</span>
                                <h4 className="font-extrabold text-lg text-zinc-100">{activeDays}</h4>
                            </div>
                        </div>

                        {/* Logout action */}
                        <button
                            onClick={handleSignOut}
                            className="w-full mt-4 py-3 bg-zinc-950/80 hover:bg-red-500/10 border border-zinc-850 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                        >
                            <LogOut size={14} />
                            Log Out Account
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
