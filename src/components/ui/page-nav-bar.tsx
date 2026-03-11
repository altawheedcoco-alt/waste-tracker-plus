import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';
import { Button } from './button';

interface PageNavBarProps {
  backLabel?: string;
  homeLabel?: string;
  className?: string;
}

const PageNavBar = ({
  backLabel = 'رجوع',
  homeLabel = 'الصفحة الرئيسية',
  className = '',
}: PageNavBarProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        {backLabel}
      </Button>
      <span className="text-border">|</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        {homeLabel}
      </Button>
    </motion.div>
  );
};

export default PageNavBar;
