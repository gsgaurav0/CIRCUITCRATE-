import { FaInstagram, FaXTwitter, FaLinkedin, FaGithub } from "react-icons/fa6";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-brand">
                    <h3>CircuitCrate</h3>
                    <p>Empowering the next generation of makers.</p>
                </div>

                <div className="footer-socials flex gap-4 text-2xl">
                    <a href="https://www.instagram.com/circuitcrate_" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                        <FaInstagram />
                    </a>
                    <a href="https://x.com/circuit_crate" aria-label="Twitter" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                        <FaXTwitter />
                    </a>
                    <a href="https://www.linkedin.com/company/circuitcrate1/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
                        <FaLinkedin />
                    </a>
                    <a href="https://github.com/circuitcrate" aria-label="GitHub" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 transition-colors">
                        <FaGithub />
                    </a>
                </div>

                <div className="footer-copyright">
                    &copy; {new Date().getFullYear()} CircuitCrate. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
