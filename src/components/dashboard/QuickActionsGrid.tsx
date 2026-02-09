import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon, Settings2 } from 'lucide-react';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import ResponsiveGrid from './ResponsiveGrid';
import QuickActionsCustomizer from './QuickActionsCustomizer';

export interface QuickAction {
  id?: string;
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
  userType?: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver' | 'disposal';
  showCustomizer?: boolean;
}

const QuickActionsGrid = ({ 
  actions, 
  title = 'الإجراءات السريعة', 
  subtitle = 'الوظائف الإدارية المستخدمة بكثرة',
  userType,
  showCustomizer = false,
}: QuickActionsGridProps) => {
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();

  const iconSize = getResponsiveClass({
    mobile: 'w-8 h-8',
    tablet: 'w-9 h-9',
    desktop: 'w-10 h-10',
  });

  const iconInnerSize = getResponsiveClass({
    mobile: 'w-4 h-4',
    tablet: 'w-4.5 h-4.5',
    desktop: 'w-5 h-5',
  });

  const titleClass = getResponsiveClass({
    mobile: 'text-sm',
    tablet: 'text-sm',
    desktop: 'text-base',
  });

  const subtitleClass = getResponsiveClass({
    mobile: 'text-[10px]',
    tablet: 'text-xs',
    desktop: 'text-xs',
  });

  return (
    <Card>
      <CardHeader className="text-right pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} text-primary`}>{title}</CardTitle>
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>{subtitle}</CardDescription>
          </div>
          {showCustomizer && userType && (
            <QuickActionsCustomizer 
              userType={userType}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  {!isMobile && <span>تخصيص</span>}
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 4 }} gap="sm">
          <AnimatePresence mode="popLayout">
            {actions.map((action, index) => (
              <motion.div
                key={action.id || `${action.title}-${index}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02, y: -2 }}
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
                <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-card group">
                  <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                    <div className="flex items-start justify-between gap-2">
                      <motion.div 
                        className={`${iconSize} rounded-lg flex items-center justify-center shrink-0 ${action.iconBgClass || 'bg-primary/10'} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <action.icon className={`${iconInnerSize} ${action.iconBgClass ? 'text-white' : 'text-primary'}`} />
                      </motion.div>
                      <div className="flex-1 text-right min-w-0">
                        <h3 className={`font-semibold text-foreground group-hover:text-primary transition-colors truncate ${titleClass}`}>{action.title}</h3>
                        <p className={`text-muted-foreground mt-0.5 line-clamp-2 ${subtitleClass}`}>{action.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </ResponsiveGrid>
      </CardContent>
    </Card>
  );
};

export default QuickActionsGrid;
