document.addEventListener('DOMContentLoaded', () => {
  // Navigation handling
  const sections = document.querySelectorAll('main > section');
  const navLinks = document.querySelectorAll('aside nav a');

  function navigateTo(hash) {
    if (!hash) hash = '#overview';
    
    sections.forEach(sec => sec.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    const activeSection = document.querySelector(hash);
    if (activeSection) {
      activeSection.classList.add('active');
      const activeLink = document.querySelector(`aside nav a[href="${hash}"]`);
      if (activeLink) activeLink.classList.add('active');
      
      // Close sidebar on mobile if open
      document.querySelector('aside').classList.remove('open');
      
      // Re-init mermaid if needed (it usually auto-initializes on load, but we can force it if rendering issues occur in display:none)
      window.scrollTo(0, 0);
      
      // Animations
      gsap.fromTo(activeSection.children, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }

  window.addEventListener('hashchange', () => navigateTo(window.location.hash));
  
  // Initial navigation
  navigateTo(window.location.hash);

  // Mobile menu toggle
  document.getElementById('menu').addEventListener('click', () => {
    document.querySelector('aside').classList.toggle('open');
  });

  // Theme Toggle
  const themeBtn = document.getElementById('theme');
  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    themeBtn.textContent = isLight ? '◐' : '◑';
    initCharts(); // Re-render charts with new theme colors
  });

  // Simulator
  const dalInput = document.getElementById('dal');
  const vegInput = document.getElementById('veg');
  const dout = document.getElementById('dout');
  const vout = document.getElementById('vout');
  const simscore = document.getElementById('simscore');

  function updateSimulation() {
    const dalVal = parseInt(dalInput.value);
    const vegVal = parseInt(vegInput.value);
    dout.textContent = dalVal + 'g';
    vout.textContent = vegVal + 'g';
    
    // Fake calculation for demonstration
    let base = 50;
    let dalScore = Math.min(dalVal / 100 * 20, 20); // max 20 points
    let vegScore = Math.min(vegVal / 80 * 20, 20); // max 20 points
    
    let total = Math.round(base + dalScore + vegScore);
    simscore.innerHTML = `68 → <span class="highlight">${total}</span>`;
  }

  if (dalInput && vegInput) {
    dalInput.addEventListener('input', updateSimulation);
    vegInput.addEventListener('input', updateSimulation);
  }

  // Search Modal
  const searchBtn = document.getElementById('search');
  const modal = document.getElementById('modal');
  const searchInput = document.getElementById('q');
  const searchResults = document.getElementById('sr');

  searchBtn.addEventListener('click', () => {
    modal.classList.add('show');
    searchInput.focus();
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  const searchData = Array.from(sections).map(sec => {
    return {
      id: sec.id,
      title: sec.querySelector('h2') ? sec.querySelector('h2').innerText : sec.querySelector('h1').innerText,
      text: sec.innerText.toLowerCase()
    };
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    searchResults.innerHTML = '';
    
    if (query.length < 2) return;
    
    const matches = searchData.filter(item => item.text.includes(query) || item.title.toLowerCase().includes(query));
    
    matches.forEach(match => {
      const a = document.createElement('a');
      a.href = `#${match.id}`;
      a.textContent = match.title;
      a.addEventListener('click', () => {
        modal.classList.remove('show');
        searchInput.value = '';
        searchResults.innerHTML = '';
      });
      searchResults.appendChild(a);
    });
  });

  // Initialize Mermaid
  mermaid.initialize({
    startOnLoad: true,
    theme: 'dark', // or 'default' based on theme preference, can be made dynamic
    securityLevel: 'loose',
    fontFamily: "'Outfit', sans-serif"
  });

  // Initialize Charts
  let metricChartInst = null;
  let weeklyChartInst = null;

  function initCharts() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLight ? '#64748B' : '#9CA3AF';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const primaryColor = '#3B82F6';
    const accentColor = '#10B981';

    // Chart defaults
    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // 1. Metric Chart
    const ctx1 = document.getElementById('metricChart');
    if (ctx1) {
      if (metricChartInst) metricChartInst.destroy();
      metricChartInst = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Precision', 'Recall', 'F1 Score', 'mAP50'],
          datasets: [{
            label: 'Evaluation Metrics (%)',
            data: [91.2, 89.5, 90.3, 92.4],
            backgroundColor: [primaryColor, primaryColor, primaryColor, accentColor],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: gridColor }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // 2. Weekly Chart
    const ctx2 = document.getElementById('weeklyChart');
    if (ctx2) {
      if (weeklyChartInst) weeklyChartInst.destroy();
      weeklyChartInst = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [{
            label: 'Daily Average Score',
            data: [82, 76, 88, 74, 79],
            borderColor: accentColor,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: accentColor,
            pointRadius: 5,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              min: 60,
              max: 100,
              grid: { color: gridColor }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }

  // Delay chart initialization slightly to ensure canvas elements are ready
  setTimeout(initCharts, 200);
});
