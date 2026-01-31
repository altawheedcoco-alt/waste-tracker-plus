-- Add trigger to auto-generate report_number for recycling_reports
CREATE TRIGGER generate_recycling_report_number
  BEFORE INSERT ON public.recycling_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_report_number();