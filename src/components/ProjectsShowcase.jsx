import React, { useState, useEffect } from 'react';
import { projectsData } from '../data/projectsData';
import { fetchFromSupabase, resolveImageUrl } from '../lib/supabase';
import { fetchProjectsFromSanity } from '../lib/sanity';
import { Clock, Wrench, X, PlayCircle, CheckCircle2 } from 'lucide-react';
import './ProjectsShowcase.css';

const ProjectsShowcase = () => {
    const [projects, setProjects] = useState(projectsData);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeProject, setActiveProject] = useState(null);

    useEffect(() => {
        const loadProjects = async () => {
            // 1. Attempt loading from Sanity CMS first
            const sanityData = await fetchProjectsFromSanity();
            if (sanityData && sanityData.length > 0) {
                const mapped = sanityData.map(p => ({
                    id: p._id,
                    title: p.title,
                    category: p.category,
                    difficulty: p.difficulty,
                    time: p.time_est,
                    desc: p.desc_text,
                    image: p.image,
                    tools: p.tools || [],
                    steps: p.steps || []
                }));
                setProjects(mapped);
                return;
            }

            // 2. Fallback to Supabase
            const data = await fetchFromSupabase('projects');
            if (data && data.length > 0) {
                const mapped = data.map(p => ({
                    ...p,
                    time: p.time_est,
                    desc: p.desc_text
                }));
                setProjects(mapped);
            }
        };
        loadProjects();
    }, []);

    const categories = ['All', ...new Set(projects.map(p => p.category))];

    const filteredProjects = selectedCategory === 'All'
        ? projects
        : projects.filter(p => p.category === selectedCategory);

    const projectSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Robotics & Electronics Projects",
        "description": "Hands-on projects from LED basics to IoT weather stations.",
        "url": "https://www.circuitcrate.in/learning",
        "numberOfItems": projects.length,
        "itemListElement": projects.map((project, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Course",
                "name": project.title,
                "description": project.desc,
                "provider": {
                    "@type": "Organization",
                    "name": "CircuitCrate",
                    "url": "https://www.circuitcrate.in"
                }
            }
        }))
    };

    return (
        <section className="showcase-section">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }} />
            <div className="container mx-auto">
                <div className="showcase-header">
                    <h1 className="showcase-main-title">Build Real Robotics Projects — Step by Step</h1>
                    <p className="showcase-description">12 hands-on projects from LED basics to IoT weather stations. Free, self-paced, with mentor support.</p>

                    <div className="filter-container">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="projects-grid">
                    {filteredProjects.map((project) => (
                        <div key={project.id} className="showcase-card">
                            <div className="card-image-wrapper">
                                <img src={resolveImageUrl(project.image)} alt={project.title} loading="lazy" />
                                <span className="difficulty-badge">{project.difficulty}</span>
                            </div>

                            <div className="card-content">
                                <span className="card-category">{project.category}</span>
                                <h3 className="card-title">{project.title}</h3>
                                <p className="card-desc">{project.desc}</p>

                                <div className="card-footer">
                                    <div className="time-Estimate">
                                        <Clock size={16} />
                                        {project.time}
                                    </div>
                                    <button
                                        className="build-btn"
                                        onClick={() => setActiveProject(project)}
                                    >
                                        Build This <PlayCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Modal */}
            {activeProject && (
                <div className="modal-overlay" onClick={() => setActiveProject(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <img src={resolveImageUrl(activeProject.image)} alt={activeProject.title} />
                            <button className="close-btn" onClick={() => setActiveProject(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <h3 className="modal-title">{activeProject.title}</h3>

                            <div className="steps-container">
                                <div className="tools-column">
                                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Wrench size={20} className="text-blue-400" /> Required Tools
                                    </h4>
                                    <div className="tools-list">
                                        <ul>
                                            {activeProject.tools.map((tool, idx) => (
                                                <li key={idx}>
                                                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                                                    {tool}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="instructions-column">
                                    <h4 className="text-xl font-bold text-white mb-4">How to Build</h4>
                                    <div className="instruction-steps">
                                        <ol>
                                            {activeProject.steps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProjectsShowcase;
