/* globals $, Template */
Template.mapSplashModal.events({
  'click #gotit'() {
    $('#mapSplashModal').modal('hide');
  },
});

Template.mapSplashModal.rendered = function() {
  $('#mapSplashModal').modal('show');
};
