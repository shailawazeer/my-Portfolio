/* ==========================================================================
   SCRIPT.JS — Shaila Wazeer Portfolio
   
   This file handles all interactive behavior:
   1. Mobile navigation toggle
   2. Scroll-triggered fade-in animations
   3. Hero canvas — animated network/nodes background
   4. Active nav link highlighting on scroll
   5. Contact form validation (front-end only)

   Each function is explained with comments so you can learn from it.
   ========================================================================== */


// Wait for the DOM to fully load before running any code.
// This ensures all HTML elements exist when we try to find them.
document.addEventListener('DOMContentLoaded', () => {


  /* ========================================================================
     1. MOBILE NAV TOGGLE
     When the hamburger button is clicked, toggle the menu open/closed.
     ======================================================================== */
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    // Toggle the "open" class on the nav links list (CSS slides it in/out)
    navLinks.classList.toggle('open');
    // Toggle the "active" class on the button (CSS animates ☰ → ✕)
    navToggle.classList.toggle('active');
  });

  // Close the mobile menu when any nav link is clicked
  // (otherwise the menu stays open after tapping a link on mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });


  /* ========================================================================
     2. SCROLL-TRIGGERED FADE-IN ANIMATIONS
     Uses the IntersectionObserver API to watch elements.
     When an element with class "fade-in" scrolls into view, we add
     the "visible" class — CSS handles the actual animation.
     
     WHY IntersectionObserver?
     - It's more performant than listening to the scroll event
     - The browser handles the heavy lifting natively
     ======================================================================== */
  const fadeElements = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Element is now visible in the viewport → add the class
        entry.target.classList.add('visible');
        // Stop watching this element (it only fades in once)
        fadeObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15  // Trigger when 15% of the element is visible
  });

  // Start observing every .fade-in element
  fadeElements.forEach(el => fadeObserver.observe(el));


  /* ========================================================================
     3. HERO CANVAS — ANIMATED NETWORK NODES
     Draws a grid of small dots with occasional lines connecting nearby
     dots, plus a glowing "path" that traces across — a nod to pathfinding
     algorithms and network graphs.
     
     HOW IT WORKS:
     - Create a grid of nodes (dots)
     - Randomly block some nodes (to simulate obstacles)
     - Generate a random path from left to right
     - Animate the path being "discovered" node by node
     - When complete, pause briefly, then generate a new path
     ======================================================================== */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');

    // State variables
    let W, H;                   // Canvas dimensions
    let cols, rows;             // Grid dimensions
    const spacing = 44;         // Distance between nodes (px)
    let nodes = [];             // 2D array of node objects
    let path  = [];             // Current path [{r, c}, ...]
    let progress   = 0;         // How far along the path we've drawn
    let pauseTimer = 0;         // Counter for the pause between paths

    /**
     * resize() — Called on window resize and initially.
     * Sets the canvas size to match its container, accounting for
     * device pixel ratio so it looks sharp on Retina/HiDPI screens.
     */
    function resize() {
      // devicePixelRatio is 2 on Retina displays, 1 on standard
      W = canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      H = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      buildGrid();
    }

    /**
     * buildGrid() — Creates the 2D array of nodes.
     * Each node has an x/y position and a "blocked" flag.
     * ~20% of nodes are randomly blocked to create visual variety.
     */
    function buildGrid() {
      cols = Math.ceil(canvas.offsetWidth  / spacing) + 2;
      rows = Math.ceil(canvas.offsetHeight / spacing) + 2;
      nodes = [];

      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push({
            x: c * spacing,
            y: r * spacing,
            blocked: Math.random() < 0.2  // 20% chance of being blocked
          });
        }
        nodes.push(row);
      }
      generatePath();
    }

    /**
     * generatePath() — Creates a random path across the grid (left → right).
     * At each step, the path can go straight, up-right, or down-right.
     * This isn't a real pathfinding algorithm — it's a visual approximation
     * that looks like one is running.
     */
    function generatePath() {
      const startRow = Math.floor(Math.random() * rows);
      let r = startRow;
      let c = 0;
      const p = [{ r, c }];

      while (c < cols - 1) {
        // Build a list of valid next positions (always move right by 1)
        const options = [];
        if (r > 0)          options.push({ r: r - 1, c: c + 1 }); // up-right
        options.push({ r: r,     c: c + 1 });                      // straight
        if (r < rows - 1)  options.push({ r: r + 1, c: c + 1 }); // down-right

        // Pick one at random
        const next = options[Math.floor(Math.random() * options.length)];
        r = next.r;
        c = next.c;
        p.push({ r, c });
      }

      path = p;
      progress = 0;   // Reset so the new path draws from the start
    }

    /**
     * draw() — The main animation loop, called ~60 times per second.
     * 1. Clears the canvas
     * 2. Draws the grid of faint dots
     * 3. Draws the path up to the current progress
     * 4. Advances the progress counter
     * 5. When complete, waits briefly then generates a new path
     */
    function draw() {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // --- Draw grid dots ---
      ctx.fillStyle = 'rgba(136, 146, 168, 0.15)'; // Faint gray dots
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = nodes[r][c];
          if (n.blocked) continue; // Skip blocked nodes
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Draw the traced path ---
      if (path.length > 1) {
        const upTo = Math.min(Math.floor(progress), path.length - 1);

        // Path line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';  // Accent blue
        ctx.lineWidth = 1.4;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i <= upTo; i++) {
          const node = nodes[path[i].r][path[i].c];
          if (i === 0) ctx.moveTo(node.x, node.y);
          else         ctx.lineTo(node.x, node.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing dot at the tip of the path
        if (upTo < path.length) {
          const tip = nodes[path[upTo].r][path[upTo].c];
          ctx.fillStyle = '#7dd3fc';
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Advance animation ---
      if (progress < path.length + 20) {
        progress += 0.2;  // Speed of the path drawing
      } else {
        // Path is fully drawn — wait a bit then start a new one
        pauseTimer++;
        if (pauseTimer > 80) {
          generatePath();
          pauseTimer = 0;
        }
      }

      requestAnimationFrame(draw);  // Schedule the next frame
    }

    // Initialize
    window.addEventListener('resize', resize);
    resize();

    // Only animate if the user hasn't set "prefers-reduced-motion"
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      requestAnimationFrame(draw);
    } else {
      // Still draw a static snapshot
      progress = path.length;
      draw();
    }
  }


  /* ========================================================================
     4. ACTIVE NAV LINK HIGHLIGHTING
     As the user scrolls, the nav link corresponding to the current
     section gets highlighted. Uses IntersectionObserver on each section.
     ======================================================================== */
  const sections   = document.querySelectorAll('section[id]');
  const allNavLinks = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        // Remove active class from all links
        allNavLinks.forEach(link => link.classList.remove('active'));
        // Add it to the matching link
        const matchingLink = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (matchingLink) matchingLink.classList.add('active');
      }
    });
  }, {
    // rootMargin: top offset (negative = trigger earlier), bottom offset
    rootMargin: '-30% 0px -60% 0px'
  });

  sections.forEach(sec => sectionObserver.observe(sec));


  /* ========================================================================
     5. CONTACT FORM VALIDATION (front-end only)
     Validates the name, email, and message fields when the form is
     submitted. Shows inline error messages. Does NOT send data anywhere
     — you'll need a backend (or a service like Formspree) for that later.
     
     HOW VALIDATION WORKS:
     - Check if each field is empty (trim whitespace first)
     - Check if email matches a basic pattern
     - If any errors, show messages and prevent submission
     - If all valid, show a success alert (placeholder for real sending)
     ======================================================================== */
  const form = document.getElementById('contactForm');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();  // Stop the form from actually submitting

      // Grab field values
      const nameInput    = document.getElementById('formName');
      const emailInput   = document.getElementById('formEmail');
      const messageInput = document.getElementById('formMessage');

      // Grab error message elements
      const nameError    = document.getElementById('nameError');
      const emailError   = document.getElementById('emailError');
      const messageError = document.getElementById('messageError');

      let isValid = true;

      // --- Validate name ---
      if (nameInput.value.trim() === '') {
        nameInput.classList.add('error');
        nameError.textContent = 'Please enter your name.';
        nameError.classList.add('visible');
        isValid = false;
      } else {
        nameInput.classList.remove('error');
        nameError.classList.remove('visible');
      }

      // --- Validate email ---
      // Basic email pattern: something@something.something
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('visible');
        isValid = false;
      } else {
        emailInput.classList.remove('error');
        emailError.classList.remove('visible');
      }

      // --- Validate message ---
      if (messageInput.value.trim() === '') {
        messageInput.classList.add('error');
        messageError.textContent = 'Please write a message.';
        messageError.classList.add('visible');
        isValid = false;
      } else {
        messageInput.classList.remove('error');
        messageError.classList.remove('visible');
      }

      // --- If everything is valid ---
      if (isValid) {
        // TODO: Replace this with actual form submission logic
        // (e.g., Formspree, EmailJS, or your own API endpoint)
        alert('Thanks for reaching out! I\'ll get back to you soon. 🚀');
        form.reset();
      }
    });

    // Clear error styling as the user types (better UX)
    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('error');
        const errorEl = field.parentElement.querySelector('.error-msg');
        if (errorEl) errorEl.classList.remove('visible');
      });
    });
  }


});  // END DOMContentLoaded
