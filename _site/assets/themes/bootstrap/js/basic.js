$(function() {
    $('.panel-image img.panel-image-preview').on('click', function(e) {
        $(this).closest('.panel-image').toggleClass('hide-panel-body');
    });
});