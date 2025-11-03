// Theme Toggle Functionality
export const initTheme = () => {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Get saved theme from localStorage or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);

  // Toggle theme function
  const toggleTheme = () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Add animation class for smooth transition
    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
    
    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  };

  // Add event listener to toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Listen for system preference changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Only auto-apply system preference if no saved preference exists
    if (!localStorage.getItem('theme')) {
      const handleSystemTheme = (e) => {
        html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      
      handleSystemTheme(mediaQuery);
      mediaQuery.addEventListener('change', handleSystemTheme);
    }
  }
};

