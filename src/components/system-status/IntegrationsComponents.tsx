import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowRight,
  Database,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { SystemIntegration, IntegrationStatus } from './types';
import { motion } from 'framer-motion';

const getStatusColor = (status: IntegrationStatus) => {
  switch (status) {
    case 'strong': return 'bg-green-500 text-white';
    case 'moderate': return 'bg-yellow-500 text-white';
    case 'weak': return 'bg-red-500 text-white';
    case 'planned': return 'bg-blue-500 text-white';
    default: return 'bg-muted-foreground text-white';
  }
};

const getStatusLabel = (status: IntegrationStatus) => {
  switch (status) {
    case 'strong': return 'ربط قوي';
    case 'moderate': return 'ربط متوسط';
    case 'weak': return 'ربط ضعيف';
    case 'planned': return 'مخطط';
    default: return status;
  }
};

const getStrengthColor = (strength: number) => {
  if (strength >= 90) return 'text-green-600';
  if (strength >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

const integrationCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

interface IntegrationCardProps {
  integration: SystemIntegration;
  index?: number;
}

export const IntegrationCard = ({ integration, index = 0 }: IntegrationCardProps) => {
  const Icon = integration.icon;
  
  return (
    <motion.div
      custom={index}
      variants={integrationCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      <Card className="hover:shadow-lg transition-shadow h-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white"
                whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div>
                <CardTitle className="text-base">{integration.name}</CardTitle>
                <CardDescription className="text-xs mt-1">{integration.description}</CardDescription>
              </div>
            </div>
            <motion.div
              className={`text-lg font-bold ${getStrengthColor(integration.overallStrength)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.08 + 0.3, type: 'spring', stiffness: 200 }}
            >
              {integration.overallStrength}%
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.08 + 0.2, duration: 0.6 }}
            style={{ transformOrigin: 'right' }}
          >
            <Progress value={integration.overallStrength} className="h-2 mb-4" />
          </motion.div>
          
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Zap className="w-4 h-4 text-primary" />
              تدفق البيانات
            </div>
            <p className="text-xs text-muted-foreground">{integration.dataFlowSummary}</p>
          </div>

          <div className="space-y-1.5 mb-4">
            {integration.keyFeatures.slice(0, 3).map((feature, idx) => (
              <motion.div
                key={idx}
                className="flex items-center gap-2 text-xs"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + 0.4 + idx * 0.08 }}
              >
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <Badge variant="outline" className="flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {integration.links.length} روابط
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {[...new Set(integration.links.flatMap(l => l.tables || []))].length} جداول
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface IntegrationDetailProps {
  integrations: SystemIntegration[];
}

export const IntegrationDetailView = ({ integrations }: IntegrationDetailProps) => {
  return (
    <ScrollArea className="h-[600px] pr-4">
      <Accordion type="multiple" className="w-full space-y-4">
        {integrations.map((integration, idx) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
            >
              <AccordionItem value={`integration-${idx}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-semibold">{integration.name}</div>
                      <div className="text-xs text-muted-foreground">{integration.description}</div>
                    </div>
                    <Badge className={getStrengthColor(integration.overallStrength)}>
                      {integration.overallStrength}%
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-primary" />
                        تدفق البيانات الرئيسي
                      </h4>
                      <p className="text-sm text-muted-foreground">{integration.dataFlowSummary}</p>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        الميزات الأساسية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {integration.keyFeatures.map((feature, i) => (
                          <motion.div
                            key={i}
                            className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/20 rounded p-2"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                            <span>{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Link2 className="w-4 h-4 text-primary" />
                        روابط التكامل ({integration.links.length})
                      </h4>
                      <div className="space-y-3">
                        {integration.links.map((link, i) => (
                          <motion.div
                            key={i}
                            className="border rounded-lg p-3 bg-muted/30"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="font-mono text-xs">{link.source}</Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <Badge variant="outline" className="font-mono text-xs">{link.target}</Badge>
                              <Badge className={`mr-auto text-xs ${getStatusColor(link.status)}`}>
                                {getStatusLabel(link.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-muted-foreground">البيانات:</span>
                              {link.dataFlow.map((field, j) => (
                                <Badge key={j} variant="secondary" className="text-xs font-mono">{field}</Badge>
                              ))}
                            </div>
                            {link.tables && link.tables.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className="text-xs text-muted-foreground">الجداول:</span>
                                {link.tables.map((table, j) => (
                                  <Badge key={j} variant="outline" className="text-xs font-mono flex items-center gap-1">
                                    <Database className="w-2 h-2" />
                                    {table}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-500" />
                        ملاحظات تقنية
                      </h4>
                      <ul className="space-y-1">
                        {integration.technicalNotes.map((note, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        تحسينات مقترحة
                      </h4>
                      <ul className="space-y-1">
                        {integration.improvements.map((improvement, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          );
        })}
      </Accordion>
    </ScrollArea>
  );
};

interface IntegrationStatsProps {
  integrations: SystemIntegration[];
}

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' as const },
  }),
};

export const IntegrationStatsGrid = ({ integrations }: IntegrationStatsProps) => {
  const totalLinks = integrations.reduce((acc, i) => acc + i.links.length, 0);
  const strongLinks = integrations.reduce((acc, i) => acc + i.links.filter(l => l.status === 'strong').length, 0);
  const allTables = [...new Set(integrations.flatMap(i => i.links.flatMap(l => l.tables || [])))];
  const avgStrength = Math.round(integrations.reduce((acc, i) => acc + i.overallStrength, 0) / integrations.length);

  const items = [
    { value: integrations.length, label: 'منظومات مترابطة', gradient: 'from-primary/10 to-primary/5', color: 'text-primary' },
    { value: totalLinks, label: 'روابط تكامل', gradient: 'from-blue-500/10 to-blue-500/5', color: 'text-blue-600' },
    { value: strongLinks, label: 'ربط قوي', gradient: 'from-green-500/10 to-green-500/5', color: 'text-green-600' },
    { value: allTables.length, label: 'جداول مرتبطة', gradient: 'from-purple-500/10 to-purple-500/5', color: 'text-purple-600' },
    { value: avgStrength, label: 'متوسط القوة', gradient: 'from-amber-500/10 to-amber-500/5', color: 'text-amber-600', suffix: '%' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          custom={idx}
          variants={statCardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
        >
          <Card className={`bg-gradient-to-br ${item.gradient}`}>
            <CardContent className="pt-4">
              <motion.div
                className={`text-2xl font-bold ${item.color}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.07 + 0.3 }}
              >
                {item.value}{item.suffix || ''}
              </motion.div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
