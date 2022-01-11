/**
 * Removes content Prince XML and DocRaptor don't know how to handle properly, no "noscript" tags.
 */
function pmb_remove_unsupported_content(){
    // remove "noscripts" because we actually executed Javascript in the browser, then turn JS off for DocRaptor
    // (but Javascript was executed, so no need to do noscript tags)
    jQuery('noscript').remove();
    // remove all the broken images and links etc
    jQuery('[src^="file:"]').remove();
    jQuery('[href^="file:"]').contents().unwrap();
    // DocRaptor handles "//" like "/" which means it thinks you're trying to access resources on its server
    // and has an error. So change those to the old way of specifying links.
    jQuery('[src^="//"]').each(function(index, element){
        element.setAttribute("src", location.protocol + element.getAttribute('src'));
    });
    jQuery('[href^="//"]').each(function(index, element){
        element.setAttribute("href", location.protocol + element.getAttribute('href'));
    });
}

function pmb_dont_float(){
    jQuery('.alignright').removeClass('alignright');
    jQuery('.alignleft').removeClass('alignleft');
}

/**
 * Forces all the images with no alignment to instead be aligned in the center.
 */
function pmb_default_align_center(){
    // take care of classic images that had align none on them.
    jQuery('img.alignnone,figure.alignnone').removeClass('alignnone').addClass('aligncenter');
    // take care of Gutenberg images
    jQuery('figure:not(.alignleft,.alignright,.aligncenter,.alignwide,.alignfull)').addClass('aligncenter');
}

function pmb_add_header_classes(){
    jQuery('.pmb-posts h1').addClass('pmb-header');
    jQuery('.pmb-posts h2').addClass('pmb-header');
    jQuery('.pmb-posts h3').addClass('pmb-header');
    jQuery('.pmb-posts h4').addClass('pmb-header');
    jQuery('.pmb-posts h5').addClass('pmb-header');
}

function pmb_remove_hyperlinks(){
    jQuery('.pmb-posts a').contents().unwrap();
}

function pmb_fix_wp_videos(){
    // Remove inline styles that dynamically set height and width on WP Videos.
    // They use some Javascript that doesn't get enqueued, so better to let the browser decide their dimensions.
    jQuery('div.wp-video').css({'width': '','min-width':'', 'height': '', 'min-height': ''});
}

function pmb_convert_youtube_videos_to_images() {
    jQuery('div.wp-block-embed__wrapper iframe[src*=youtube]').unwrap().end();
    var selection = jQuery('iframe[src*=youtube]');
    selection.replaceWith(function(index){
        var title = this.title;
        var src = this.src;
        var youtube_id = src.replace('https://www.youtube.com/embed/','');
        youtube_id = youtube_id.substring(0, youtube_id.indexOf('?'));
        var image_url = 'https://img.youtube.com/vi/' + youtube_id + '/0.jpg';
        var link = 'https://youtube.com/watch?v=' + youtube_id;
        return '<div class="pmb-youtube-video-replacement-wrapper">' +
            '<div class="pmb-youtube-video-replacement-header"><div class="pmb-youtube-video-replacement-icon">🎦</div>' +
            '<div class="pmb-youtube-video-replacement-text"><b class="pmb-youtube-video-title">' + title + '</b><br/><a href="' + link +'" target="_blank">' + link + '</a>' +
            '</div>' +
            '</div>' +
            '<img class="pmb-youtube-video-replacement" src="' + image_url + '">' +
            '</div>';
    });

};

function pmb_resize_images(desired_max_height) {
    // Images that take up the entire page width are usually too big, so we usually want to shrink images and center them.
    // Plus, we want to avoid page breaks inside them. But tiny emojis shouldn't be shrunk, nor do we need to worry about
    // page breaks inside them. Images that are part of a gallery, or are pretty small and inline, also shouldn't be shrunk.
    // So first let's determine how tall the user requested the tallest image could be. Anything bigger than that
    // needs to be wrapped in a div (or figure) and resized.
    var wp_block_galleries = jQuery('.pmb-posts .wp-block-gallery:not(.pmb-dont-resize)');
    if(desired_max_height === 0){
        // Remove all images, except emojis.
        jQuery('.pmb-posts img:not(.emoji)').remove();
        wp_block_galleries.remove();
    } else{
        var big_images_in_figures = jQuery('.pmb-posts figure:not(.pmb-dont-resize) img:not(.emoji, div.tiled-gallery img, img.fg-image, img.size-thumbnail)').filter(function(){
            // only wrap images bigger than the desired maximum height in pixels.
            var element = jQuery(this);
            // ignore images in columns. If they get moved by prince-snap they can disappear
            if(element.parents('.wp-block-columns').length !== 0){
                return false;
            }
            return element.height() > desired_max_height;
        });
        // Images that are bigger than this will get wrapped in a 'pmb-image' div or figure in order to avoid
        // pagebreaks inside them
        var wrap_threshold = 300;
        // Keep track of images that are already wrapped in a caption. We don't need to wrap them in a div.
        var big_images_without_figures = jQuery('.pmb-posts img:not(.pmb-dont-resize)').filter(function() {
            var element = jQuery(this);
            // ignore images in columns. If they get moved by prince-snap they can disappear
            if(element.parents('.wp-block-columns').length !== 0){
                return false;
            }
            // If there's no figure, and the image is big enough, include it.
            if(element.parents('figure').length === 0
                && element.parents('div.wp-caption').length === 0
                && element.height() > wrap_threshold){
                return true;
            }
            return false;
        });
        var figures_containing_a_big_image = jQuery('figure.wp-caption:not(.pmb-dont-resize), figure.wp-block-image:not(.pmb-dont-resize), div.wp-caption:not(.pmb-dont-resize)').filter(function(){
            var element = jQuery(this);
            // ignore images in columns. If they get moved by prince-snap they can disappear
            if(element.parents('.wp-block-columns').length !== 0){
                return false;
            }
            // If there's a figure and the figure is big enough, include it.
            if(element.find('img').length && element.height() > wrap_threshold){
                return true;
            }
            return false;
        });
        figures_containing_a_big_image.addClass('pmb-image');
        figures_containing_a_big_image.css({
            'width':'auto'
        });
        pmb_force_resize_image = function (index, element) {
            var obj = jQuery(element);
            // Modify the CSS here. We could have written CSS rules but the selector worked slightly differently
            // in CSS compared to jQuery.
            // Let's make the image smaller and centered
            obj.css({
                'max-height': desired_max_height,
                'max-width:': '100%',
                'width':'auto',
            });
        };
        big_images_without_figures.wrap('<div class="pmb-image"></div>');
        big_images_without_figures.each(pmb_force_resize_image);
        big_images_in_figures.each(pmb_force_resize_image);
        // wp_block_galleries.each(function(){
        //     var obj = jQuery(this);
        //     // Galleries can't be resized by height (they just cut off
        //     // content underneath the set height). Need to use width.
        //     obj.css({
        //         'max-width': (desired_max_height * 1.25),
        //         'margin-right':'auto',
        //         'margin-left':'auto'
        //     });
        // });
    }
}

function pmb_load_avada_lazy_images(){
    // Load Avada's lazy images (they took out images' "src" attribute and put it into "data-orig-src". Put it back.)
    jQuery('img[data-orig-src]').each(function(index,element){
        var jqelement = jQuery(this);
        jqelement.attr('src',jqelement.attr('data-orig-src'));
        jqelement.attr('srcset',jqelement.attr('data-orig-src'));
    });
}

function pmb_reveal_dynamic_content(){
    // Expand all Arconix accordion parts (see https://wordpress.org/plugins/arconix-shortcodes/)
    jQuery('.arconix-accordion-content').css('display','block');
    // Reveal all https://wordpress.org/plugins/show-hidecollapse-expand/ content (the reveal buttons got removed in CSS)
    jQuery('div[id^="bg-showmore-hidden-"]').css('display','block');
    // Change canvases to regular images please! Helpful if someone is using chart.js or something else that
    // creates canvases
    setTimeout(function(){
        var canvases = jQuery('canvas').each(function(index){
            var chartImage = this.toDataURL();
            jQuery(this).after('<div class="pmb-image"><img src="' + chartImage + '"></div>');
            jQuery(this).remove();
        })
    },
    2000);
}

/**
 * Function used to loop over all the hyperlinks on the print page and call one of two callbacks on each of them.
 * The first callback is executed on links to content that are in this project, the second is used for everything
 * outside of this project. Each callback is passed the jQuery selection of the hyperlink and the URI to the element's ID
 * (if any exists), and the selector you can pass to jQuery to get the section element linked-to.
 * @param internal_hyperlink_callback
 * @param external_hyperlink_callback
 * @private
 */
function _pmb_for_each_hyperlink(internal_hyperlink_callback, external_hyperlink_callback){
    jQuery('.pmb-section a[href]:not(.pmb-leave-link)').each(function(index){
        var a = jQuery(this);
        // ignore invisible hyperlinks
        if(! a.text().trim()){
            return;
        }
        var id_selector = '#' + a.attr('href').replace(/([ #;?%&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1').replace('%','-');
        var id_url = '#' + a.attr('href');
        try{
            var matching_elements = jQuery(id_selector).length;
            // if that doesn't point to any internal posts, and it's an anchor link, then just use it as an anchor link
            if( matching_elements === 0 && a.attr('href')[0] === '#'){
                id_selector = id_url = a.attr('href');
                matching_elements = jQuery(id_selector).length;
            }
        }catch(exception){
            // somehow the query didn't work. Remove this link then.
            a.contents().unwrap();
        }
        if( matching_elements > 0){
            internal_hyperlink_callback(a, id_url, id_selector)
        } else {
            // external
            external_hyperlink_callback(a, id_url, id_selector);
        }
    });
}