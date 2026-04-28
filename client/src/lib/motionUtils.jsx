import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── Global Physics Configuration ────────────────────
export const springConfig = {
  type: "spring",
  stiffness: 100,
  damping: 20
};

// ── Page Transitions ────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: springConfig },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } }
};

// ── Grid / List Stagger Configuration ───────────────
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: springConfig }
};

// ── Wrapper Components for Buttons ──────────────────
export const AnimatedButton = ({ children, className, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={springConfig}
    className={className}
    {...props}
  >
    {children}
  </motion.button>
);

const MotionLink = motion(Link);

export const AnimatedLink = ({ children, className, ...props }) => (
  <MotionLink
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={springConfig}
    className={className}
    {...props}
  >
    {children}
  </MotionLink>
);
