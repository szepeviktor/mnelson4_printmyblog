jQuery(document).ready(function(){
    pmb_remove_unsupported_content();
    // Pretty up the page
    pmb_add_header_classes();
    if(pmb_design_options['default_alignment'] === 'center'){
        pmb_default_align_center();
    }
    // pmb_remove_hyperlinks();
    pmb_fix_wp_videos();
    pmb_resize_images(400);
    pmb_convert_youtube_videos_to_images();
    pmb_load_avada_lazy_images();
    pmb_replace_internal_links_with_page_refs_and_footnotes('footnote', 'footnote_ref');
    new PmbToc();
    jQuery(document).trigger('pmb_wrap_up');
});

