export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZGV2cml0aWsiLCJhIjoiY2xpbXUybmg2MHVzbDNobW0xa2lsdTFndSJ9.V2iTPWHPHPK021uRJxqbPA';

  // Detect current theme
  const getCurrentTheme = () => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  };

  // Get map style based on theme
  const getMapStyle = (theme) => {
    return theme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/streets-v11';
  };

  let map = new mapboxgl.Map({
    container: 'map',
    style: getMapStyle(getCurrentTheme()),
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  // Listen for theme changes and update map style
  window.addEventListener('themechange', (e) => {
    if (map) {
      const newTheme = e.detail.theme;
      map.setStyle(getMapStyle(newTheme));
      
      // Re-add markers and popups after style change
      map.once('style.load', () => {
        const bounds = new mapboxgl.LngLatBounds();
        
        locations.forEach((loc) => {
          // Create marker
          const el = document.createElement('div');
          el.className = 'marker';

          // Add marker
          new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
          })
            .setLngLat(loc.coordinates)
            .addTo(map);

          // Add popup
          new mapboxgl.Popup({
            offset: 30,
            closeOnClick: false,
            focusAfterOpen: false,
          })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

          // Extend map bounds to include current location
          bounds.extend(loc.coordinates);
        });

        map.fitBounds(bounds, {
          padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
          },
        });
      });
    }
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
      closeOnClick: false,
      focusAfterOpen: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
