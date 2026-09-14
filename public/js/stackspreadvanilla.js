/**
 * stackspreadvanilla.js - Vanilla JS Card Stack Spreading Component
 * Interactive card deck that spreads into a fan / grid showcase for Food Heroes
 */

class StackSpreadCards {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      spreadMode: 'fan', // 'fan' or 'stacked' or 'grid'
      autoSpreadOnHover: true,
      cardSpacing: 280,
      activeCardIndex: 0
    }, options);

    this.isSpread = false;
    this.cards = [];
    this.init();
  }

  init() {
    if (!this.container) return;
    this.cards = Array.from(this.container.querySelectorAll('.spread-card'));
    this.updateCardTransforms();
    this.bindEvents();
  }

  setSpread(spread) {
    this.isSpread = spread;
    this.updateCardTransforms();
  }

  toggleSpread() {
    this.isSpread = !this.isSpread;
    this.updateCardTransforms();
    return this.isSpread;
  }

  updateCardTransforms() {
    const total = this.cards.length;
    if (total === 0) return;

    this.cards.forEach((card, index) => {
      card.style.position = 'absolute';
      card.style.transition = 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';

      if (!this.isSpread) {
        // Stacked deck view
        const offset = index * 4;
        const rotate = (index - Math.floor(total / 2)) * 3.5;
        const zIndex = total - index;
        card.style.transform = `translate(-50%, -50%) translate(${offset}px, ${offset * 2}px) rotate(${rotate}deg)`;
        card.style.zIndex = zIndex;
      } else {
        // Fan-out spread view
        const centerIndex = (total - 1) / 2;
        const xOffset = (index - centerIndex) * 290;
        const yOffset = Math.abs(index - centerIndex) * 16;
        const rotate = (index - centerIndex) * 4;
        const zIndex = 20 + index;
        card.style.transform = `translate(-50%, -50%) translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg)`;
        card.style.zIndex = zIndex;
      }
    });
  }

  bindEvents() {
    if (this.options.autoSpreadOnHover) {
      this.container.addEventListener('mouseenter', () => {
        if (!this.isSpread) {
          this.setSpread(true);
        }
      });

      this.container.addEventListener('mouseleave', () => {
        // Return to stacked if toggle isn't forced
        const toggleBtn = document.getElementById('btn-toggle-spread');
        if (toggleBtn && !toggleBtn.classList.contains('locked-spread')) {
          this.setSpread(false);
        }
      });
    }

    this.cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        // Bring card to front
        this.cards.forEach(c => c.style.zIndex = 10);
        card.style.zIndex = 99;
        card.style.transform += ' scale(1.05)';
        setTimeout(() => {
          this.updateCardTransforms();
        }, 1200);
      });
    });
  }
}

window.StackSpreadCards = StackSpreadCards;
