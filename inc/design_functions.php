<?php

use PrintMyBlog\orm\entities\Design;

/**
 * @param \PrintMyBlog\orm\entities\Design $design
 * @return string CSS to include in the style
 */
function pmb_design_styles(\PrintMyBlog\orm\entities\Design $design)
{
    $css = '/* PMB design styles for ' . $design->getWpPost()->post_title . '*/' . $design->getSetting('custom_css');

    // image placement CSS
    // identify everything that could get snapped...
    $selectors_to_snap = [
        // Anything we mark as a pmb-image is candidate for snapping
        '.pmb-image',

        // Gutenberg
        '.wp-block-image', // Gutenberg image block. With or without caption
        '.wp-block-gallery', // Gutenberg gallery
        '.wp-block-table', // Gutenberg table

        // Classic Editor
        'img[class*=wp-image-]', // Classic Editor image
        '.wp-caption', // Classic Editor image with caption
        '.gallery', // Classic Editor gallery
    ];

    // ...and some exceptions
    $selectors_to_not_snap = [
        '.pmb-dont-snap', // PMB CSS class to make exceptions to not snap, even if everything else is getting snapped
        '.emoji', // emojis are tiny inline images. Never snap them
        'figure img', // don't snap images inside figures (ie, image-and-caption-combos). We snap the figure itself.
        '.wp-caption img', // don't snap images inside a Classic Editor image caption. We snap the caption wrapper itself.
        '.pmb-image img', // we snap the "pmg-image" wrapper, if there is one, not the image it wraps

        // various galleries, which get snapped as a unit
        'div.tiled-gallery img', // Jetpack's tiled gallery's images
        'img.fg-image', // FooGallery's images
    ];
    foreach ($selectors_to_snap as $key => $selector) {
        $selectors_to_snap[$key] = $selector . ':not(' . implode(', ', $selectors_to_not_snap) . ')';
    }
    $combined_selector = implode(', ', $selectors_to_snap);
    switch ($design->getPmbMeta('image_placement')) {
        case 'snap':
            $css .= $combined_selector . '{float:prince-snap;}';
            break;
        case 'snap-unless-fit':
            $css .= $combined_selector . '{float:prince-snap unless-fit;}';
            break;
        case 'dynamic-resize':
            $css .= '.pmb-posts .pmb-dynamic-resize img{height:' . $design->getSetting('dynamic_resize_min') . 'px;}';
            break;
        case 'default':
        default:
            // leave alone
    }

    // page reference CSS
    $page_ref_text = $design->getSetting('page_reference_text');
    if ($page_ref_text) {
        $css .= '.pmb-posts a.pmb-page-ref[href]::after{
            content: " ' . sprintf($page_ref_text, '" target-counter(attr(href), page) "') . '";
        }';
    }
    $css .= '.pmb-posts a[href].pmb-page-num::after{
        content: target-counter(attr(href), page);
    }';
    // instruct PMB print service to add "powered by" for free users and cheap plans
    $show_powered_by = true;
    if (pmb_fs()->is_plan__premium_only('hobby')) {
        $show_powered_by = false;
    }
    if ($design->getSetting('powered_by') || $show_powered_by) {
        $css .= "@page:first{
            @bottom{
                content:'" . wp_strip_all_tags(__('Powered by Print My Blog Pro & WordPress', 'print-my-blog')) . "';
                color:gray;
                font-style:italic;
            }
        }";
    }
    return $css;
}

/**
 * Gets an array of all the design settings plus a few other things the JS might want when rendering a design.
 * @param Design $design
 * @return array keys are setting names, values are their values, plus a few other odds-n-ends
 * @throws Exception
 */
function pmb_design_settings(Design $design)
{
    $settings = $design->getSettings();
    $settings['domain'] = pmb_site_domain();
    unset($settings['custom_css'], $settings['use_theme']);
    return apply_filters(
        'pmb_design_settings',
        $settings,
        $design
    );
}

/**
 * Gets the site's domain (without the http:// or https:// at the beginning)
 *
 * @return string
 */
function pmb_site_domain()
{
    return str_replace(
        [
            'http://',
            'https://',
        ],
        '',
        site_url()
    );
}