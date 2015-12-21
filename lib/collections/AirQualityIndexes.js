/* globals AirQualityIndexes:true, Mongo, Meteor */
AirQualityIndexes = new Mongo.Collection('AirQualityIndexes');

// shared client and server methods
AirQualityIndexes.latest = function() {
  return AirQualityIndexes.find();
};

if (Meteor.isServer) {
  (function () {
    AirQualityIndexes._ensureIndex({ Latitude: 1, Longitude: 1, _id: 1 }, { unique: 1 });
  })();
}
