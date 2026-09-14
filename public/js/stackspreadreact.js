/**
 * stackspreadreact.js - React Component Pattern for Stack Spread Card Showcase
 * Provides a React functional component with useState, hooks, and responsive transforms
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['react'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('react'));
  } else {
    root.StackSpreadReact = factory(root.React);
  }
}(typeof self !== 'undefined' ? self : this, function(React) {
  if (!React) {
    // Return standard wrapper if React is loaded dynamically or in bundle
    return function FallbackWrapper(props) {
      return null;
    };
  }

  const { useState, useEffect, useRef } = React;

  function StackSpreadReact({ items = [], onCardClick, initialSpread = false, cardSpacing = 280 }) {
    const [isSpread, setIsSpread] = useState(initialSpread);
    const [activeIndex, setActiveIndex] = useState(0);

    const total = items.length;

    const getCardStyle = (index) => {
      const centerIndex = (total - 1) / 2;
      const isTopHero = items[index] && items[index].rank === 1;

      if (!isSpread) {
        const offset = index * 4;
        const rotate = (index - Math.floor(total / 2)) * 3.5;
        return {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${offset}px, ${offset * 2}px) rotate(${rotate}deg)`,
          zIndex: total - index,
          transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
      } else {
        const xOffset = (index - centerIndex) * cardSpacing;
        const yOffset = Math.abs(index - centerIndex) * 16;
        const rotate = (index - centerIndex) * 4;
        return {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg)`,
          zIndex: 20 + index,
          transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
      }
    };

    return React.createElement(
      'div',
      {
        className: 'stack-spread-wrapper',
        onMouseEnter: () => setIsSpread(true),
        onMouseLeave: () => setIsSpread(false)
      },
      React.createElement(
        'div',
        { className: 'hero-cards-container' },
        items.map((item, idx) =>
          React.createElement(
            'div',
            {
              key: item.id || idx,
              className: `spread-card ${item.rank === 1 ? 'champion' : ''}`,
              style: getCardStyle(idx),
              onClick: () => {
                setActiveIndex(idx);
                if (onCardClick) onCardClick(item, idx);
              }
            },
            item.rank === 1 &&
              React.createElement(
                'div',
                { className: 'champion-crown' },
                '★ FOOD HERO 🌟'
              ),
            React.createElement(
              'div',
              { className: 'spread-card-header' },
              React.createElement('img', {
                src: item.avatar,
                alt: item.name,
                className: 'hero-avatar'
              }),
              React.createElement(
                'div',
                null,
                React.createElement('h3', { className: 'hero-name' }, item.name),
                React.createElement(
                  'p',
                  { className: 'hero-subtitle-tag' },
                  item.donorType || item.role
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'hero-metric-grid' },
              React.createElement(
                'div',
                { className: 'metric-box' },
                React.createElement('span', null, `${item.totalWeightKg || item.mealsSponsored} kg`),
                React.createElement('label', null, 'Total Rescued')
              ),
              React.createElement(
                'div',
                { className: 'metric-box' },
                React.createElement('span', null, item.totalMealsDonated || item.mealsSponsored),
                React.createElement('label', null, 'Meals Fed')
              ),
              React.createElement(
                'div',
                { className: 'metric-box' },
                React.createElement('span', null, item.peopleFed || (item.mealsSponsored * 1.2)),
                React.createElement('label', null, 'People Fed')
              )
            ),
            React.createElement(
              'p',
              { className: 'hero-quote' },
              `"${item.quote || 'Serving humanity with zero food waste.'}"`
            )
          )
        )
      )
    );
  }

  return StackSpreadReact;
}));
