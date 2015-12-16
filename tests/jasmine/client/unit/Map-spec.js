/* globals describe, it, expect, _, window , beforeEach, Blaze, document, Template, $ */
(function() {
  let testLUtil;
  beforeEach(function() {
    // lets make a copy of the object under test so that we have a clean slate
    testLUtil = _.clone(window.LUtil);
  });
  describe('MapTests', function() {
    it('should have map property', function() {
      expect(_.has(testLUtil, 'map')).toEqual(true);
    });
    it('should init map', function() {
      testLUtil.initMap();
      // Map-stubs.js for the method L.map.setView will return true
      // if our code executes properly.
      expect(testLUtil.map).toEqual(true);
    });
    it('should highlight valid origin', function() {
      testLUtil.geojson = window.fakeGeojson;
      testLUtil.highlightOrigin('AL');
      expect(testLUtil.currentOrigin).toEqual(window.fakeGeojson._layers[100]);
    });
    it('should not highlight invalid origin', function() {
      testLUtil.geojson = window.fakeGeojson;
      testLUtil.highlightOrigin('123');
      expect(testLUtil.currentOrigin).toEqual(null);
    });
    it('should highlight destinations of valid states', function() {
      testLUtil.resetMap();
      testLUtil.geojson = window.fakeGeojson;
      testLUtil.highlightDestination('AL,AK');
      expect(testLUtil.currentDestinations).toEqual([window.fakeGeojson._layers[100], window.fakeGeojson._layers[200]]);
    });
    it('should highlight destinations of invalid states', function() {
      testLUtil.resetMap();
      testLUtil.geojson = window.fakeGeojson;
      testLUtil.highlightDestination('ABC,123');
      expect(testLUtil.currentDestinations).toEqual([]);
    });
    it('template should show latestFoodRecalls select', function() {
      const div = document.createElement('DIV');
      Blaze.render(Template.map, div);
      expect($(div).find('#map')[0]).toBeDefined();
    });
    it('template should show map', function() {
      const div = document.createElement('DIV');
      Blaze.render(Template.map, div);
      expect($(div).find('#latestFoodRecalls')[0]).toBeDefined();
    });
    it('should return an array of State abbreviations', function() {
      let mockStates = '';
      let parsedStates = '';

      mockStates = 'PANY NJ Georgia';
      parsedStates = window.LUtil.parseStates(mockStates);
      expect(parsedStates).toEqual(['GA', 'NJ']);

      mockStates = 'bad IN PUT';
      parsedStates = window.LUtil.parseStates(mockStates);
      expect(parsedStates).toEqual(['IN']);

      mockStates = 'nc,sc,NY or Vermont sD Ak SD,MA';
      parsedStates = window.LUtil.parseStates(mockStates);
      expect(parsedStates).toEqual(['MA', 'NY', 'SD', 'VT']);
    });
  });
})();
