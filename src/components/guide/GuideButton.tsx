import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Truck, Recycle, Factory, User, ChevronDown, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const roles = [
  {
    id: "generator",
    title: "دليل المولد",
    description: "الشركات المنتجة للنفايات",
    icon: Factory,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "transporter",
    title: "دليل الناقل",
    description: "شركات نقل النفايات",
    icon: Truck,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "recycler",
    title: "دليل المدور",
    description: "مصانع إعادة التدوير",
    icon: Recycle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "driver",
    title: "دليل السائق",
    description: "سائقي شاحنات النقل",
    icon: User,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "admin",
    title: "دليل مدير النظام",
    description: "إدارة المنصة والتحكم الكامل",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
];

const GuideButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleClick = (roleId: string) => {
    navigate(`/guide/${roleId}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Book className="w-4 h-4" />
        <span className="hidden sm:inline">الدليل الإرشادي</span>
        <span className="sm:hidden">الدليل</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border bg-muted/50">
                <h3 className="font-semibold text-foreground">اختر دليلك الإرشادي</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  تعرف على كيفية استخدام المنصة حسب دورك
                </p>
              </div>
              
              <div className="p-2">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleRoleClick(role.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className={`p-2 rounded-lg ${role.bgColor}`}>
                      <role.icon className={`w-5 h-5 ${role.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{role.title}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuideButton;
