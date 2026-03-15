import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, Plus, Trash2, Download, User, Briefcase, 
  GraduationCap, Award, Phone, Mail, MapPin, Globe, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Experience {
  id: string; company: string; role: string; from: string; to: string; description: string;
}
interface Education {
  id: string; institution: string; degree: string; year: string;
}
interface Skill {
  id: string; name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const CVBuilder = () => {
  const { profile } = useAuth();
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: profile?.full_name || '', email: profile?.email || '',
    phone: profile?.phone || '', address: '', summary: '', linkedin: '',
  });

  const [experiences, setExperiences] = useState<Experience[]>([{
    id: '1', company: '', role: '', from: '', to: '', description: '',
  }]);

  const [education, setEducation] = useState<Education[]>([{
    id: '1', institution: '', degree: '', year: '',
  }]);

  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: 'إدارة النفايات', level: 'advanced' },
    { id: '2', name: 'السلامة المهنية', level: 'intermediate' },
  ]);

  const [certificates, setCertificates] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const cvRef = useRef<HTMLDivElement>(null);

  const addExperience = () => setExperiences(prev => [...prev, { id: Date.now().toString(), company: '', role: '', from: '', to: '', description: '' }]);
  const addEducation = () => setEducation(prev => [...prev, { id: Date.now().toString(), institution: '', degree: '', year: '' }]);

  const addSkill = () => {
    if (!newSkill) return;
    setSkills(prev => [...prev, { id: Date.now().toString(), name: newSkill, level: 'intermediate' }]);
    setNewSkill('');
  };

  const addCert = () => {
    if (!newCert) return;
    setCertificates(prev => [...prev, newCert]);
    setNewCert('');
  };

  const levelLabels: Record<string, string> = {
    beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم', expert: 'خبير',
  };

  const handlePrint = () => {
    const content = cvRef.current;
    if (!content) return;
    const htmlContent = `
      <html dir="rtl"><head><title>السيرة الذاتية - ${personalInfo.fullName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
        h1 { color: #2563eb; margin-bottom: 4px; } h2 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-top: 24px; }
        .contact { color: #666; font-size: 14px; } .summary { background: #f0f4ff; padding: 12px; border-radius: 8px; margin: 16px 0; }
        .exp-item { margin-bottom: 16px; } .exp-title { font-weight: bold; } .exp-company { color: #666; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; } .skill-tag { background: #e0e7ff; color: #3b52c4; padding: 4px 12px; border-radius: 16px; font-size: 13px; }
        .cert-item { padding: 4px 0; } @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>${personalInfo.fullName || 'الاسم'}</h1>
        <div class="contact">
          ${personalInfo.email ? `📧 ${personalInfo.email}` : ''} ${personalInfo.phone ? `| 📱 ${personalInfo.phone}` : ''} ${personalInfo.address ? `| 📍 ${personalInfo.address}` : ''}
        </div>
        ${personalInfo.summary ? `<div class="summary">${personalInfo.summary}</div>` : ''}
        
        ${experiences.some(e => e.company) ? `<h2>💼 الخبرات المهنية</h2>${experiences.filter(e => e.company).map(e => `
          <div class="exp-item">
            <div class="exp-title">${e.role}</div>
            <div class="exp-company">${e.company} | ${e.from} - ${e.to || 'حتى الآن'}</div>
            ${e.description ? `<p>${e.description}</p>` : ''}
          </div>
        `).join('')}` : ''}
        
        ${education.some(e => e.institution) ? `<h2>🎓 التعليم</h2>${education.filter(e => e.institution).map(e => `
          <div class="exp-item"><div class="exp-title">${e.degree}</div><div class="exp-company">${e.institution} | ${e.year}</div></div>
        `).join('')}` : ''}
        
        ${skills.length > 0 ? `<h2>⚡ المهارات</h2><div class="skills">${skills.map(s => `<span class="skill-tag">${s.name} (${levelLabels[s.level]})</span>`).join('')}</div>` : ''}
        
        ${certificates.length > 0 ? `<h2>🏆 الشهادات</h2>${certificates.map(c => `<div class="cert-item">• ${c}</div>`).join('')}` : ''}
      </body></html>
    `;
    import('@/services/documentService').then(({ PrintService }) => {
      PrintService.printHTML(htmlContent, { title: 'السيرة الذاتية' });
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            منشئ السيرة الذاتية
          </h1>
          <p className="text-muted-foreground text-sm mt-1">أنشئ سيرة ذاتية احترافية وصدّرها كـ PDF</p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Download className="w-4 h-4" />
          تصدير PDF
        </Button>
      </div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="w-5 h-5" /> البيانات الشخصية</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>الاسم الكامل *</Label><Input value={personalInfo.fullName} onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))} /></div>
            <div><Label>البريد الإلكتروني</Label><Input value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>الهاتف</Label><Input value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>العنوان</Label><Input value={personalInfo.address} onChange={e => setPersonalInfo(p => ({ ...p, address: e.target.value }))} placeholder="المدينة، المنطقة" /></div>
            <div className="md:col-span-2"><Label>الملخص المهني</Label><Textarea value={personalInfo.summary} onChange={e => setPersonalInfo(p => ({ ...p, summary: e.target.value }))} placeholder="نبذة مختصرة عن خبراتك وأهدافك المهنية..." rows={3} /></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Experience */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-5 h-5" /> الخبرات المهنية</CardTitle>
            <Button size="sm" variant="outline" onClick={addExperience} className="gap-1"><Plus className="w-3 h-3" /> إضافة</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.map((exp, i) => (
              <div key={exp.id} className="grid md:grid-cols-2 gap-3 p-3 border rounded-lg relative">
                <Input value={exp.role} onChange={e => { const n = [...experiences]; n[i].role = e.target.value; setExperiences(n); }} placeholder="المسمى الوظيفي" />
                <Input value={exp.company} onChange={e => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} placeholder="الشركة" />
                <Input value={exp.from} onChange={e => { const n = [...experiences]; n[i].from = e.target.value; setExperiences(n); }} placeholder="من (2020)" />
                <Input value={exp.to} onChange={e => { const n = [...experiences]; n[i].to = e.target.value; setExperiences(n); }} placeholder="إلى (2024 أو حالياً)" />
                <Textarea className="md:col-span-2" value={exp.description} onChange={e => { const n = [...experiences]; n[i].description = e.target.value; setExperiences(n); }} placeholder="وصف المهام..." rows={2} />
                {experiences.length > 1 && (
                  <Button size="icon" variant="ghost" className="absolute top-2 left-2 text-destructive h-6 w-6" onClick={() => setExperiences(prev => prev.filter(e => e.id !== exp.id))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Education */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-5 h-5" /> التعليم</CardTitle>
            <Button size="sm" variant="outline" onClick={addEducation} className="gap-1"><Plus className="w-3 h-3" /> إضافة</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {education.map((edu, i) => (
              <div key={edu.id} className="grid grid-cols-3 gap-3 relative">
                <Input value={edu.degree} onChange={e => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} placeholder="الدرجة العلمية" />
                <Input value={edu.institution} onChange={e => { const n = [...education]; n[i].institution = e.target.value; setEducation(n); }} placeholder="الجامعة/المعهد" />
                <Input value={edu.year} onChange={e => { const n = [...education]; n[i].year = e.target.value; setEducation(n); }} placeholder="السنة" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Skills & Certificates */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="w-5 h-5" /> المهارات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="أضف مهارة..." onKeyDown={e => e.key === 'Enter' && addSkill()} />
                <Button size="sm" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <Badge key={skill.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSkills(prev => prev.filter(s => s.id !== skill.id))}>
                    {skill.name} · {levelLabels[skill.level]}
                    <Trash2 className="w-2.5 h-2.5 ms-1" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-5 h-5" /> الشهادات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={newCert} onChange={e => setNewCert(e.target.value)} placeholder="أضف شهادة..." onKeyDown={e => e.key === 'Enter' && addCert()} />
                <Button size="sm" onClick={addCert}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-1">
                {certificates.map((cert, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                    <span>🏆 {cert}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => setCertificates(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hidden ref for print */}
      <div ref={cvRef} className="hidden" />
    </div>
  );
};

export default CVBuilder;
