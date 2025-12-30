// components/MotionDiv.js
import { motion } from "framer-motion";

export default function MotionDiv({ children, className = "", ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}