import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface QuickAction {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
  iconBgClass?: string;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  title?: string;
  subtitle?: string;
}

const QuickActionsGrid = ({ 
  actions, 
  title = 'الإجراءات السريعة', 
  subtitle = 'الوظائف الإدارية المستخدمة بكثرة' 
}: QuickActionsGridProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={`${action.title}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => {
                if (action.onClick) {
                  action.onClick();
                } else if (action.path) {
                  navigate(action.path);
                }
              }}
            >
              <Card className="h-full border hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <motion.div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${action.iconBgClass || 'bg-primary/10'} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <action.icon className={`w-5 h-5 ${action.iconBgClass ? 'text-white' : 'text-primary'}`} />
                    </motion.div>
                    <div className="flex-1 text-right">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{action.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsGrid;
