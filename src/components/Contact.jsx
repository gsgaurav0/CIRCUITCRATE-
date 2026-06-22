import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { postToSupabase } from '../lib/supabase';
import './Contact.css';

const Contact = () => {
    const location = useLocation();
    const [subject, setSubject] = useState('general');
    const [isOpen, setIsOpen] = useState(false);

    // Form inputs state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    // Status states
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const options = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'support', label: 'Technical Support' },
        { value: 'partner', label: 'Partner With Us / Host a Workshop' },
        { value: 'feedback', label: 'Feedback & Suggestions' }
    ];

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const subjectParam = queryParams.get('subject');
        if (subjectParam === 'partner') {
            setSubject('partner');
        } else if (subjectParam) {
            setSubject(subjectParam);
        }
    }, [location.search]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.custom-select-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(false);

        const data = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            subject: options.find(opt => opt.value === subject)?.label || 'General Inquiry',
            message: message.trim()
        };

        const res = await postToSupabase('messages', data);
        setSubmitting(false);

        if (res) {
            setSuccess(true);
            setFirstName('');
            setLastName('');
            setEmail('');
            setMessage('');
        } else {
            setError('Failed to send message. Please check your connection and try again.');
        }
    };

    return (
        <section className="contact-section" id="contact">
            <div className="container contact-wrapper">
                {/* Left Side: Typography */}
                <div className="contact-text">
                    <h2 className="contact-title">
                        LET'S<br />
                        GET IN<br />
                        TOUCH
                    </h2>
                    <p className="contact-description">
                        We'd love to hear from you! Whether you have questions, feedback, or need support, feel free to reach out to us.
                    </p>
                </div>

                {/* Right Side: Form */}
                <div className="contact-form-container">
                    <form className="contact-form" onSubmit={handleSubmit}>
                        {success && (
                            <div className="p-4 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex gap-2 items-center">
                                <CheckCircle2 size={18} className="shrink-0" />
                                <span>Message sent successfully! We will contact you soon.</span>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-center">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group half-width">
                                <label htmlFor="firstName">First Name</label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    required 
                                    value={firstName} 
                                    onChange={(e) => setFirstName(e.target.value)} 
                                />
                            </div>
                            <div className="form-group half-width">
                                <label htmlFor="lastName">Last Name</label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    required 
                                    value={lastName} 
                                    onChange={(e) => setLastName(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>

                        <div className="form-group custom-select-container">
                            <label>Subject</label>
                            <div 
                                className="custom-select-trigger" 
                                onClick={() => setIsOpen(!isOpen)}
                            >
                                <span>{options.find(opt => opt.value === subject)?.label || 'Select Subject'}</span>
                                <motion.span 
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="custom-select-arrow"
                                >
                                    <ChevronDown size={18} />
                                </motion.span>
                            </div>
                            <input type="hidden" name="subject" value={subject} />
                            
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.ul 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="custom-select-options"
                                    >
                                        {options.map((option) => (
                                            <li 
                                                key={option.value}
                                                className={`custom-select-option ${subject === option.value ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setSubject(option.value);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {option.label}
                                            </li>
                                        ))}
                                    </motion.ul>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                rows="5" 
                                required 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="contact-submit-btn flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? 'Sending...' : 'Send Message'} 
                            {!submitting && <Send size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
