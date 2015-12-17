/* globals $, Meteor, Template, moment */
Template.airQualityDetails.events({
  'click #detMinMax'() {
    if (window.LUtil.detMinMax === 0) {
      window.LUtil.detMinMax = 1;
      $('#airQualityDetails').show();
      $('#detMinMaxSpan').removeClass('glyphicon glyphicon-plus');
      $('#detMinMaxSpan').addClass('glyphicon glyphicon-minus');
      $('.airQuality-detail').css({ 'height': '250px' });
    } else if (window.LUtil.detMinMax === 1) {
      window.LUtil.detMinMax = 0;
      $('#airQualityDetails').hide();
      $('#detMinMaxSpan').removeClass('glyphicon glyphicon-minus');
      $('#detMinMaxSpan').addClass('glyphicon glyphicon-plus');
      $('.airQuality-detail').css({ 'height': '38px' });
    }
  },
});

Template.airQualityDetails.helpers({
  formatDate(reportDate) {
    return moment(reportDate, 'YYYYMMDD').format('MMMM DD, YYYY');
  },
});

Template.airQualityDetails.rendered = function() {};
