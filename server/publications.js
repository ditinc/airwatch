/* globals Meteor, StateAirQualities */
(function() {
  Meteor.publish('LatestStateAirQualities', function(filter, limit) {
    return StateAirQualities.latest(filter, limit);
  });
})();
