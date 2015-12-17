/* globals Meteor, AirQualityIndexes */
(function() {
  Meteor.publish('LatestAirQualityIndexes', function(filter, limit) {
    return AirQualityIndexes.latest(filter, limit);
  });
})();
