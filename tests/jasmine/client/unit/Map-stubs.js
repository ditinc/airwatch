/* globals window */
(function() {
  window.L = {
    Icon: {
      Default: {
        imagePath: null,
      },
    },
    map() {
      return {
        setView() {
          return true;
        },
      };
    },
    addLayer() {},
    tileLayer() {},
    geoJson() {
      return { addTo() {} };
    },
    control() {
      return {
        addTo() {},
        onAdd() {},
      };
    },
    DomUtil: {
      create() {},
    },
  };
  window.fakeGeojson = {
    _layers: {
      100: {
        feature: {
          properties: {
            abbreviation: 'AL',
            name: 'Alabama',
          },
        },
        setStyle() {},
      },
      200: {
        feature: {
          properties: {
            abbreviation: 'AK',
            name: 'Alaska',
          },
        },
        setStyle() {},
      },
    },
  };
})();
