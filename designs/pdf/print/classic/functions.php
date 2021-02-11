<?php
// Add filters, action callback, and functions you want to use in your design.
// Note that this file only gets included when gnerating a new project, not on every pageload.
add_action(
	'pmb_pdf_generation_start',
	function(\PrintMyBlog\entities\ProjectGeneration $project_generation, \PrintMyBlog\orm\entities\Design $design){
	    global $pmb_design;
	    $pmb_design = $design;
	    add_action('wp_enqueue_scripts', 'pmb_enqueue_classic_script', 1001);
	},
	10,
	2
);

function pmb_enqueue_classic_script(){
    global $pmb_design;
    $css = pmb_design_styles($pmb_design)
        . "body{font-size:" . $pmb_design->getSetting('font_size') . ";}
			@page{
				size: " . $pmb_design->getSetting('page_width') . ' ' . $pmb_design->getSetting('page_height')
        ."}
			";
    if($pmb_design->getPmbMeta('paragraph_indent')){
        $css .= ' .pmb-article .post-inner p{
                        text-indent:3em;
                        margin:0;
                    }';
    }
    wp_add_inline_style(
        'pmb_print_common',
        $css
    );
    wp_localize_script(
        'pmb-design',
        'pmb_design_options',
        [
            'external_links' => $pmb_design->getSetting('external_links'),
            'internal_links' => $pmb_design->getSetting('internal_links'),
            'image_size' => $pmb_design->getSetting('image_size'),
            'default_alignment' => $pmb_design->getSetting('default_alignment'),
        ]
    );
}