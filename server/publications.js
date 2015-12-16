/* globals Meteor, FoodRecalls */
(function() {
  Meteor.publish('LatestFoodRecalls', function(filter, limit) {
    return FoodRecalls.latest(filter, limit);
  });
})();
