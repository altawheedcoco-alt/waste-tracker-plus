import { useState, useRef, useEffect } from "react";
import { Book, Truck, Recycle, Factory, User, ChevronDown } from "lucide-react";
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
];

const GuideButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleRoleClick = (roleId: string) => {
    navigate(`/guide/${roleId}`);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Book className="w-4 h-4" />
        <span className="hidden sm:inline">الدليل الإرشادي</span>
        <span className="sm:hidden">الدليل</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-up"
          style={{ animationDuration: '0.2s' }}
        >
          <div className="p-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-foreground">اختر دليلك الإرشادي</h3>
            <p className="text-xs text-muted-foreground mt-1">
              تعرف على كيفية استخدام المنصة حسب دورك
            </p>
          </div>
          
          <div className="p-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 hover:translate-x-1 transition-all duration-150 text-right"
              >
                <div className={`p-2 rounded-lg ${role.bgColor}`}>
                  <role.icon className={`w-5 h-5 ${role.color}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{role.title}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideButton;
