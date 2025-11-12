import React, { useEffect } from 'react';

const MobileMenuFix = () => {
  useEffect(() => {
    // Fix para dropdowns en móvil
    const handleDropdownClick = (e) => {
      if (window.innerWidth <= 991.98) {
        const dropdown = e.target.closest('.dropdown');
        if (dropdown) {
          const menu = dropdown.querySelector('.dropdown-menu');
          if (menu) {
            // Usar requestAnimationFrame para evitar conflictos con ResizeObserver
            requestAnimationFrame(() => {
              menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            });
          }
        }
      }
    };

    // Fix para ResizeObserver en navbar
    const handleResize = () => {
      const navbar = document.querySelector('.navbar-collapse');
      if (navbar && window.innerWidth > 991.98) {
        // Resetear estado en desktop
        navbar.classList.remove('show');
      }
    };

    // Agregar event listeners con debounce
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    document.addEventListener('click', handleDropdownClick);
    window.addEventListener('resize', debouncedResize);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleDropdownClick);
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return null;
};

export default MobileMenuFix;
