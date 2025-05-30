// Navbar scroll behavior for all pages
document.addEventListener('DOMContentLoaded', () => {
  // Initial check for scroll position
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    // Add scrolled class by default to ensure consistent appearance across all pages
    navbar.classList.add('scrolled');
    
    // Handle scroll events
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        // Only remove the scrolled class on the homepage and other pages with banners
        const isHomePage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html' ||
                          document.querySelector('.banner') !== null;
        
        if (isHomePage) {
          navbar.classList.remove('scrolled');
        }
      }
    });
    
    // Trigger scroll event to set initial state
    window.dispatchEvent(new Event('scroll'));
  }

  // Check for 'open_search' query parameter on page load
  const urlParams = new URLSearchParams(window.location.search);
  const openSearch = urlParams.get('open_search');

  if (openSearch === 'true') {
    // Ensure openSearchModal function exists and is callable
    if (typeof openSearchModal === 'function') {
        // Attempt to open the modal
        try {
            openSearchModal();
            // Optionally, focus the search input if it's a known ID
            // Use the ID of the search input within the main search modal, not the navbar one.
            const searchInputInModal = document.querySelector('#search-modal #search-input'); 
            if (searchInputInModal) {
                searchInputInModal.focus();
            }
        } catch (e) {
            console.error("Error trying to open search modal or focus input: ", e);
        }
    } else {
        console.warn("openSearchModal function not found, cannot open search modal automatically.");
    }
  }

  // Hamburger Menu Toggle
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');

  if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      hamburgerMenu.setAttribute('aria-expanded', isExpanded);
      // Optional: Change hamburger icon to 'X' when menu is open
      const icon = hamburgerMenu.querySelector('i');
      if (icon) {
        if (isExpanded) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times'); // 'X' icon
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu if a link is clicked (optional, good for SPA-like behavior or same-page links)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          hamburgerMenu.setAttribute('aria-expanded', 'false');
          const icon = hamburgerMenu.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        }
      });
    });
  } else {
    if (!hamburgerMenu) console.warn("Hamburger menu button not found.");
    if (!navLinks) console.warn("Nav links container not found for hamburger menu.");
  }

  // Active link highlighting based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navAnchors = document.querySelectorAll('.nav-links a');
  navAnchors.forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active'); // Ensure only current page link is active
    }
  });

  // Special handling for search nav link if it's just a trigger
  const searchNavLink = document.querySelector('.search-nav-link');
  if (searchNavLink && searchNavLink.getAttribute('href').includes('open_search=true')) {
    if (currentPage === 'index.html' && window.location.search.includes('open_search=true')){
        // Keep it active if search was opened via this link on homepage
    } else if (currentPage !== 'index.html') {
        searchNavLink.classList.remove('active');
    } else if (!window.location.search.includes('open_search=true')) {
        searchNavLink.classList.remove('active');
    }
  }

});
