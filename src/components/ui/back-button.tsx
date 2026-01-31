import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './button';

interface BackButtonProps {
  label?: string;
  fallbackPath?: string;
  className?: string;
}

const BackButton = ({ 
  label = 'رجوع', 
  fallbackPath = '/dashboard',
  className = ''
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Always try to go back first, fallback if no history
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        {label}
      </Button>
    </motion.div>
  );
};

export default BackButton;
