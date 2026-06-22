import React from 'react';
import { Outlet } from 'react-router-dom';
import StaggeredMenu from './StaggeredMenu';
import Footer from './Footer';
import logo from '../assets/c2_logo.png';

const Layout = () => {


    const menuItems = [
        { label: 'Home', ariaLabel: 'Home', link: '/' },
        { label: 'Courses', ariaLabel: 'Our Courses', link: '/courses' },
        { label: 'Projects', ariaLabel: 'Projects', link: '/learning' },
        { label: 'Workshops', ariaLabel: 'Events', link: '/workshops' },
        { label: 'Contact', ariaLabel: 'Contact', link: '/contact' },
        { label: 'Login', ariaLabel: 'Login', link: '/auth' }
    ];

    const socialItems = [
        { label: 'Instagram', link: 'https://www.instagram.com/circuitcrate_' },
        { label: 'Twitter', link: 'https://x.com/circuit_crate' },
        { label: 'LinkedIn', link: 'https://www.linkedin.com/company/circuitcrate1/' },
        { label: 'GitHub', link: 'https://github.com/circuitcrate' }
    ];

    return (
        <div className="layout">
            <StaggeredMenu
                position="right"
                items={menuItems}
                socialItems={socialItems}
                displaySocials={false}
                displayItemNumbering={true}
                menuButtonColor="#ffffff"
                openMenuButtonColor="#000000"
                changeMenuColorOnOpen={true}
                colors={['#38bdf8', '#3b82f6', '#2563eb']}
                logoUrl={logo}
                accentColor="#38bdf8"
                isFixed={true}
                onMenuOpen={() => console.log('Menu opened')}
                onMenuClose={() => console.log('Menu closed')}
            />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
