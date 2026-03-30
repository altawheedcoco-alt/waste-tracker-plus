import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisualComfortToggle from '../VisualComfortToggle';

// Mock ThemeSettingsContext
const mockSetVisualMode = vi.fn();
const mockSettings = { visualMode: 'light' as const, themeColor: 'green' as const, fontFamily: 'cairo' as const, fontSize: 16, isDarkMode: false, displayMode: 'auto' as const };

vi.mock('@/contexts/ThemeSettingsContext', () => ({
  useThemeSettings: () => ({
    settings: mockSettings,
    setVisualMode: mockSetVisualMode,
    setThemeColor: vi.fn(),
    setFontFamily: vi.fn(),
    setFontSize: vi.fn(),
    setDisplayMode: vi.fn(),
    toggleDarkMode: vi.fn(),
    resetToDefaults: vi.fn(),
    effectiveDisplayMode: 'mobile',
  }),
}));

describe('VisualComfortToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.filter = '';
    document.documentElement.classList.remove('reduce-motion');
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.style.filter = '';
    document.documentElement.classList.remove('reduce-motion');
  });

  it('renders three visual mode buttons', () => {
    render(<VisualComfortToggle />);
    expect(screen.getByText('نهاري')).toBeInTheDocument();
    expect(screen.getByText('مسائي')).toBeInTheDocument();
    expect(screen.getByText('ليلي')).toBeInTheDocument();
  });

  it('calls setVisualMode when clicking a mode', () => {
    render(<VisualComfortToggle />);
    fireEvent.click(screen.getByText('ليلي'));
    expect(mockSetVisualMode).toHaveBeenCalledWith('dark');
  });

  it('calls setVisualMode for dim mode', () => {
    render(<VisualComfortToggle />);
    fireEvent.click(screen.getByText('مسائي'));
    expect(mockSetVisualMode).toHaveBeenCalledWith('dim');
  });

  it('shows eye comfort panel when expanded', () => {
    render(<VisualComfortToggle />);
    // Click "راحة العين" to expand
    fireEvent.click(screen.getByText('راحة العين'));
    expect(screen.getByText('فلتر الضوء الأزرق')).toBeInTheDocument();
    expect(screen.getByText('السطوع')).toBeInTheDocument();
    expect(screen.getByText('دفء الألوان')).toBeInTheDocument();
    expect(screen.getByText('تقليل الحركة')).toBeInTheDocument();
    expect(screen.getByText('تبديل تلقائي حسب الوقت')).toBeInTheDocument();
  });

  it('hides eye comfort panel by default', () => {
    render(<VisualComfortToggle />);
    expect(screen.queryByText('فلتر الضوء الأزرق')).not.toBeInTheDocument();
  });

  it('shows reset button when expanded', () => {
    render(<VisualComfortToggle />);
    fireEvent.click(screen.getByText('راحة العين'));
    expect(screen.getByText('إعادة ضبط')).toBeInTheDocument();
  });

  it('persists comfort settings to localStorage', () => {
    render(<VisualComfortToggle />);
    // Expand and check localStorage is set
    fireEvent.click(screen.getByText('راحة العين'));
    const saved = localStorage.getItem('irecycle-eye-comfort');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.blueFilter).toBe(0);
    expect(parsed.brightness).toBe(100);
  });

  it('toggles expand/collapse', () => {
    render(<VisualComfortToggle />);
    const btn = screen.getByText('راحة العين');
    fireEvent.click(btn); // expand
    expect(screen.getByText('فلتر الضوء الأزرق')).toBeInTheDocument();
    fireEvent.click(btn); // collapse
    expect(screen.queryByText('فلتر الضوء الأزرق')).not.toBeInTheDocument();
  });
});
